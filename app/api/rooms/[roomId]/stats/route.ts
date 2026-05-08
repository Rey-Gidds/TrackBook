import { getCachedSession } from "@/lib/cachedSession";
import { connectDB } from "@/lib/db";
import Room from "@/models/Room";
import RoomStats from "@/models/RoomStats";
import User from "@/models/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/rooms/[roomId]/stats
 * Returns ONLY the current user's RoomStats with populated member names.
 * Privacy: never exposes other users' stats.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await getCachedSession(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { roomId } = await params;
    await connectDB();

    // Verify membership
    const room = await Room.findById(roomId).lean();
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const roomUserIds = room.users.map((u: any) => u.toString());
    if (!roomUserIds.includes(session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch only THIS user's stats
    const stats = await RoomStats.findOne({ roomId, userId: session.user.id }).lean();
    if (!stats) return NextResponse.json({ balances: [] });

    // Populate user names for each balance entry
    const otherUserIds = stats.balances.map((b: any) => b.userId);
    const users = await User.find({ _id: { $in: otherUserIds } })
      .select("name email image")
      .lean();
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    const enrichedBalances = stats.balances.map((b: any) => ({
      userId: b.userId.toString(),
      amount: b.amount,
      user: userMap.get(b.userId.toString()) ?? { name: "Unknown", image: null },
    }));

    return NextResponse.json({
      roomId,
      userId: session.user.id,
      currency: room.currency,
      balances: enrichedBalances,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
