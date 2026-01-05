import dbConnect from '@/lib/db';
import Question from '@/models/Question';
import Subject from '@/models/Subject';
import Navbar from '@/components/Navbar';
import QuestionTable from '@/components/QuestionTable';
import Link from 'next/link';
import { ArrowLeft, Database } from 'lucide-react';
import { notFound } from 'next/navigation';
import { analyzeRepeatedQuestions } from '@/lib/analyzer/repetitionAnalysis';

export default async function QuestionBankPage({ params }: { params: Promise<{ subjectId: string }> }) {
    await dbConnect();

    const { subjectId } = await params;

    const subject = await Subject.findById(subjectId);
    if (!subject) return notFound();

    const questions = await Question.find({ subjectId }).sort({ year: -1 }).lean();

    // Extract unique filters
    const years = Array.from(new Set(questions.map(q => q.year))).sort((a, b) => b - a);
    const topics = Array.from(new Set(questions.map(q => q.topic || 'Uncategorized'))).sort();

    // Serialize for Client Component
    const serializableQuestions = questions.map(q => ({
        text: q.text,
        marks: q.marks || 0,
        year: q.year,
        topic: q.topic || 'Uncategorized',
        unit: q.unit,
        conceptId: q.conceptId
    }));

    // Perform analysis Server Side (Node environment) to avoid bundling 'natural/fs/dns' to client
    const repeatedGroups = await analyzeRepeatedQuestions(serializableQuestions, 0.75);


    return (
        <div className="min-h-screen bg-secondary/30">
            <Navbar />

            <main className="pt-28 pb-12 px-6 max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link href={`/analysis/${subjectId}`} className="text-sm text-muted-foreground hover:text-primary flex items-center mb-2 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Analysis
                        </Link>
                        <h1 className="text-3xl font-bold text-foreground flex items-center">
                            <Database className="w-8 h-8 mr-3 text-primary opacity-80" />
                            Question Bank
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Browse all {questions.length} questions from {subject.name}
                        </p>
                    </div>
                </div>

                <QuestionTable
                    questions={serializableQuestions}
                    topics={topics}
                    years={years}
                    repeatedQuestions={repeatedGroups}
                />
            </main>
        </div>
    );
}
