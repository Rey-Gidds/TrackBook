import mongoose, { Schema, Document, model, models } from "mongoose";
import "./User";
import "./Room";
import "./RoomBook";
export type SplitType = "equal" | "manual" | "percentage" | "ratio" | "settlement";
export type TicketType = "expense" | "settlement";

export interface IDistributionEntry {
  userId: mongoose.Types.ObjectId;
  amount: number; // integer, smallest currency unit
}

export interface IRoomTicket extends Document {
  roomId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId; // payer
  bearerId?: mongoose.Types.ObjectId; // receiver (settlements only)
  type: TicketType;
  title: string;
  description?: string;
  totalAmount: number; // integer, smallest currency unit
  splitType: SplitType;
  distribution: IDistributionEntry[];
  involvedUsers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const DistributionEntrySchema = new Schema<IDistributionEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true }, // integer, can be negative for settlements
  },
  { _id: false }
);

const RoomTicketSchema = new Schema<IRoomTicket>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    bookId: { type: Schema.Types.ObjectId, ref: "RoomBook", required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bearerId: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["expense", "settlement"], required: true, default: "expense" },
    title: { type: String, required: true },
    description: { type: String },
    totalAmount: { type: Number, required: true }, // integer, smallest unit
    splitType: {
      type: String,
      enum: ["equal", "manual", "percentage", "ratio", "settlement"],
      required: true,
    },
    distribution: [DistributionEntrySchema],
    involvedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const RoomTicket = models.RoomTicket || model<IRoomTicket>("RoomTicket", RoomTicketSchema);
export default RoomTicket;
