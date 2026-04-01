import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Expense from "@/models/Expense";
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
        const { amount, currency, category, description, date } = await req.json();

        // Server-side validation
        if (Number(amount) > 1000000) {
            return NextResponse.json({ error: "Amount cannot exceed 1,000,000" }, { status: 400 });
        }
        if (category.length > 20) {
            return NextResponse.json({ error: "Category name too long (max 20 characters)" }, { status: 400 });
        }
        if (description && description.length > 100) {
            return NextResponse.json({ error: "Description too long (max 100 characters)" }, { status: 400 });
        }

        await connectDB();

        const expense = await Expense.create({
            userId: session.user.id,
            amount: Number(amount),
            currency: currency || "USD",
            category,
            description,
            date: date ? new Date(date) : new Date(),
        });

        return NextResponse.json(expense, { status: 201 });
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

    const { searchParams } = new URL(req.url);
    const sortOrder = searchParams.get("sort") === "desc" ? -1 : 1;
    const sortBy = searchParams.get("sortBy") || "createdAt";

    try {
        await connectDB();
        const expenses = await Expense.find({ userId: session.user.id })
            .sort({ [sortBy]: sortOrder as any });

        return NextResponse.json(expenses);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
