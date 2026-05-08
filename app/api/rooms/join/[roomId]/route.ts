import { auth } from "@/lib/auth";
import { getCachedSession } from "@/lib/cachedSession";
import { connectDB } from "@/lib/db";
import Room from "@/models/Room";
import User from "@/models/User";
import { initBalancesForNewMember } from "@/lib/rooms/balanceEngine";
import mongoose from "mongoose";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/rooms/join/[roomId]
 * Authenticated user joins a room via invite link.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await getCachedSession(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { roomId } = await params;
    await connectDB();

    const room = await Room.findById(roomId);
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    // Already a member?
    const alreadyMember = room.users.some((uid: any) => uid.toString() === session.user.id);
    if (alreadyMember) {
      return NextResponse.json({ message: "You are already a member of this room.", room });
    }

    const existingUserIds = room.users.map((uid: any) => uid.toString());

    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      const userId = new mongoose.Types.ObjectId(session.user.id);

      // Add user to room
      await Room.updateOne(
        { _id: roomId },
        { $addToSet: { users: userId } },
        { session: mongoSession }
      );

      // Add room to user's rooms
      await User.updateOne(
        { _id: userId },
        { $addToSet: { rooms: new mongoose.Types.ObjectId(roomId) } },
        { session: mongoSession }
      );

      // Initialize balance entries for new member
      await initBalancesForNewMember(mongoSession, roomId, session.user.id, existingUserIds);

      await mongoSession.commitTransaction();
      mongoSession.endSession();

      const updatedRoom = await Room.findById(roomId)
        .populate("users", "name email image")
        .lean();

      return NextResponse.json({ message: "Joined room successfully!", room: updatedRoom });
    } catch (txErr) {
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      throw txErr;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
