import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import QuestionPaper from '@/models/QuestionPaper';
import Question from '@/models/Question';

export async function DELETE(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const subjectId = searchParams.get('id');

        if (!subjectId) {
            return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
        }

        // Cascade delete
        // 1. Delete Questions
        await Question.deleteMany({ subjectId });

        // 2. Delete Question Papers
        await QuestionPaper.deleteMany({ subjectId });

        // 3. Delete Subject
        const deletedSubject = await Subject.findByIdAndDelete(subjectId);

        if (!deletedSubject) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Subject deleted successfully' });
    } catch (error: any) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
