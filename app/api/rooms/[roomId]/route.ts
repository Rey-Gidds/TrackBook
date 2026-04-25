import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Room from "@/models/Room";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/** GET /api/rooms/[roomId] — Get room details (user must be a member) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { roomId } = await params;
    await connectDB();

    const room = await Room.findById(roomId)
      .populate("users", "name email image")
      .lean();

    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const isMember = room.users.some(
      (u: any) => u._id.toString() === session.user.id
    );
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json(room);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
