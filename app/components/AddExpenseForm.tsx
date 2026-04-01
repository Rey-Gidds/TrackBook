"use client";

import { useState } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { supportedCurrencies } from "@/utils/currencyConverter";
import ErrorMessage from "./ErrorMessage";

const CATEGORY_LIMIT = 20;
const DESCRIPTION_LIMIT = 100;
const AMOUNT_LIMIT = 1000000;

export default function AddExpenseForm() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState("Food");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { fetchExpenses } = useExpenses();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const finalAmount = Number(amount);
    if (finalAmount > AMOUNT_LIMIT) {
      setError(`Amount cannot exceed ${AMOUNT_LIMIT.toLocaleString()}`);
      setLoading(false);
      return;
    }

    const finalCategory = category === "Other" ? customCategory : category;
    if (!finalCategory || finalCategory.trim().length === 0) {
      setError("Category is required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: finalAmount, 
          currency, 
          category: finalCategory, 
          description, 
          date 
        }),
      });

      if (response.ok) {
        setAmount("");
        setCurrency("USD");
        setCategory("Food");
        setCustomCategory("");
        setDescription("");
        await fetchExpenses();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to add expense");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] p-8 rounded-xl border border-[var(--border)] shadow-sm font-inter">
      <h2 className="text-xl font-playfair font-bold text-[var(--foreground)] mb-6">Record New Expense</h2>
      
      {error && (
        <div className="mb-6">
          <ErrorMessage 
            title="Form Error"
            message={error}
            variant="error"
            compact
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Amount</label>
            <div className="flex gap-2 border-b border-[var(--border)] focus-within:border-[var(--accent)]">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-grow py-2 bg-transparent outline-none font-bold text-lg text-[var(--foreground)]"
                required
                max={AMOUNT_LIMIT}
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="py-2 bg-transparent outline-none text-xs font-bold text-[var(--muted)] cursor-pointer"
              >
                {supportedCurrencies.map(curr => <option key={curr} value={curr} className="bg-[var(--surface)]">{curr}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-2 bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] outline-none font-medium text-[var(--foreground)] cursor-pointer"
            >
              <option value="Food" className="bg-[var(--surface)]">Food & Dining</option>
              <option value="Transport" className="bg-[var(--surface)]">Travel & Transport</option>
              <option value="Rent" className="bg-[var(--surface)]">Rent & Housing</option>
              <option value="Entertainment" className="bg-[var(--surface)]">Entertainment</option>
              <option value="Utilities" className="bg-[var(--surface)]">Utilities</option>
              <option value="Other" className="bg-[var(--surface)]">Other (Custom)</option>
            </select>
          </div>
        </div>

        {category === "Other" && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Custom Category</label>
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="e.g. Shopping"
              className="w-full py-2 bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] outline-none text-[var(--foreground)]"
              required
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Date</label>
              <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full py-2 bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] outline-none text-[var(--foreground)] cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Notes</label>
              <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details..."
                  className="w-full py-2 bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] outline-none text-[var(--foreground)]"
              />
            </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[var(--accent)] text-[var(--background)] font-bold text-xs uppercase tracking-widest rounded-lg cursor-pointer hover:opacity-90 disabled:opacity-50 mt-4 shadow-sm"
        >
          {loading ? "Registering..." : "Submit Entry"}
        </button>
      </form>
    </div>
  );
}
