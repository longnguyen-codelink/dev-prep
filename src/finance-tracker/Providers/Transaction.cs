namespace FinanceTracker.Providers;

using FinanceTracker.Interfaces;
using FinanceTracker.Models;
using FinanceTracker.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public class TransactionProvider(DBContext dBContext) : BaseProvider<Transaction>(dBContext)
{
    public async Task<IEnumerable<Transaction>> GetTransactions(Common.QueryParams queryParams)
    {
        // Placeholder for fetching transactions from the database with pagination and filtering
        return await DBContext.Transaction.ToListAsync();
    }

    public async Task<IEnumerable<Transaction>> GetTransactions()
    {
        // Placeholder for fetching transactions from the database
        return await DBContext.Transaction.ToListAsync();
    }

    public async Task<Transaction?> GetTransactionById(Guid id)
    {
        return await DBContext.Transaction.FindAsync(id);
    }

    public async Task<Transaction> CreateTransaction(
        TransactionMutationDTO transaction,
        Common.IMutationInitiator mutationInitiator
    )
    {
        Transaction newTransaction = new()
        {
            Id = Guid.NewGuid(),
            Value = transaction.Amount,
            EventDate = NormalizeUtcTimestamp(transaction.Date),
            CategoryId = transaction.CategoryId,
            Type = transaction.Type,
            CreatedAt = mutationInitiator.Timestamp,
            CreatedBy = mutationInitiator.UserId,
        };

        await DBContext.Transaction.AddAsync(newTransaction);
        await DBContext.SaveChangesAsync();

        return newTransaction;
    }

    public async Task<Transaction?> UpdateTransaction(
        Guid id,
        TransactionMutationDTO transaction,
        Common.IMutationInitiator mutationInitiator
    )
    {
        var existingTransaction = await DBContext.Transaction.FindAsync(id);
        if (existingTransaction == null)
        {
            return null;
        }

        existingTransaction.Value = transaction.Amount;
        existingTransaction.EventDate = NormalizeUtcTimestamp(transaction.Date);
        existingTransaction.CategoryId = transaction.CategoryId;
        existingTransaction.Type = transaction.Type;
        existingTransaction.UpdatedAt = mutationInitiator.Timestamp;
        existingTransaction.UpdatedBy = mutationInitiator.UserId;

        DBContext.Transaction.Update(existingTransaction);
        await DBContext.SaveChangesAsync();

        return existingTransaction;
    }

    public async Task<IActionResult> GetSummary()
    {
        throw new NotImplementedException();
    }
}
