import mongoose, { Schema, Document, Model } from 'mongoose';

export type ContentType = 'movie' | 'song' | 'series';
export type IndustryType = 'bollywood' | 'hollywood' | 'bhojpuri' | 'tollywood';

export interface IContent extends Document {
  type: ContentType;
  industry: IndustryType;
  title: string;
  description: string;
  genre: string[];
  year: number;
  language: string;
  cast: string[];
  thumbnailUrl: string;
  mediaUrl: string;
  duration: string;
  isPublished: boolean;
  uploadedBy?: mongoose.Types.ObjectId | string;
  views?: number;
  rating?: number;
  seasonsCount?: number;
  episodesCount?: number;
  storageKey?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<IContent>(
  {
    type: {
      type: String,
      required: true,
      enum: ['movie', 'song', 'series'],
    },
    industry: {
      type: String,
      required: true,
      enum: ['bollywood', 'hollywood', 'bhojpuri', 'tollywood'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    genre: {
      type: [String],
      default: [],
    },
    year: {
      type: Number,
      default: new Date().getFullYear(),
    },
    language: {
      type: String,
      default: 'Hindi',
    },
    cast: {
      type: [String],
      default: [],
    },
    thumbnailUrl: {
      type: String,
      required: [true, 'Please provide a thumbnail URL'],
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    duration: {
      type: String,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: Schema.Types.Mixed,
      default: null,
    },
    views: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 8.5,
    },
    seasonsCount: {
      type: Number,
      default: 1,
    },
    episodesCount: {
      type: Number,
      default: 0,
    },
    storageKey: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes on type, industry, title, createdAt, isPublished as required
ContentSchema.index({ type: 1 });
ContentSchema.index({ industry: 1 });
ContentSchema.index({ title: 1 });
ContentSchema.index({ createdAt: -1 });
ContentSchema.index({ isPublished: 1 });
ContentSchema.index({ type: 1, industry: 1, isPublished: 1 });
ContentSchema.index({ title: 'text', description: 'text' });

const Content: Model<IContent> =
  mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);

export default Content;
