const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const QuestionSchema = new mongoose.Schema({
    subjectId: mongoose.Schema.Types.ObjectId,
    text: String,
    marks: Number,
    topic: String,
    year: Number,
});

const SubjectSchema = new mongoose.Schema({
    name: String,
    code: String,
});

const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const subjects = await Subject.find({});
        console.log(`Found ${subjects.length} subjects:`);

        for (const sub of subjects) {
            console.log(`- [${sub._id}] ${sub.name} (${sub.code})`);
            const questions = await Question.find({ subjectId: sub._id });

            const yearCounts = {};
            questions.forEach(q => {
                yearCounts[q.year] = (yearCounts[q.year] || 0) + 1;
            });

            console.log(`  Total Questions: ${questions.length}`);
            console.log(`  Breakdown by Year:`, yearCounts);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkData();
