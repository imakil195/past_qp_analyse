import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuestionPaper extends Document {
    subjectId: mongoose.Types.ObjectId;
    year: number;
    semester?: string; // e.g., "Fall", "Spring", "May/June"
    filePath: string; // Path to stored PDF
    originalName: string;
    uploadDate: Date;
    processed: boolean;
}

const QuestionPaperSchema: Schema = new Schema({
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    year: { type: Number, required: true },
    semester: { type: String },
    filePath: { type: String, required: true },
    originalName: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    processed: { type: Boolean, default: false },
});

const QuestionPaper: Model<IQuestionPaper> = mongoose.models.QuestionPaper || mongoose.model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);

export default QuestionPaper;
