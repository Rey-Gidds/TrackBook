import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IBalanceEntry {
  userId: mongoose.Types.ObjectId;
  amount: number; // +ve = current user owes this user; -ve = this user owes current user
}

export interface IRoomStats extends Document {
  roomId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  balances: IBalanceEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const BalanceEntrySchema = new Schema<IBalanceEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, default: 0 }, // integer, smallest unit
  },
  { _id: false }
);

const RoomStatsSchema = new Schema<IRoomStats>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    balances: [BalanceEntrySchema],
  },
  { timestamps: true }
);

// Compound unique index for O(1) lookup
RoomStatsSchema.index({ roomId: 1, userId: 1 }, { unique: true });

const RoomStats = models.RoomStats || model<IRoomStats>("RoomStats", RoomStatsSchema);
export default RoomStats;
