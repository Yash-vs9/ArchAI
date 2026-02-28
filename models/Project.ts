import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    tags: string[];
    interviewAnswers: any;
    canvasData: {
        nodes: any[];
        edges: any[];
    };
    summaryData?: any;
    isPublic: boolean;
    shareToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'Untitled Architecture' },
    tags: [{ type: String }],
    interviewAnswers: { type: Schema.Types.Mixed, default: {} },
    canvasData: {
        nodes: { type: [Schema.Types.Mixed], default: [] },
        edges: { type: [Schema.Types.Mixed], default: [] }
    },
    summaryData: { type: Schema.Types.Mixed },
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String },
}, { timestamps: true });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
