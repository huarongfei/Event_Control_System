import mongoose, { Schema, Document } from 'mongoose';
import {
  SportType,
  MatchStatus,
  PeriodType,
  MatchSettings
} from '../../../shared/types/index.js';

export interface IMatch extends Document {
  name: string;
  sport: SportType;
  status: MatchStatus;
  homeTeam: {
    name: string;
    logo?: string;
    primaryColor: string;
    jerseyColor: string;
    score: number;
  };
  awayTeam: {
    name: string;
    logo?: string;
    primaryColor: string;
    jerseyColor: string;
    score: number;
  };
  venue?: string;
  startTime: Date;
  endTime?: Date;
  currentPeriod: number;
  periods: Array<{
    number: number;
    type: PeriodType;
    startTime?: Date;
    endTime?: Date;
    homeScore: number;
    awayScore: number;
    isCompleted: boolean;
  }>;
  settings: MatchSettings;
}

const MatchSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Match name is required'],
    trim: true
  },
  sport: {
    type: String,
    enum: Object.values(SportType),
    required: [true, 'Sport type is required']
  },
  status: {
    type: String,
    enum: Object.values(MatchStatus),
    default: MatchStatus.SCHEDULED
  },
  homeTeam: {
    name: { type: String, required: true },
    logo: { type: String },
    primaryColor: { type: String, default: '#FF0000' },
    jerseyColor: { type: String, default: '#FF0000' },
    score: { type: Number, default: 0 }
  },
  awayTeam: {
    name: { type: String, required: true },
    logo: { type: String },
    primaryColor: { type: String, default: '#0000FF' },
    jerseyColor: { type: String, default: '#0000FF' },
    score: { type: Number, default: 0 }
  },
  venue: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  currentPeriod: { type: Number, default: 1 },
  periods: [{
    number: { type: Number, required: true },
    type: {
      type: String,
      enum: Object.values(PeriodType),
      default: PeriodType.QUARTER
    },
    startTime: { type: Date },
    endTime: { type: Date },
    homeScore: { type: Number, default: 0 },
    awayScore: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false }
  }],
  settings: {
    periodDuration: { type: Number, default: 720 }, // 12 minutes in seconds
    overtimeDuration: { type: Number, default: 300 }, // 5 minutes in seconds
    maxFouls: { type: Number, default: 5 },
    timeoutsPerHalf: { type: Number, default: 3 },
    shotClockDuration: { type: Number, default: 24 }
  }
}, {
  timestamps: true
});

MatchSchema.index({ status: 1, startTime: 1 });
MatchSchema.index({ sport: 1, status: 1 });

export default mongoose.model<IMatch>('Match', MatchSchema);
