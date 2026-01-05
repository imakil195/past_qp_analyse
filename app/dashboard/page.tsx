import Navbar from '@/components/Navbar';
import UploadForm from '@/components/UploadForm';
import SubjectList from '@/components/SubjectList';
import dbConnect from '@/lib/db';
import Subject from '@/models/Subject';
import QuestionPaper from '@/models/QuestionPaper';
import Question from '@/models/Question';

async function getSubjects() {
    await dbConnect();
    const subjects = await Subject.find().lean();

    // Enrich with stats (this could be optimized with aggregation, but loop is fine for small scale)
    const stats = await Promise.all(subjects.map(async (sub) => {
        const paperCount = await QuestionPaper.countDocuments({ subjectId: sub._id });
        const questionCount = await Question.countDocuments({ subjectId: sub._id });
        return {
            ...sub,
            _id: sub._id.toString(),
            paperCount,
            questionCount
        };
    }));

    // Sort by recent activity or just name
    return stats.sort((a, b) => b.paperCount - a.paperCount);
}

export default async function Dashboard() {
    const subjects = await getSubjects();

    return (
        <div className="min-h-screen bg-secondary/30">
            <Navbar />

            <main className="pt-28 pb-12 px-6 max-w-7xl mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Upload Form */}
                    <div className="lg:col-span-1">
                        <UploadForm existingSubjects={subjects.map(s => ({ id: s._id, name: s.name }))} />
                    </div>

                    {/* Right: My Subjects */}
                    <div className="lg:col-span-2">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-foreground">My Subjects</h2>
                            <p className="text-muted-foreground">Access your previously analyzed question papers.</p>
                        </div>
                        <SubjectList subjects={subjects} />
                    </div>
                </div>

            </main>
        </div>
    );
}
