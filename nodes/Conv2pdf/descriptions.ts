import type { INodeProperties } from 'n8n-workflow';

export type FileResource = 'document' | 'ebook' | 'image' | 'pdf' | 'webPage';

export interface OperationSpec {
	/** The conv2pdf tool behind the operation: the `:tool` of POST /v1/convert/:tool. */
	tool: string;
	name: string;
	action: string;
	description: string;
	/** The tool takes a web page address in the `url` field instead of a file. */
	noFile?: boolean;
}

// One operation per conv2pdf tool, so each one shows up as its own action in the
// nodes panel and in the AI Agent tool list.
export const OPERATIONS: Record<FileResource, Record<string, OperationSpec>> = {
	document: {
		convertToPdf: {
			tool: 'office-to-pdf',
			name: 'Convert Office Document to PDF',
			action: 'Convert an Office document to PDF',
			description: 'Convert a Word, Excel, PowerPoint, OpenDocument or Apple Pages file to PDF',
		},
		postscriptToPdf: {
			tool: 'ps-to-pdf',
			name: 'Convert PostScript to PDF',
			action: 'Convert a PostScript or EPS file to PDF',
			description:
				'Convert a PostScript (.ps) or EPS file to PDF, keeping its text as text and its drawings as vectors',
		},
	},
	ebook: {
		convertToPdf: {
			tool: 'epub-to-pdf',
			name: 'Convert to PDF',
			action: 'Convert an e-book to PDF',
			description: 'Convert an EPUB e-book to PDF, with its table of contents and links',
		},
	},
	image: {
		convertToPdf: {
			tool: 'image-to-pdf',
			name: 'Convert to PDF',
			action: 'Convert an image to PDF',
			description: 'Convert a PNG, JPG, WebP, GIF or TIFF image to PDF',
		},
		heicToJpg: {
			tool: 'heic-to-jpg',
			name: 'Convert HEIC to JPG',
			action: 'Convert a HEIC photo to JPG',
			description: 'Convert an iPhone HEIC or HEIF photo to JPG',
		},
		heicToPdf: {
			tool: 'heic-to-pdf',
			name: 'Convert HEIC to PDF',
			action: 'Convert a HEIC photo to PDF',
			description: 'Convert an iPhone HEIC or HEIF photo to PDF',
		},
	},
	pdf: {
		addPageNumbers: {
			tool: 'page-numbers-pdf',
			name: 'Add Page Numbers',
			action: 'Add page numbers to a PDF',
			description: 'Number the pages of a PDF',
		},
		addWatermark: {
			tool: 'watermark-pdf',
			name: 'Add Watermark',
			action: 'Add a text watermark to a PDF',
			description: 'Stamp a text watermark on every page of a PDF',
		},
		compress: {
			tool: 'compress-pdf',
			name: 'Compress',
			action: 'Compress a PDF',
			description: 'Reduce the size of a PDF',
		},
		convertToImages: {
			tool: 'pdf-to-image',
			name: 'Convert to Images',
			action: 'Convert a PDF to images',
			description: 'Turn each page of a PDF into a PNG or JPG image, returned in a ZIP file',
		},
		convertToWord: {
			tool: 'pdf-to-word',
			name: 'Convert to Word',
			action: 'Convert a PDF to Word',
			description: 'Convert a PDF to an editable Word (DOCX) document',
		},
		extractPages: {
			tool: 'extract-pages',
			name: 'Extract Pages',
			action: 'Extract pages from a PDF',
			description: 'Copy the pages you choose, in the order you write them, into a new PDF',
		},
		merge: {
			tool: 'merge-pdf',
			name: 'Merge',
			action: 'Merge PDFs',
			description: 'Combine several PDFs into one',
		},
		protect: {
			tool: 'protect-pdf',
			name: 'Protect',
			action: 'Protect a PDF with a password',
			description: 'Encrypt a PDF with a password and optional restrictions',
		},
		split: {
			tool: 'split-pdf',
			name: 'Split',
			action: 'Split a PDF into one file per page',
			description: 'Put every page of a PDF in its own PDF file, returned in a ZIP file',
		},
		rotate: {
			tool: 'rotate-pdf',
			name: 'Rotate',
			action: 'Rotate a PDF',
			description: 'Rotate every page of a PDF',
		},
		unlock: {
			tool: 'unlock-pdf',
			name: 'Unlock',
			action: 'Remove the password from a PDF',
			description: 'Remove the password from a PDF you know the password of',
		},
	},
	webPage: {
		convertUrlToPdf: {
			tool: 'url-to-pdf',
			name: 'Convert URL to PDF',
			action: 'Convert a web page to PDF',
			description: 'Convert the web page at an address to PDF, as it prints in a browser',
			noFile: true,
		},
		convertHtmlToPdf: {
			tool: 'html-to-pdf',
			name: 'Convert HTML File to PDF',
			action: 'Convert an HTML file to PDF',
			description: 'Convert an HTML file to PDF, as it prints in a browser',
		},
	},
};

/** The PDF operations whose tool opens a protected PDF when it gets its password. */
export const PDF_PASSWORD_OPERATIONS = [
	'addPageNumbers',
	'addWatermark',
	'compress',
	'convertToImages',
	'convertToWord',
	'extractPages',
	'rotate',
	'split',
];

const RESOURCE_OPTIONS = [
	{ name: 'Document', value: 'document' },
	{ name: 'E-Book', value: 'ebook' },
	{ name: 'Image', value: 'image' },
	{ name: 'PDF', value: 'pdf' },
	{ name: 'Web Page', value: 'webPage' },
	{ name: 'Account', value: 'account' },
];

function operationOptions(resource: FileResource) {
	return Object.entries(OPERATIONS[resource]).map(([value, spec]) => ({
		name: spec.name,
		value,
		description: spec.description,
		action: spec.action,
	}));
}

const show = (resource: FileResource, operation: string[]) => ({
	show: { resource: [resource], operation },
});

// Every file operation reads one binary field, except Merge, which has its own inputs,
// and Convert URL to PDF, which takes an address and no file.
const fileOperations = (resource: FileResource) =>
	Object.entries(OPERATIONS[resource])
		.filter(([operation, spec]) => operation !== 'merge' && !spec.noFile)
		.map(([operation]) => operation);

const SINGLE_FILE_OPERATIONS: Array<[FileResource, string[]]> = [
	['document', fileOperations('document')],
	['ebook', fileOperations('ebook')],
	['image', fileOperations('image')],
	['pdf', fileOperations('pdf')],
	['webPage', fileOperations('webPage')],
];

export const properties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: RESOURCE_OPTIONS,
		default: 'document',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['document'] } },
		options: operationOptions('document'),
		default: 'convertToPdf',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['ebook'] } },
		options: operationOptions('ebook'),
		default: 'convertToPdf',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['image'] } },
		options: operationOptions('image'),
		default: 'convertToPdf',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['pdf'] } },
		options: operationOptions('pdf'),
		default: 'merge',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['webPage'] } },
		options: operationOptions('webPage'),
		default: 'convertUrlToPdf',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['account'] } },
		options: [
			{
				name: 'Get Quota',
				value: 'getQuota',
				description: 'Get the plan, usage and limits of the API key',
				action: 'Get the quota of the API key',
			},
		],
		default: 'getQuota',
	},
	...SINGLE_FILE_OPERATIONS.map(
		([resource, operations]): INodeProperties => ({
			displayName: 'Input Binary Field',
			name: 'binaryPropertyName',
			type: 'string',
			required: true,
			default: 'data',
			description: 'The name of the input binary field that holds the file to process',
			displayOptions: show(resource, operations),
		}),
	),

	// Merge
	{
		displayName: 'Merge Mode',
		name: 'mergeMode',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'One File per Input Item',
				value: 'items',
				description: 'Merge the file of every input item, in order, into a single PDF',
			},
			{
				name: 'Several Files in Each Item',
				value: 'fields',
				description: 'Merge several binary fields of the same item, one PDF per item',
			},
		],
		default: 'items',
		displayOptions: show('pdf', ['merge']),
	},
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		description: 'The name of the binary field that holds the PDF in each input item',
		displayOptions: { show: { resource: ['pdf'], operation: ['merge'], mergeMode: ['items'] } },
	},
	{
		displayName: 'Input Binary Fields',
		name: 'binaryPropertyNames',
		type: 'string',
		required: true,
		default: 'data',
		placeholder: 'data, data_1, data_2',
		description: 'The binary fields to merge, separated by commas, in the order of the output',
		displayOptions: { show: { resource: ['pdf'], operation: ['merge'], mergeMode: ['fields'] } },
	},

	// Extract Pages
	{
		displayName: 'Pages',
		name: 'ranges',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1-5,7,10-12',
		description:
			'The pages to keep, in the order you want them, as page numbers and ranges separated by commas. 11- runs to the last page.',
		displayOptions: show('pdf', ['extractPages']),
	},

	// Convert URL to PDF
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com/page',
		description:
			'The address of the public web page to convert, starting with https:// or http://. The page is opened without signing in.',
		displayOptions: show('webPage', ['convertUrlToPdf']),
	},

	// Compress
	{
		displayName: 'Quality',
		name: 'quality',
		type: 'options',
		options: [
			{ name: 'Low (72 DPI, Smallest File)', value: 'low' },
			{ name: 'Medium (150 DPI)', value: 'medium' },
			{ name: 'High (300 DPI, Best Quality)', value: 'high' },
		],
		default: 'medium',
		description: 'The resolution kept for the images inside the PDF',
		displayOptions: show('pdf', ['compress']),
	},

	// Protect
	{
		displayName: 'Password',
		name: 'password',
		type: 'string',
		typeOptions: { password: true },
		required: true,
		default: '',
		description: 'The password to set, from 6 to 64 characters',
		displayOptions: show('pdf', ['protect']),
	},
	{
		displayName: 'Restrictions',
		name: 'restrictions',
		type: 'collection',
		placeholder: 'Add Restriction',
		default: {},
		displayOptions: show('pdf', ['protect']),
		options: [
			{
				displayName: 'Prevent Copying',
				name: 'preventCopy',
				type: 'boolean',
				default: false,
				description: 'Whether to forbid copying text from the PDF',
			},
			{
				displayName: 'Prevent Printing',
				name: 'preventPrint',
				type: 'boolean',
				default: false,
				description: 'Whether to forbid printing the PDF',
			},
		],
	},

	// Unlock
	{
		displayName: 'Password',
		name: 'password',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		description:
			'The current password of the PDF. Leave it empty for a PDF that opens without a password but restricts printing or copying.',
		displayOptions: show('pdf', ['unlock']),
	},

	// Rotate
	{
		displayName: 'Rotation',
		name: 'rotation',
		type: 'options',
		options: [
			{ name: '90° Clockwise', value: '90' },
			{ name: '180°', value: '180' },
			{ name: '270° Clockwise', value: '270' },
		],
		default: '90',
		displayOptions: show('pdf', ['rotate']),
	},

	// Add Watermark
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'CONFIDENTIAL',
		description: 'The watermark text, up to 50 characters',
		displayOptions: show('pdf', ['addWatermark']),
	},

	// Add Page Numbers
	{
		displayName: 'Format',
		name: 'numberFormat',
		type: 'options',
		options: [
			{ name: 'Page Number and Total (3 / 12)', value: 'full' },
			{ name: 'Page Number Only', value: 'simple' },
		],
		default: 'full',
		displayOptions: show('pdf', ['addPageNumbers']),
	},
	{
		displayName: 'Position',
		name: 'position',
		type: 'options',
		options: [
			{ name: 'Bottom Center', value: 'bottom-center' },
			{ name: 'Bottom Left', value: 'bottom-left' },
			{ name: 'Bottom Right', value: 'bottom-right' },
		],
		default: 'bottom-center',
		displayOptions: show('pdf', ['addPageNumbers']),
	},

	// Convert to Images
	{
		displayName: 'Image Format',
		name: 'imageFormat',
		type: 'options',
		options: [
			{ name: 'PNG', value: 'png' },
			{ name: 'JPG', value: 'jpg' },
		],
		default: 'png',
		displayOptions: show('pdf', ['convertToImages']),
	},

	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { hide: { resource: ['account'] } },
		options: [
			{
				displayName: 'Delete From Server After Download',
				name: 'deleteAfterDownload',
				type: 'boolean',
				default: true,
				description:
					'Whether to delete the job and its file from conv2pdf once the node has downloaded the result. Otherwise conv2pdf deletes them after one hour.',
			},
			{
				displayName: 'PDF Password',
				name: 'pdfPassword',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'The password of a PDF that asks for one to open. The result has no password.',
				displayOptions: { show: { '/resource': ['pdf'], '/operation': PDF_PASSWORD_OPERATIONS } },
			},
			{
				displayName: 'Put Output File in Field',
				name: 'outputBinaryPropertyName',
				type: 'string',
				default: 'data',
				description: 'The name of the output binary field for the result file',
			},
		],
	},
];
