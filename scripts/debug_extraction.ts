
import { parsePdf } from '../lib/analyzer/pdfParser';
import { extractQuestions } from '../lib/analyzer/questionExtractor';
import { readFile } from 'fs/promises';
import { join } from 'path';

async function testExtraction() {
    const filename = process.argv[2];
    if (!filename) {
        console.error("Please provide filename from uploads/ folder");
        process.exit(1);
    }

    const path = join(process.cwd(), 'uploads', filename);
    console.log(`Reading: ${path}`);

    try {
        const buffer = await readFile(path);
        console.log(`File Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

        console.log("Parsing PDF...");
        const text = await parsePdf(buffer);

        console.log("\n--- RAW TEXT START (First 500 chars) ---");
        console.log(text.substring(0, 500));
        console.log("--- RAW TEXT END ---\n");
        console.log(`Total Characters: ${text.length}`);

        if (text.trim().length === 0) {
            console.error("CRITICAL: Extracted text is empty! This might be a scanned PDF (Image).");
        } else {
            console.log("Extracting Questions...");
            const questions = extractQuestions(text);
            console.log(`Found ${questions.length} questions.`);

            if (questions.length === 0) {
                console.log("Reason: Logic found 0 questions. Check text format.");
            } else {
                console.log("Sample:", questions[0]);
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testExtraction();
