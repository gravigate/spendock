import { Transaction } from "./types";

export function calculateBalance(
  date: Date,
  transactions: Transaction[],
  startingBalance: number = 0
): number {
  let balance = startingBalance;

  // Get all transactions that should apply up to and including this date
  const applicableTransactions = getAllTransactionsUpToDate(date, transactions);

  // Apply each transaction to the balance
  for (const transaction of applicableTransactions) {
    if (transaction.type === "incoming") {
      balance += transaction.amount;
    } else {
      balance -= transaction.amount;
    }
  }

  return balance;
}

export function getAllTransactionsUpToDate(
  targetDate: Date,
  transactions: Transaction[]
): Transaction[] {
  const result: Transaction[] = [];
  const targetTime = targetDate.getTime();

  for (const transaction of transactions) {
    const transactionDate = new Date(transaction.date);
    const transactionTime = transactionDate.getTime();

    // If it's a one-time transaction
    if (transaction.recurring === "once") {
      if (transactionTime <= targetTime) {
        result.push(transaction);
      }
      continue;
    }

    // For recurring transactions, calculate all occurrences
    const occurrences = getRecurringOccurrences(
      transaction,
      transactionDate,
      targetDate
    );
    result.push(...occurrences);
  }

  return result;
}

function getRecurringOccurrences(
  transaction: Transaction,
  startDate: Date,
  endDate: Date
): Transaction[] {
  const occurrences: Transaction[] = [];
  const endTime = endDate.getTime();
  let currentDate = new Date(startDate);

  // Limit iterations to prevent infinite loops
  let iterations = 0;
  const maxIterations = 1000;

  while (currentDate.getTime() <= endTime && iterations < maxIterations) {
    occurrences.push({
      ...transaction,
      date: currentDate.toISOString(),
    });

    // Move to next occurrence
    switch (transaction.recurring) {
      case "weekly":
        currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        currentDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          currentDate.getDate()
        );
        break;
      case "yearly":
        currentDate = new Date(
          currentDate.getFullYear() + 1,
          currentDate.getMonth(),
          currentDate.getDate()
        );
        break;
      default:
        return occurrences;
    }

    iterations++;
  }

  return occurrences;
}

export function generateYearDays(year: number = new Date().getFullYear()): Date[] {
  const days: Date[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}