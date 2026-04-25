import mongoose, { Schema, Document, model, models } from "mongoose";
import "./Room";
import "./RoomTicket";
export interface IRoomBook extends Document {
  roomId: mongoose.Types.ObjectId;
  tickets: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const RoomBookSchema = new Schema<IRoomBook>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    tickets: [{ type: Schema.Types.ObjectId, ref: "RoomTicket" }],
  },
  { timestamps: true }
);

const RoomBook = models.RoomBook || model<IRoomBook>("RoomBook", RoomBookSchema);
export default RoomBook;
