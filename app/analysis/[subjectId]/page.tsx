import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import Question from '@/models/Question';
import QuestionPaper from '@/models/QuestionPaper';
import Navbar from '@/components/Navbar';
import WeightageChart from '@/components/charts/WeightageChart';
import Link from 'next/link';
import { ArrowLeft, Layers, Clock, AlertCircle, FileText, PieChart as PieChartIcon, Lightbulb, Database, Target } from 'lucide-react';

import { analyzeRepeatedQuestions, QuestionData } from '@/lib/analyzer/repetitionAnalysis';

// ... (keep imports)

export default async function AnalysisPage({ params }: { params: Promise<{ subjectId: string }> }) {
    await dbConnect();

    const { subjectId } = await params;
    const subject = await Subject.findById(subjectId);
    if (!subject) return notFound();

    // Fetch all questions for this subject
    const questions = await Question.find({ subjectId }).lean();
    const totalQuestions = questions.length;

    // Calculate Stats
    const years = Array.from(new Set(questions.map(q => q.year))).sort((a, b) => a - b);
    const minYear = years.length > 0 ? years[0] : 'N/A';
    const maxYear = years.length > 0 ? years[years.length - 1] : 'N/A';
    const papersCount = (await QuestionPaper.countDocuments({ subjectId })) || 0;

    // --- REPEATED QUESTIONS LOGIC ---
    // Use the robust Cosine Similarity logic from lib
    // Map DB questions to the expected interface if needed (though lean() should be close)
    const serializableQuestions: QuestionData[] = questions.map(q => ({
        text: q.text,
        marks: q.marks || 0,
        year: q.year,
        topic: q.topic || 'Uncategorized',
        unit: q.unit,
        conceptId: q.conceptId // Pass Concept ID for O(N) grouping
    }));

    const groups = await analyzeRepeatedQuestions(serializableQuestions, 0.75);

    // ONLY show repeated questions when 2+ papers uploaded
    // With 1 paper, there's nothing to compare against
    const repeatedQuestions = papersCount >= 2
        ? groups
            .filter(g => g.count > 1) // Only ACTUAL repetitions
            .map(g => ({
                text: g.mainQuestion,
                count: g.count,
                years: g.occurrenceYears,
                marks: 0
            }))
            .slice(0, 10)
        : []; // Empty - need at least 2 papers to compare

    // --- TOPIC WEIGHTAGE ---
    const topicCounts: Record<string, number> = {};
    questions.forEach(q => {
        const t = q.topic || 'Uncategorized';
        topicCounts[t] = (topicCounts[t] || 0) + 1;
    });

    const weightageData = Object.entries(topicCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Common insight
    const topTopic = weightageData[0]?.name || "N/A";
    const topTopicPct = totalQuestions ? Math.round((weightageData[0]?.value || 0) / totalQuestions * 100) : 0;

    return (
        <div className="min-h-screen bg-secondary/30">
            <Navbar />

            <main className="pt-28 pb-12 px-6 max-w-7xl mx-auto">
                <div className="mb-8">
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary flex items-center mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground">{subject.name} <span className="text-muted-foreground font-normal text-xl ml-2">{subject.code}</span></h1>
                    <p className="text-muted-foreground mt-1">Analysis based on {papersCount} papers ({minYear} - {maxYear})</p>
                </div>

                {/* Overview Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <OverviewCard title="Total Papers" value={papersCount.toString()} icon={<FileText className="text-blue-500" />} />
                    <OverviewCard title="Questions" value={totalQuestions.toString()} icon={<Layers className="text-indigo-500" />} />
                    <OverviewCard title="Years Covered" value={`${years.length}`} icon={<Clock className="text-violet-500" />} />
                    <OverviewCard title="Repeated Qs" value={repeatedQuestions.length.toString()} icon={<AlertCircle className="text-orange-500" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Charts & Insights */}
                    <div className="lg:col-span-1 space-y-8">

                        {/* Smart Insights */}
                        <div className="bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center"><Lightbulb className="w-5 h-5 mr-2" /> Key Insights</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                    <span className="text-foreground/80">
                                        <strong className="text-foreground">{topTopic}</strong> is the dominant topic ({topTopicPct}%).
                                    </span>
                                </li>
                                {repeatedQuestions.length > 0 && (
                                    <li className="flex gap-3 text-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                        <span className="text-foreground/80">
                                            Found <strong>{repeatedQuestions.length} commonly asked questions</strong>.
                                        </span>
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* Chapter Weightage */}
                        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold flex items-center"><PieChartIcon className="w-5 h-5 mr-2 text-primary" /> Topic Distribution</h3>
                            </div>
                            <WeightageChart data={weightageData} />
                        </div>

                        <Link href={`/analysis/${subjectId}/questions`} className="w-full flex items-center justify-center px-4 py-4 rounded-xl bg-primary hover:bg-secondary text-primary-foreground font-medium transition-colors shadow-lg shadow-primary/20">
                            <Database className="w-4 h-4 mr-2" />
                            View Full Question Bank
                        </Link>

                    </div>

                    {/* Right Column: Repeated Questions List */}
                    <div className="lg:col-span-2">
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <h3 className="text-lg font-semibold mb-1 flex items-center">
                                <Target className="w-5 h-5 mr-2 text-primary" />
                                Most Frequently Asked Questions
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                All questions sorted by frequency across uploaded papers.
                            </p>

                            {repeatedQuestions.length > 0 ? (
                                <div className="space-y-5">
                                    {repeatedQuestions.map((q, idx) => {
                                        // Multiple splitting strategies to catch different formats
                                        // Pattern 1: " a) ", " b) " - traditional format
                                        // Pattern 2: "L3 7 a", "(12 Marks) b" - marks followed by letter
                                        // Pattern 3: Standalone " a ", " b " at start of line

                                        let formattedParts: { letter: string, text: string }[] = [];

                                        // Try Pattern 1: space + letter + ) + space
                                        let parts = q.text.split(/\s+([a-z])\)\s+/i);
                                        if (parts.length > 2) {
                                            // Has " a) " style parts
                                            for (let i = 1; i < parts.length - 1; i += 2) {
                                                const letter = parts[i];
                                                const text = parts[i + 1];
                                                if (letter && text) {
                                                    formattedParts.push({ letter: letter.toLowerCase(), text: text.trim() });
                                                }
                                            }
                                        } else {
                                            // Try Pattern 2: marks patterns like "L3 7 b" or "(12 Marks) b"
                                            parts = q.text.split(/(?:L\d+\s+\d+|\(\d+\s*Marks?\))\s+([a-z])\s+/i);
                                            if (parts.length > 2) {
                                                for (let i = 1; i < parts.length - 1; i += 2) {
                                                    const letter = parts[i];
                                                    const text = parts[i + 1];
                                                    if (letter && text) {
                                                        formattedParts.push({ letter: letter.toLowerCase(), text: text.trim() });
                                                    }
                                                }
                                            }
                                        }

                                        const hasMultipleParts = formattedParts.length > 1;

                                        return (
                                            <div key={idx} className="border border-border rounded-xl bg-gradient-to-br from-card to-card/50 overflow-hidden shadow-md hover:shadow-lg transition-all">
                                                {/* Frequency Badge */}
                                                <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-border/50">
                                                    <span className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/30">
                                                        <span className="text-xl">🔄</span>
                                                        {q.count > 1 ? `Repeated ${q.count} times` : 'Asked once'}
                                                    </span>
                                                </div>

                                                {/* Question Content */}
                                                <div className="p-6">
                                                    {hasMultipleParts ? (
                                                        <div className="space-y-6">
                                                            {formattedParts.map((part, pidx) => (
                                                                <div key={pidx} className="flex gap-4 items-start p-4 rounded-lg bg-accent/20 border border-border/30">
                                                                    <div className="flex-shrink-0 pt-1">
                                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                                            {part.letter}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1 pt-1.5">
                                                                        <p className="text-foreground leading-relaxed text-base">
                                                                            {part.text}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-foreground font-medium leading-relaxed text-base">{q.text}</p>
                                                    )}
                                                </div>

                                                {/* Year Tags */}
                                                <div className="px-6 pb-6">
                                                    <div className="flex flex-wrap gap-2 items-center pt-4 border-t border-border/30">
                                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Years:</span>
                                                        {q.years.map(y => (
                                                            <span key={y} className="px-3 py-1.5 bg-secondary/70 border border-border rounded-full text-sm font-semibold text-foreground shadow-sm">
                                                                {y}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
                                    <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
                                        <AlertCircle className="w-10 h-10 text-muted-foreground" />
                                    </div>
                                    <h4 className="text-xl font-semibold text-foreground">
                                        {papersCount < 2 ? 'Upload More Papers to See Repetitions' : 'No Repeated Questions Found'}
                                    </h4>
                                    <p className="text-muted-foreground max-w-md mt-2 mx-auto">
                                        {papersCount < 2
                                            ? `You have ${papersCount} paper uploaded. Upload at least 2 papers to compare and detect repeated questions across different years.`
                                            : 'No questions appear multiple times across your uploaded papers. This could mean questions are uniquely phrased each year.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
}

function OverviewCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="bg-card border border-border/50 p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-sm text-muted-foreground font-medium">{title}</p>
                <h4 className="text-2xl font-bold text-foreground">{value}</h4>
            </div>
        </div>
    )
}
