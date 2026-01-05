import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubject extends Document {
    name: string;
    code: string;
    semester?: number;
    createdAt: Date;
}

const SubjectSchema: Schema = new Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    semester: { type: Number },
    createdAt: { type: Date, default: Date.now },
});

// Prevent overwrite on hot reload
const Subject: Model<ISubject> = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);

export default Subject;
