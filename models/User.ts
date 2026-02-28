import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    image?: string;
    providers: {
        google?: string;
    };
    preferences?: {
        theme?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    providers: {
        google: { type: String },
    },
    preferences: {
        theme: { type: String, default: 'dark' },
    },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
