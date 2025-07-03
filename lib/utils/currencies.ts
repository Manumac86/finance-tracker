export const formatCurrency = (
  amount: number,
  transactionType: "income" | "expense"
) => {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(absAmount);

  return transactionType === "income" ? `+${formatted}` : `-${formatted}`;
};
