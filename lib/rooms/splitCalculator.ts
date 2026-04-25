export type SplitType = "equal" | "manual" | "percentage" | "ratio";

export interface SplitEntry {
  userId: string;
  amount: number; // integer, smallest currency unit
}

export interface SplitInput {
  splitType: SplitType;
  totalAmount: number; // integer, smallest unit
  involvedUsers: string[]; // ordered list of user IDs
  /**
   * For manual: { [userId]: amount_in_smallest_unit }
   * For percentage: { [userId]: percentage_value (0-100) }
   * For ratio: { [userId]: ratio_value }
   * Not required for equal split.
   */
  splitData?: Record<string, number>;
}

/**
 * Pure function — no DB calls. Returns distribution array mapping userId → amount in smallest unit.
 * All amounts are integers. Rounding remainder always goes to the first user.
 */
export function calculateSplit(input: SplitInput): SplitEntry[] {
  const { splitType, totalAmount, involvedUsers, splitData } = input;

  if (involvedUsers.length === 0) throw new Error("At least one user must be involved");
  if (totalAmount <= 0) throw new Error("totalAmount must be positive");

  switch (splitType) {
    case "equal": {
      const n = involvedUsers.length;
      const perPerson = Math.floor(totalAmount / n);
      const remainder = totalAmount - perPerson * n;
      return involvedUsers.map((userId, i) => ({
        userId,
        amount: perPerson + (i < remainder ? 1 : 0),
      }));
    }

    case "manual": {
      if (!splitData) throw new Error("splitData is required for manual split");
      const entries: SplitEntry[] = involvedUsers.map((userId) => {
        const amount = splitData[userId];
        if (amount === undefined || !Number.isInteger(amount) || amount < 0) {
          throw new Error(`Invalid or missing amount for user ${userId}`);
        }
        return { userId, amount };
      });
      const sum = entries.reduce((acc, e) => acc + e.amount, 0);
      if (sum !== totalAmount) {
        throw new Error(
          `Manual distribution sums to ${sum} but totalAmount is ${totalAmount}`
        );
      }
      return entries;
    }

    case "percentage": {
      if (!splitData) throw new Error("splitData is required for percentage split");
      const percentages = involvedUsers.map((u) => splitData[u] ?? 0);
      const pctSum = percentages.reduce((a, b) => a + b, 0);
      if (Math.abs(pctSum - 100) > 0.5) {
        throw new Error(`Percentages must sum to 100 (got ${pctSum})`);
      }
      const entries: SplitEntry[] = involvedUsers.map((userId, i) => ({
        userId,
        amount: Math.floor((totalAmount * percentages[i]) / 100),
      }));
      // Fix rounding: add remainder to first entry
      const sum = entries.reduce((acc, e) => acc + e.amount, 0);
      entries[0].amount += totalAmount - sum;
      return entries;
    }

    case "ratio": {
      if (!splitData) throw new Error("splitData is required for ratio split");
      const ratios = involvedUsers.map((u) => splitData[u] ?? 0);
      const ratioSum = ratios.reduce((a, b) => a + b, 0);
      if (ratioSum <= 0) throw new Error("Ratio sum must be positive");
      const entries: SplitEntry[] = involvedUsers.map((userId, i) => ({
        userId,
        amount: Math.floor((totalAmount * ratios[i]) / ratioSum),
      }));
      // Fix rounding
      const sum = entries.reduce((acc, e) => acc + e.amount, 0);
      entries[0].amount += totalAmount - sum;
      return entries;
    }

    default:
      throw new Error(`Unknown split type: ${splitType}`);
  }
}

/** Validate split input before calling calculateSplit */
export function validateSplitInput(
  input: SplitInput,
  roomUserIds: string[]
): void {
  const roomSet = new Set(roomUserIds);

  // All involved users must be room members
  for (const uid of input.involvedUsers) {
    if (!roomSet.has(uid)) {
      throw new Error(`User ${uid} is not a member of this room`);
    }
  }

  // No duplicates
  const unique = new Set(input.involvedUsers);
  if (unique.size !== input.involvedUsers.length) {
    throw new Error("Duplicate users in involvedUsers");
  }
}
