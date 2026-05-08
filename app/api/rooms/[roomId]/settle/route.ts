import { auth } from "@/lib/auth";
import { getCachedSession } from "@/lib/cachedSession";
import { connectDB } from "@/lib/db";
import Room from "@/models/Room";
import RoomBook from "@/models/RoomBook";
import RoomTicket from "@/models/RoomTicket";
import { updateBalances } from "@/lib/rooms/balanceEngine";
import { toSmallestUnit } from "@/utils/roomCurrency";
import mongoose from "mongoose";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/rooms/[roomId]/settle
 * Records a settlement: current user (payer/creatorId) pays `receiverId` (bearerId) `amount`.
 *
 * Body: { receiverId: string, amount: number } — amount in display currency
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await getCachedSession(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { roomId } = await params;
    const { receiverId, amount } = await req.json();

    if (!receiverId) return NextResponse.json({ error: "receiverId is required" }, { status: 400 });
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Settlement amount must be positive" }, { status: 400 });
    }
    if (receiverId === session.user.id) {
      return NextResponse.json({ error: "Cannot settle with yourself" }, { status: 400 });
    }

    await connectDB();

    const room = await Room.findById(roomId).lean();
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const roomUserIds = room.users.map((u: any) => u.toString());
    if (!roomUserIds.includes(session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!roomUserIds.includes(receiverId)) {
      return NextResponse.json({ error: "Receiver is not a member of this room" }, { status: 400 });
    }

    const settleAmountSmallest = toSmallestUnit(Number(amount), room.currency);

    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      const payerId = session.user.id;

      // Create settlement ticket
      const [ticket] = await RoomTicket.create(
        [
          {
            roomId,
            bookId: room.bookId,
            creatorId: payerId,
            bearerId: receiverId,
            type: "settlement",
            title: "Settlement",
            totalAmount: settleAmountSmallest,
            splitType: "settlement",
            distribution: [],
            involvedUsers: [payerId, receiverId],
          },
        ],
        { session: mongoSession }
      );

      // Add to RoomBook
      await RoomBook.updateOne(
        { _id: room.bookId },
        { $push: { tickets: ticket._id } },
        { session: mongoSession }
      );

      // Update balances:
      // payer (B) sends money to receiver (A)
      // B → A balance decreases by settleAmountSmallest
      // A → B balance increases by settleAmountSmallest
      // Use updateBalances(session, roomId, B, A, -settleAmount) which gives:
      //   B→A: +(-settleAmount) = -settleAmount ✓
      //   A→B: -(-settleAmount) = +settleAmount ✓
      await updateBalances(mongoSession, roomId, payerId, receiverId, -settleAmountSmallest);

      await mongoSession.commitTransaction();
      mongoSession.endSession();

      return NextResponse.json({ message: "Settlement recorded successfully.", ticket });
    } catch (txErr) {
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      throw txErr;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
