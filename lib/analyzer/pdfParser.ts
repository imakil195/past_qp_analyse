// Using pdf2json - more stable for Next.js server environment
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFParser = require('pdf2json');

/**
 * Extracts raw text from a PDF buffer using pdf2json.
 * @param buffer - The PDF file buffer.
 * @returns The extracted text content.
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);

        pdfParser.on("pdfParser_dataError", (errData: any) => {
            const errorMsg = errData?.parserError || 'Unknown error';
            console.error("PDF Parser Error:", errData);

            // Provide user-friendly error messages
            if (errorMsg.includes('Invalid XRef') || errorMsg.includes('XRef')) {
                reject(new Error('This PDF appears to be corrupted or scanned. Please try:\n1. Re-downloading the PDF from the original source\n2. Using a different PDF viewer to save/export it\n3. Ensuring the PDF contains selectable text (not just images)'));
            } else {
                reject(new Error(`PDF parsing failed: ${errorMsg}`));
            }
        });

        pdfParser.on("pdfParser_dataReady", () => {
            try {
                const rawText = pdfParser.getRawTextContent();

                if (!rawText || rawText.trim().length < 50) {
                    reject(new Error('PDF appears to contain no readable text. It may be a scanned image. Please upload a text-based PDF.'));
                    return;
                }

                console.log(`PDF parsed successfully, extracted ${rawText.length} characters`);
                resolve(rawText);
            } catch (e: any) {
                console.error("Text extraction error:", e);
                reject(new Error(`Failed to extract text: ${e.message}`));
            }
        });

        try {
            pdfParser.parseBuffer(buffer);
        } catch (e: any) {
            console.error("Parse buffer error:", e);
            reject(new Error(`Failed to parse buffer: ${e.message}`));
        }
    });
}
