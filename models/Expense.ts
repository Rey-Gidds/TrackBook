import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IExpense extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    category: { type: String, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Expense = models.Expense || model<IExpense>("Expense", ExpenseSchema);

export default Expense;
