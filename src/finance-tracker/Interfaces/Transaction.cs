namespace FinanceTracker.Interfaces;

public class TransactionSummaryDTO
{
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal NetBalance { get; set; }
}

public enum TransactionApiType
{
    Income,
    Expense,
    All,
}
