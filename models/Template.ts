import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
    title: string;
    description: string;
    category: string;
    canvasData: {
        nodes: any[];
        edges: any[];
    };
    summaryData: any;
    createdAt: Date;
    updatedAt: Date;
}

const TemplateSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    canvasData: {
        nodes: { type: [Schema.Types.Mixed], default: [] },
        edges: { type: [Schema.Types.Mixed], default: [] }
    },
    summaryData: { type: Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);
