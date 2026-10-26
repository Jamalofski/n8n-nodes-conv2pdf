# n8n-nodes-conv2pdf

Official [n8n](https://n8n.io) node for the [conv2pdf API](https://conv2pdf.com/en/api/): convert Word, Excel, PowerPoint, Pages, images, e-books, PostScript, HTML files and web pages to PDF, convert PDF to Word, and merge, split, compress, protect, rotate or number PDFs, straight from your workflows. Processing runs on OVHcloud servers in France: no transfer outside the EU, no US service in the chain.

[Installation](#installation) · [Operations](#operations) · [Credentials](#credentials) · [Usage](#usage) · [Output](#output) · [Compatibility](#compatibility) · [Resources](#resources)

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/): in n8n, open **Settings > Community Nodes**, select **Install** and enter `n8n-nodes-conv2pdf`.

## Operations

| Resource | Operation | What it does |
|---|---|---|
| Document | Convert Office Document to PDF | Word, Excel, PowerPoint, OpenDocument or Apple Pages file to PDF |
| Document | Convert PostScript to PDF | PostScript (`.ps`) or EPS file to PDF, text kept as text and drawings as vectors |
| E-Book | Convert to PDF | EPUB e-book to PDF on A4 pages, with its table of contents and links |
| Image | Convert to PDF | PNG, JPG, WebP, GIF or TIFF image to PDF |
| Image | Convert HEIC to JPG | iPhone HEIC or HEIF photo to JPG |
| Image | Convert HEIC to PDF | iPhone HEIC or HEIF photo to PDF |
| PDF | Add Page Numbers | Number the pages, as "3 / 12" or "3", bottom center, left or right |
| PDF | Add Watermark | Stamp a text of up to 50 characters on every page |
| PDF | Compress | Reduce the size, keeping images at 72, 150 or 300 DPI |
| PDF | Convert to Images | One PNG or JPG per page, in a ZIP file |
| PDF | Convert to Word | Editable DOCX document |
| PDF | Extract Pages | Keep the pages you list, such as `1-5,7,10-12`, in a new PDF, in the order you write them |
| PDF | Merge | Combine several PDFs into one |
| PDF | Protect | Set a password, and optionally forbid printing or copying |
| PDF | Rotate | Turn every page by 90, 180 or 270 degrees |
| PDF | Split | Every page in its own PDF file, in a ZIP file |
| PDF | Unlock | Remove a password you know, or the printing and copying restrictions |
| Web Page | Convert URL to PDF | The web page at an address, as it prints in a browser |
| Web Page | Convert HTML File to PDF | An HTML file, as it prints in a browser |
| Account | Get Quota | Plan, usage and limits of the API key |

## Credentials

1. Create an account on [conv2pdf.com](https://conv2pdf.com/en/api/). The Dev plan includes 300 free conversions, valid for 12 months; see [pricing](https://conv2pdf.com/en/api/pricing/) for the paid plans.
2. Create an API key, which starts with `cpdf_live_`, in the **Developer** tab of your dashboard. conv2pdf shows it only once, at creation.
3. In n8n, create a **Conv2pdf API** credential and paste the key. The credential test reads your quota, which uses no conversion.

## Usage

- **Input file.** Each file operation reads the file from a binary field of the input item, `data` by default, as produced by the Read Files, HTTP Request or Google Drive nodes. conv2pdf checks the content of the file, not its name.
- **Protected PDFs.** Add Page Numbers, Add Watermark, Compress, Convert to Images, Convert to Word, Extract Pages, Rotate and Split open a PDF that asks for a password when you give it in **Options > PDF Password**. The result has no password. For Merge, unlock the protected PDFs first.
- **Pages and Numbers.** A Pages document keeps its `.pages` name in the binary field: only the name tells it from a Numbers spreadsheet, which conv2pdf does not convert, like Keynote presentations.
- **Web pages.** Convert URL to PDF takes the address of a public web page, which conv2pdf opens without signing in; addresses of a private or local network are refused. Both web page operations print the page as a browser would, with its print styles: text stays selectable and links clickable, the page size and margins come from the page, A4 with 1 cm margins otherwise. The page cannot read local files or reach a private network.
- **Merge.** In *One File per Input Item* mode, the node merges the file of every input item, in order, into a single PDF. In *Several Files in Each Item* mode, it merges the binary fields you list, such as `data, data_1`, into one PDF per item. The Dev plan merges 2 files at a time, paid plans up to 20.
- **Result.** The converted file comes out in the `data` binary field, or the one set in **Options**. The node then deletes the job from conv2pdf; turn **Delete From Server After Download** off to keep it, and conv2pdf deletes it after one hour.
- **Limits.** Files can weigh up to 10 MB on the Dev plan and 200 MB on paid plans. The API accepts 20 conversions per minute per API key: when it asks to slow down, or when its queue is full, the node waits for the delay the API gives (`Retry-After`) and tries again, up to five times.
- **Errors.** With the node's **On Error** setting on *Continue*, a failed item comes out with an `error` field and the others carry on. A rejected API key, a spent quota, expired trial credits or an unreachable API stop the requests for the rest of the run. A failure on conv2pdf's side, a file refused on arrival and a refused setting, such as a page range, do not count against your quota; a file refused after it has been read (unreadable, scanned, too many pages) does.
- **AI agents.** The n8n AI Agent can use the node as a tool, for example to check the remaining quota. File operations need their input file in a binary field, which agents do not pass.

Every request carries `User-Agent: n8n-nodes-conv2pdf/<version>`. Mention it when you contact support: it tells your calls apart in the API's logs.

## Output

Each output item carries the converted file in its binary field, and the conversion job as returned by the API in its JSON:

| Field | Meaning |
|---|---|
| `job_id` | Identifier of the conversion job |
| `size_bytes` | Size of the converted file |
| `quota` | Plan, usage and limits of the API key after this conversion |

**Account > Get Quota** returns the `quota` object on its own. The full reference is in the [API documentation](https://conv2pdf.com/en/api/docs/).

## Compatibility

Built and tested against `n8n-workflow` 2.40.

## Resources

- [conv2pdf API documentation](https://conv2pdf.com/en/api/docs/)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## Support

Open an [issue](https://github.com/jamalofski/n8n-nodes-conv2pdf/issues) or write to contact@conv2pdf.com.

## License

MIT, see [LICENSE](LICENSE).
