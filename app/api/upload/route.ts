import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db';
import QuestionPaper from '@/models/QuestionPaper';
import Question from '@/models/Question';
import Subject from '@/models/Subject';
import { parsePdf } from '@/lib/analyzer/pdfParser';
import { extractQuestions } from '@/lib/analyzer/questionExtractor';
import { mapQuestionToTopic } from '@/lib/analyzer/topicMapper';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // Parse FormData
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const subjectId = formData.get('subjectId') as string;
        const year = parseInt(formData.get('year') as string, 10);
        const semester = formData.get('semester') as string || 'Unknown';

        if ((!subjectId && !formData.get('subjectName')) || !file || !year) {
            return NextResponse.json({ error: 'Missing required fields (file, year, and subjectId/subjectName)' }, { status: 400 });
        }

        // Handle Subject Creation/Lookup if needed
        let finalSubjectId = subjectId;
        if (!finalSubjectId && formData.get('subjectName')) {
            let name = (formData.get('subjectName') as string).trim();
            // Normalize internal spaces
            name = name.replace(/\s+/g, ' ');

            // Case insensitive strict search
            let sub = await Subject.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

            if (!sub) {
                // Create new only if strictly not found
                const code = name.substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900);
                sub = await Subject.create({ name, code });
                console.log(`[Upload] Created New Subject: ${name} (${sub._id})`);
            } else {
                console.log(`[Upload] Merged into Existing Subject: ${sub.name} (${sub._id})`);
            }
            finalSubjectId = sub._id.toString();
        }

        // validate PDF
        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
        }

        // Save File
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure uploads directory exists
        const uploadDir = join(process.cwd(), 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const filePath = join(uploadDir, fileName);

        await writeFile(filePath, buffer);

        // Create QuestionPaper Record
        const questionPaper = await QuestionPaper.create({
            subjectId: finalSubjectId,
            year,
            semester,
            filePath,
            originalName: file.name,
            processed: false,
        });

        // Parse and Analyze
        const rawText = await parsePdf(buffer);

        // Validation: Check for Scanned/Empty PDF
        // Remove page break artifacts for this check
        const cleanCheck = rawText.replace(/Page\s*\(\d+\)\s*Break/gi, '').trim();
        if (cleanCheck.length < 100) {
            return NextResponse.json({
                error: 'Scanned/Image PDF detected. This system requires text-based PDFs. Please convert your file using an OCR tool and try again.'
            }, { status: 400 });
        }

        const extractedQuestions = extractQuestions(rawText);

        // Fetch existing questions for Concept Matching
        const existingQuestions = await Question.find(
            { subjectId: finalSubjectId },
            { normalizedText: 1, conceptId: 1, text: 1 }
        ).lean();

        // Convert to mutable cache with correct type
        // Use 'any' for the cache array structure to align with what assignConceptId expects/returns
        // Realistically it expects { normalizedText: string, conceptId: string, text?: string }
        const conceptCache = existingQuestions.map(q => ({
            normalizedText: q.normalizedText || normalizeTextForConcept(q.text),
            conceptId: q.conceptId || q._id.toString(), // Fallback if missing
            text: q.text
        }));

        const questionDocs = [];
        const { assignConceptId, normalizeTextForConcept } = await import('@/lib/analyzer/conceptManager');

        for (const q of extractedQuestions) {
            const mapping = await mapQuestionToTopic(q.text, q.unit);

            // Assign Concept ID (matches against DB + previously processed in this loop)
            const assignedConceptId = await assignConceptId(q.text, finalSubjectId, conceptCache);
            const normText = normalizeTextForConcept(q.text);

            // Add to cache so internal duplicates in this paper match each other
            conceptCache.push({
                normalizedText: normText,
                conceptId: assignedConceptId,
                text: q.text
            });

            questionDocs.push({
                paperId: questionPaper._id,
                text: q.text,
                normalizedText: normText,
                conceptId: assignedConceptId,
                marks: q.marks,
                questionNumber: q.questionNumber,
                unit: mapping.unit,
                topic: mapping.topic,
                year: year,
                subjectId: finalSubjectId
            });
        }

        if (questionDocs.length > 0) {
            await Question.insertMany(questionDocs);
        }

        // Update processed status
        questionPaper.processed = true;
        await questionPaper.save();

        // Revalidate paths to refresh cache
        try {
            const { revalidatePath } = await import('next/cache');
            revalidatePath(`/analysis/${finalSubjectId}`);
            revalidatePath(`/analysis/${finalSubjectId.toString()}`);
            revalidatePath(`/analysis/${finalSubjectId}/questions`);
            revalidatePath(`/analysis/${finalSubjectId.toString()}/questions`);
        } catch (e) {
            console.error('Revalidation failed:', e);
        }

        return NextResponse.json({
            message: 'File uploaded and processed successfully',
            paperId: questionPaper._id,
            subjectId: finalSubjectId,
            stats: {
                questionsExtracted: questionDocs.length,
                year: year
            }
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
