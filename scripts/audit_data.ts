
import dbConnect from '../lib/db';
import Subject from '../models/Subject';
import QuestionPaper from '../models/QuestionPaper';
import Question from '../models/Question';

async function auditData() {
    await dbConnect();
    console.log("=== EXAM ACE DATA AUDIT ===\n");

    const subjects = await Subject.find({}).lean();
    console.log(`Total Subjects Found: ${subjects.length}`);

    for (const sub of subjects) {
        console.log(`\n------------------------------------------------`);
        console.log(`SUBJECT: "${sub.name}" (ID: ${sub._id})`);
        console.log(`Code: ${sub.code}`);

        // Get Papers
        const papers = await QuestionPaper.find({ subjectId: sub._id }).lean();
        console.log(`  > Question Papers: ${papers.length}`);
        papers.forEach(p => {
            console.log(`    - Year: ${p.year} (Semester: ${p.semester}) | File: ${p.originalName} | Processed: ${p.processed}`);
        });

        // Get Questions Stats
        const questions = await Question.find({ subjectId: sub._id }).lean();
        console.log(`  > Total Questions: ${questions.length}`);

        // Group by Year
        const byYear: Record<number, number> = {};
        const byPaper: Record<string, number> = {};

        questions.forEach(q => {
            // Year count
            const y = q.year || 0;
            byYear[y] = (byYear[y] || 0) + 1;

            // Paper ID count (check for orphaned questions)
            const pid = q.paperId ? q.paperId.toString() : 'null';
            byPaper[pid] = (byPaper[pid] || 0) + 1;
        });

        console.log(`  > Breakdown by Year:`);
        Object.keys(byYear).sort().forEach(y => {
            console.log(`    - ${y}: ${byYear[y as any]} questions`);
        });

        console.log(`  > Breakdown by PaperID Reference:`);
        Object.keys(byPaper).forEach(pid => {
            console.log(`    - Paper ${pid}: ${byPaper[pid]} questions`);
        });

        if (questions.length > 0) {
            console.log(`  > Sample Question (First 3):`);
            questions.slice(0, 3).forEach((q, i) => console.log(`    ${i + 1}. [${q.year}] ${q.text.substring(0, 80)}...`));
        }
    }

    console.log(`\n------------------------------------------------`);
    process.exit(0);
}

auditData().catch(console.error);
