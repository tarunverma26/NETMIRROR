import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEpisode extends Document {
  seriesId: mongoose.Types.ObjectId | string;
  season: number;
  episodeNumber: number;
  title: string;
  description?: string;
  mediaUrl: string;
  thumbnailUrl: string;
  duration: string;
  storageKey?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EpisodeSchema = new Schema<IEpisode>(
  {
    seriesId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    season: {
      type: Number,
      required: true,
      default: 1,
    },
    episodeNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    title: {
      type: String,
      required: [true, 'Please provide an episode title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    mediaUrl: {
      type: String,
      required: [true, 'Please provide episode video stream URL'],
    },
    thumbnailUrl: {
      type: String,
      required: [true, 'Please provide an episode thumbnail'],
    },
    duration: {
      type: String,
      default: '45m',
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

EpisodeSchema.index({ seriesId: 1, season: 1, episodeNumber: 1 });

const Episode: Model<IEpisode> =
  mongoose.models.Episode || mongoose.model<IEpisode>('Episode', EpisodeSchema);

export default Episode;
