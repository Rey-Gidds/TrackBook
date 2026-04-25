import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IRoom extends Document {
  name: string;
  users: mongoose.Types.ObjectId[];
  bookId: mongoose.Types.ObjectId;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    bookId: { type: Schema.Types.ObjectId, ref: "RoomBook" },
    currency: { type: String, required: true, default: "INR" },
  },
  { timestamps: true }
);

const Room = models.Room || model<IRoom>("Room", RoomSchema);
export default Room;
