import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ExpenseBook from "@/models/ExpenseBook";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title, description } = await req.json();

        if (!title || title.trim() === "") {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        await connectDB();

        const expenseBook = await ExpenseBook.create({
            userId: session.user.id,
            title,
            description,
        });

        return NextResponse.json(expenseBook, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        
        const expenseBooks = await ExpenseBook.find({ userId: session.user.id })
            .sort({ createdAt: -1 });

        return NextResponse.json(expenseBooks);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
