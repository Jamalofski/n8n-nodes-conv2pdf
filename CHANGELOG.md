# Changelog

## 1.1.0 (unreleased)

The node now covers all 19 tools of the conv2pdf API.

- **E-Book > Convert to PDF** converts an EPUB e-book to PDF on A4 pages, with its table of contents and links.
- **Document > Convert PostScript to PDF** converts a PostScript (`.ps`) or EPS file, keeping its text as text and its drawings as vectors.
- **Web Page > Convert URL to PDF** converts the public web page at an address, with no input file, and **Web Page > Convert HTML File to PDF** converts an HTML file. Both print the page as a browser would.
- **PDF > Split** puts every page of a PDF in its own PDF file, returned in a ZIP file.
- **PDF > Extract Pages** calls the `extract-pages` tool of the API, and keeps the pages in the order you write them.
- The Office Document resource is now called Document, and its operation Convert Office Document to PDF. Workflows built with 1.0 keep working unchanged.
- **Document > Convert Office Document to PDF** also converts Apple Pages documents.
- **Options > PDF Password** opens a PDF that asks for a password on Add Page Numbers, Add Watermark, Compress, Convert to Images, Convert to Word, Extract Pages, Rotate and Split.
- A refused web page address or page range, a blank page and a single-page PDF to split get their own messages, which say what to change. The README now says which failures count against the quota.
- **PDF > Unlock** takes an empty password, for a PDF that only restricts printing or copying.
- The credential and the invalid key message point to the **Developer** tab of the dashboard, where a key is created and shown only once.
- The Protect password needs 6 characters, as the API requires. A missing PDF password, a DRM-protected e-book and a Numbers or Keynote file get their own messages.

## 1.0.1 (2026-10-09)

- The codex file names the node by its full identifier, `n8n-nodes-conv2pdf.conv2pdf`, as n8n's review asks. No change to the node itself.

## 1.0.0 (2026-09-26)

First release.

- One operation per conv2pdf tool: Office documents, images and HEIC photos to PDF, HEIC to JPG, and for PDFs merge, extract pages, compress, protect, unlock, rotate, add a watermark or page numbers, convert to Word or to images.
- Each conversion reads the input file from a binary field, returns the result in a binary field and deletes the job from the conv2pdf server, unless told to keep it. Merge takes one file per input item or several binary fields of the same item.
- **Account > Get Quota** returns the plan, usage and limits of the API key. The credential test uses the same endpoint, which uses no conversion.
- Waits for `Retry-After` when the API rate-limits the key or its queue is full.
