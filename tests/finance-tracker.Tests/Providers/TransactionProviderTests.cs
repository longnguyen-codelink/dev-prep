using FinanceTracker.Models;
using FinanceTracker.Providers;
using FinanceTracker.Services;
using FinanceTracker.Tests.Helpers;
using Xunit;
using static FinanceTracker.Interfaces.Common;

namespace FinanceTracker.Tests.Providers;

public class TransactionProviderTests
{
    private TransactionProvider CreateProvider(out DBContext context)
    {
        context = DbContextFactory.Create();
        return new TransactionProvider(context);
    }

    private static Transaction MakeTransaction(
        Guid categoryId,
        TransactionType type,
        decimal value,
        DateTime eventDate
    ) => new()
    {
        Id = Guid.NewGuid(),
        CategoryId = categoryId,
        Type = type,
        Value = value,
        EventDate = DateTime.SpecifyKind(eventDate, DateTimeKind.Utc),
        CreatedAt = DateTime.UtcNow,
        CreatedBy = Guid.NewGuid(),
    };

    [Fact]
    public async Task GetTransactions_ReturnsAllTransactions()
    {
        var provider = CreateProvider(out var context);
        var catId = Guid.NewGuid();
        context.Category.Add(new Category { Id = catId, Name = "TestCat", CreatedAt = DateTime.UtcNow, CreatedBy = Guid.NewGuid() });
        context.Transaction.AddRange(
            MakeTransaction(catId, TransactionType.Income, 10m, DateTime.UtcNow),
            MakeTransaction(catId, TransactionType.Expense, 20m, DateTime.UtcNow)
        );
        await context.SaveChangesAsync();

        var result = await provider.GetTransactions(new QueryParams());

        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task GetTransactions_SortedByEventDateDescending()
    {
        var provider = CreateProvider(out var context);
        var catId = Guid.NewGuid();
        context.Category.Add(new Category { Id = catId, Name = "TestCat", CreatedAt = DateTime.UtcNow, CreatedBy = Guid.NewGuid() });
        var older = MakeTransaction(catId, TransactionType.Income, 10m, DateTime.UtcNow.AddDays(-2));
        var newer = MakeTransaction(catId, TransactionType.Income, 20m, DateTime.UtcNow.AddDays(-1));
        context.Transaction.AddRange(older, newer);
        await context.SaveChangesAsync();

        var result = (await provider.GetTransactions(new QueryParams())).ToList();

        Assert.Equal(newer.Id, result[0].Id);
        Assert.Equal(older.Id, result[1].Id);
    }

    [Fact]
    public async Task GetTransactionById_ReturnsTransaction_WhenExists()
    {
        var provider = CreateProvider(out var context);
        var tx = MakeTransaction(Guid.NewGuid(), TransactionType.Expense, 50m, DateTime.UtcNow);
        context.Transaction.Add(tx);
        await context.SaveChangesAsync();

        var result = await provider.GetTransactionById(tx.Id);

        Assert.NotNull(result);
        Assert.Equal(tx.Id, result.Id);
    }

    [Fact]
    public async Task GetTransactionById_ReturnsNull_WhenNotExists()
    {
        var provider = CreateProvider(out _);

        var result = await provider.GetTransactionById(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateTransaction_MapsAmountToValue_AndDateToEventDate()
    {
        var provider = CreateProvider(out _);
        var catId = Guid.NewGuid();
        var date = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc);
        var dto = new TransactionMutationDTO
        {
            CategoryId = catId,
            Type = TransactionType.Income,
            Amount = 150.50m,
            Date = date,
        };

        var result = await provider.CreateTransaction(dto, TestHelpers.CreateMutationInitiator());

        Assert.Equal(150.50m, result.Value);
        Assert.Equal(date, result.EventDate);
        Assert.Equal(catId, result.CategoryId);
        Assert.Equal(TransactionType.Income, result.Type);
    }

    [Fact]
    public async Task CreateTransaction_NormalizesEventDateToUtc_WhenUnspecifiedKind()
    {
        var provider = CreateProvider(out _);
        var unspecifiedDate = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Unspecified);
        var dto = new TransactionMutationDTO
        {
            CategoryId = Guid.NewGuid(),
            Type = TransactionType.Expense,
            Amount = 10m,
            Date = unspecifiedDate,
        };

        var result = await provider.CreateTransaction(dto, TestHelpers.CreateMutationInitiator());

        Assert.Equal(DateTimeKind.Utc, result.EventDate.Kind);
        Assert.Equal(unspecifiedDate.Ticks, result.EventDate.Ticks);
    }

    [Fact]
    public async Task CreateTransaction_SetsAuditFields()
    {
        var provider = CreateProvider(out _);
        var userId = Guid.NewGuid();
        var timestamp = DateTime.UtcNow;
        var dto = new TransactionMutationDTO
        {
            CategoryId = Guid.NewGuid(),
            Type = TransactionType.Income,
            Amount = 100m,
            Date = DateTime.UtcNow,
        };

        var result = await provider.CreateTransaction(dto, new MutationInitiator { UserId = userId, Timestamp = timestamp });

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(userId, result.CreatedBy);
        Assert.Equal(timestamp, result.CreatedAt);
    }

    [Fact]
    public async Task UpdateTransaction_UpdatesAllFields()
    {
        var provider = CreateProvider(out var context);
        var tx = MakeTransaction(Guid.NewGuid(), TransactionType.Income, 100m, DateTime.UtcNow);
        context.Transaction.Add(tx);
        await context.SaveChangesAsync();

        var newCatId = Guid.NewGuid();
        var newDate = new DateTime(2026, 3, 15, 0, 0, 0, DateTimeKind.Utc);
        var dto = new TransactionMutationDTO
        {
            CategoryId = newCatId,
            Type = TransactionType.Expense,
            Amount = 200m,
            Date = newDate,
        };
        var updaterId = Guid.NewGuid();
        var updateTime = DateTime.UtcNow;

        var result = await provider.UpdateTransaction(tx.Id, dto, new MutationInitiator { UserId = updaterId, Timestamp = updateTime });

        Assert.NotNull(result);
        Assert.Equal(200m, result.Value);
        Assert.Equal(newDate, result.EventDate);
        Assert.Equal(newCatId, result.CategoryId);
        Assert.Equal(TransactionType.Expense, result.Type);
        Assert.Equal(updaterId, result.UpdatedBy);
        Assert.Equal(updateTime, result.UpdatedAt);
    }

    [Fact]
    public async Task UpdateTransaction_ReturnsNull_WhenNotFound()
    {
        var provider = CreateProvider(out _);
        var dto = new TransactionMutationDTO
        {
            CategoryId = Guid.NewGuid(),
            Type = TransactionType.Income,
            Amount = 10m,
            Date = DateTime.UtcNow,
        };

        var result = await provider.UpdateTransaction(Guid.NewGuid(), dto, TestHelpers.CreateMutationInitiator());

        Assert.Null(result);
    }

    [Fact]
    public async Task GetSummary_CalculatesTotalIncome_TotalExpense_NetBalance()
    {
        var provider = CreateProvider(out var context);
        var catId = Guid.NewGuid();
        context.Transaction.AddRange(
            MakeTransaction(catId, TransactionType.Income, 500m, DateTime.UtcNow),
            MakeTransaction(catId, TransactionType.Income, 300m, DateTime.UtcNow),
            MakeTransaction(catId, TransactionType.Expense, 200m, DateTime.UtcNow)
        );
        await context.SaveChangesAsync();

        var result = await provider.GetSummary(Guid.Empty);

        Assert.Equal(800m, result.TotalIncome);
        Assert.Equal(200m, result.TotalExpense);
        Assert.Equal(600m, result.NetBalance);
    }

    [Fact]
    public async Task GetSummary_FiltersByCategoryId_WhenProvided()
    {
        var provider = CreateProvider(out var context);
        var catId = Guid.NewGuid();
        var otherCatId = Guid.NewGuid();
        context.Transaction.AddRange(
            MakeTransaction(catId, TransactionType.Income, 100m, DateTime.UtcNow),
            MakeTransaction(otherCatId, TransactionType.Income, 999m, DateTime.UtcNow)
        );
        await context.SaveChangesAsync();

        var result = await provider.GetSummary(catId);

        Assert.Equal(100m, result.TotalIncome);
        Assert.Equal(0m, result.TotalExpense);
        Assert.Equal(100m, result.NetBalance);
    }

    [Fact]
    public async Task GetSummary_ReturnsZeros_WhenNoTransactions()
    {
        var provider = CreateProvider(out _);

        var result = await provider.GetSummary(Guid.Empty);

        Assert.Equal(0m, result.TotalIncome);
        Assert.Equal(0m, result.TotalExpense);
        Assert.Equal(0m, result.NetBalance);
    }
}
