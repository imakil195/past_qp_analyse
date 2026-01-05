
import dbConnect from '../lib/db';
import Question from '../models/Question';
import QuestionPaper from '../models/QuestionPaper';
import Subject from '../models/Subject';

async function wipeData() {
    await dbConnect();
    const subjectName = process.argv[2] || 'esd'; // Default to esd if not provided

    console.log(`Searching for subject: ${subjectName}`);
    const sub = await Subject.findOne({ name: { $regex: new RegExp(subjectName, 'i') } });

    if (!sub) {
        console.log("Subject not found.");
        process.exit(1);
    }

    console.log(`Found Subject: ${sub.name} (${sub._id})`);

    // Delete Questions
    const qResult = await Question.deleteMany({ subjectId: sub._id });
    console.log(`Deleted ${qResult.deletedCount} questions.`);

    // Delete Papers
    const pResult = await QuestionPaper.deleteMany({ subjectId: sub._id });
    console.log(`Deleted ${pResult.deletedCount} papers.`);

    // Should we delete the subject itself? Yes, to force clean slate.
    // await Subject.deleteOne({ _id: sub._id });
    // console.log("Deleted Subject record.");

    console.log("Data wipe complete. Please re-upload.");
    process.exit(0);
}

wipeData().catch(console.error);
