import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuestion extends Document {
    paperId: mongoose.Types.ObjectId;
    subjectId: mongoose.Types.ObjectId;
    text: string;
    normalizedText?: string; // Cleaned text for comparison
    conceptId?: string; // Grouping ID for identical questions across papers
    marks?: number;
    questionNumber?: string;
    unit?: string;
    topic?: string;
    year: number;
}

const QuestionSchema: Schema = new Schema({
    paperId: { type: Schema.Types.ObjectId, ref: 'QuestionPaper', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    text: { type: String, required: true },
    normalizedText: { type: String, index: true },
    conceptId: { type: String, index: true },
    marks: { type: Number },
    questionNumber: { type: String },
    unit: { type: String },
    topic: { type: String },
    year: { type: Number, required: true },
});

// Index for text search (TF-IDF similarity later) based on text content?
// Or exact match finding.
QuestionSchema.index({ text: 'text' });

const Question: Model<IQuestion> = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);

export default Question;
