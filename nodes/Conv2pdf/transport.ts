import type { IDataObject, IExecuteFunctions, IHttpRequestOptions, JsonObject } from 'n8n-workflow';
import { NodeApiError, sleep } from 'n8n-workflow';

import { version } from '../../package.json';

const BASE_URL = 'https://api.conv2pdf.com/v1';

// The API answers 429 `rate_limited` (20 conversions per minute per key) and 503
// `server_busy` (conversion queue full) with a Retry-After header: both are safe to
// retry, no conversion was counted.
const MAX_RETRIES = 5;
const MAX_RETRY_AFTER_SECONDS = 60;

// The server's proxy gives a request 90 seconds.
const REQUEST_TIMEOUT_MS = 120_000;

const USER_AGENT = `n8n-nodes-conv2pdf/${version}`;

const PRICING_URL = 'https://conv2pdf.com/en/api/pricing/';

// Once one of these comes back, no other request of the run can succeed.
const STOP_CODES = new Set([
	'missing_bearer_token',
	'invalid_api_key',
	'account_not_provisioned',
	'quota_exceeded',
	'credits_expired',
]);

export interface FullResponse {
	body: unknown;
	headers: Record<string, string | string[] | undefined>;
	statusCode: number;
}

function isObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The JSON body of a response, also when it was requested as binary. */
export function jsonBody(response: FullResponse): IDataObject {
	const { body } = response;
	if (isObject(body) && !Buffer.isBuffer(body)) return body;
	if (Buffer.isBuffer(body) || body instanceof ArrayBuffer) {
		try {
			const parsed: unknown = JSON.parse(Buffer.from(body as ArrayBuffer).toString('utf8'));
			if (isObject(parsed)) return parsed;
		} catch {
			// Not JSON: an HTML error page from a proxy, for example.
		}
	}
	return {};
}

export function errorCode(response: FullResponse): string | undefined {
	const code = jsonBody(response).error;
	return typeof code === 'string' ? code : undefined;
}

export function header(response: FullResponse, name: string): string | undefined {
	const value = response.headers[name];
	return Array.isArray(value) ? value[0] : value;
}

function retryAfterMs(response: FullResponse): number {
	const fromBody = jsonBody(response).retry_after;
	const seconds = Number(header(response, 'retry-after') ?? fromBody);
	const wait =
		Number.isFinite(seconds) && seconds >= 0
			? Math.min(seconds, MAX_RETRY_AFTER_SECONDS)
			: MAX_RETRY_AFTER_SECONDS;
	return wait * 1000 + 250;
}

const MESSAGES: Record<string, [message: string, description?: string]> = {
	missing_bearer_token: ['Missing conv2pdf API key'],
	invalid_api_key: [
		'Invalid conv2pdf API key',
		'Check the API key in the conv2pdf credential. You can create a new one in the Developer tab of your conv2pdf dashboard.',
	],
	account_not_provisioned: ['This API key has no conv2pdf API account'],
	quota_exceeded: [
		'The conv2pdf quota of this API key is used up',
		`Paid plans renew their quota every month, the Dev trial does not. Plans: ${PRICING_URL}`,
	],
	credits_expired: [
		'The conv2pdf trial credits have expired',
		`Choose a plan to keep converting: ${PRICING_URL}`,
	],
	rate_limited: [
		'conv2pdf rate limit reached',
		'The API accepts 20 conversions per minute per API key. The node waited and retried several times: another workflow may be using the same key.',
	],
	server_busy: [
		'conv2pdf is busy',
		'The node waited and retried several times. Try again in a minute.',
	],
	file_too_large: [
		'The file is larger than your conv2pdf plan allows',
		`The Dev plan accepts 10 MB per file, paid plans 200 MB: ${PRICING_URL}`,
	],
	plan_limit_files: [
		'Your conv2pdf plan does not allow that many files in one request',
		`The Dev plan merges 2 files at a time, paid plans up to 20: ${PRICING_URL}`,
	],
	not_enough_files: ['This operation needs more files', 'Merging needs at least 2 PDFs.'],
	too_many_files: ['This operation received too many files', 'Merging accepts up to 20 PDFs.'],
	unsupported_content: [
		'The file does not match this operation',
		'conv2pdf checks the content of the file, not its name: make sure the input binary field holds the expected type of file.',
	],
	empty_file: ['The file is empty'],
	password_protected: [
		'The file is protected with a password',
		'For a PDF, remove the password first with the PDF > Unlock operation. A DRM-protected e-book or a locked iWork document cannot be converted.',
	],
	needs_password: [
		'The PDF asks for a password to open',
		'Enter it in Options > PDF Password, or in the Password field of the Unlock operation.',
	],
	wrong_password: ['Wrong password for this PDF'],
	password_too_short: ['The password must be at least 6 characters long'],
	password_too_long: ['The password is too long', 'Use 64 characters at most.'],
	pdf_already_protected: ['This PDF is already protected with a password'],
	pdf_not_protected: ['This PDF has no password to remove'],
	pdf_scanned_needs_ocr: [
		'This PDF is a scan without text, it cannot be converted to Word',
		'Only PDFs that contain real text can be converted to Word.',
	],
	pdf_too_many_pages: ['The PDF has too many pages for this operation'],
	too_many_pages: ['The document has too many pages for this operation'],
	epub_blank_output: [
		'This e-book cannot be converted',
		'Its pages are full-screen images (comics, picture books, manga), and their layout does not survive the conversion to PDF.',
	],
	epub_too_long: ['The e-book is too long', 'conv2pdf converts up to 1,500 pages at once.'],
	invalid_page_range: [
		'Invalid page range',
		'Use page numbers and ranges, for example 1-5,7,10-12.',
	],
	unsupported_characters: ['The watermark text contains characters that cannot be rendered'],
	output_too_large: ['The result is too large to be delivered'],
	conversion_failed: [
		'conv2pdf could not process this file',
		'Failed conversions do not count against your quota.',
	],
	conversion_timeout: [
		'The conversion took too long and was stopped',
		'Failed conversions do not count against your quota.',
	],
	file_expired: ['The converted file is no longer available'],
	job_deleted: ['The conversion was deleted'],
};

// What conv2pdf found in a file that does not match the operation (`detected_type`).
const CONTENT_HINTS: Record<string, string> = {
	epub: 'This file is an EPUB e-book: use the E-Book > Convert to PDF operation.',
	iwork_numbers:
		'This file is a Numbers spreadsheet, which conv2pdf does not convert. Open it in Numbers and choose File > Export To > PDF.',
	iwork_keynote:
		'This file is a Keynote presentation, which conv2pdf does not convert. Open it in Keynote and choose File > Export To > PDF.',
	iwork: 'conv2pdf converts Apple Pages documents only, named with their .pages extension.',
};

const stopErrors = new WeakSet<NodeApiError>();

export function apiError(
	this: IExecuteFunctions,
	response: FullResponse,
	itemIndex: number,
): NodeApiError {
	const body = jsonBody(response);
	const code = errorCode(response);
	const [message, generalDescription] = (code && MESSAGES[code]) || [
		code ? `conv2pdf error: ${code}` : `conv2pdf returned HTTP ${response.statusCode}`,
	];
	const detected = String(body.detected_type);
	const description =
		code === 'unsupported_content' && Object.prototype.hasOwnProperty.call(CONTENT_HINTS, detected)
			? CONTENT_HINTS[detected]
			: generalDescription;
	const error = new NodeApiError(this.getNode(), body as JsonObject, {
		message,
		description,
		httpCode: String(response.statusCode),
		itemIndex,
	});
	if (code && STOP_CODES.has(code)) stopErrors.add(error);
	return error;
}

/** Whether the error means that no other request of the run can succeed. */
export function stopsTheRun(error: unknown): boolean {
	return error instanceof NodeApiError && stopErrors.has(error);
}

export async function conv2pdfRequest(
	this: IExecuteFunctions,
	options: IHttpRequestOptions,
): Promise<FullResponse> {
	const request: IHttpRequestOptions = {
		...options,
		url: `${BASE_URL}${options.url}`,
		headers: { ...options.headers, 'User-Agent': USER_AGENT },
		timeout: REQUEST_TIMEOUT_MS,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	};

	for (let attempt = 0; ; attempt++) {
		const response = (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'conv2pdfApi',
			request,
		)) as FullResponse;
		const code = errorCode(response);
		const retryable =
			(response.statusCode === 429 && code === 'rate_limited') ||
			(response.statusCode === 503 && code === 'server_busy');
		if (!retryable || attempt >= MAX_RETRIES) return response;
		await sleep(retryAfterMs(response));
	}
}

/** The file name from a Content-Disposition header, preferring its UTF-8 form. */
export function fileNameFromDisposition(disposition: string | undefined): string | undefined {
	if (!disposition) return undefined;
	const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
	if (encoded) {
		try {
			return decodeURIComponent(encoded[1]);
		} catch {
			// Badly encoded: fall back to the plain ASCII name below.
		}
	}
	return /filename="([^"]*)"/i.exec(disposition)?.[1];
}
