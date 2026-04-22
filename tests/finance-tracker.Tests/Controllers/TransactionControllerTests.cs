using System.Security.Claims;
using AutoMapper;
using FinanceTracker.Controllers;
using FinanceTracker.Interfaces;
using FinanceTracker.Models;
using FinanceTracker.Providers;
using FinanceTracker.Services;
using FinanceTracker.Tests.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace FinanceTracker.Tests.Controllers;

public class TransactionControllerTests
{
    private readonly IMapper _mapper;

    public TransactionControllerTests()
    {
        var config = new MapperConfiguration(
            cfg => cfg.AddProfile<MappingProfile>(),
            NullLoggerFactory.Instance
        );
        _mapper = config.CreateMapper();
    }

    private TransactionController CreateController(out DBContext context, Guid? userId = null)
    {
        context = DbContextFactory.Create();
        var provider = new TransactionProvider(context);
        var controller = new TransactionController(
            NullLogger<TransactionController>.Instance,
            provider,
            _mapper
        );

        var identity = new ClaimsIdentity(
            [new Claim("sub", (userId ?? Guid.NewGuid()).ToString())],
            "TestAuth"
        );
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) },
        };
        return controller;
    }

    private static (Transaction tx, Guid catId) SeedTransaction(
        DBContext context,
        TransactionType type = TransactionType.Income,
        decimal value = 100m
    )
    {
        var catId = Guid.NewGuid();
        context.Category.Add(
            new Category
            {
                Id = catId,
                Name = "TestCat",
                CreatedAt = DateTime.UtcNow,
                CreatedBy = Guid.NewGuid(),
            }
        );
        var tx = new Transaction
        {
            Id = Guid.NewGuid(),
            CategoryId = catId,
            Type = type,
            Value = value,
            EventDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = Guid.NewGuid(),
        };
        context.Transaction.Add(tx);
        context.SaveChanges();
        return (tx, catId);
    }

    [Fact]
    public async Task Get_ReturnsOkWithTransactionList()
    {
        var controller = CreateController(out var context);
        SeedTransaction(context);
        SeedTransaction(context, TransactionType.Expense, 50m);

        var result = await controller.Get(new Common.QueryParams());

        var ok = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsAssignableFrom<IEnumerable<Transaction>>(ok.Value);
        Assert.Equal(2, list.Count());
    }

    [Fact]
    public async Task Get_ReturnsEmptyList_WhenNoTransactions()
    {
        var controller = CreateController(out _);

        var result = await controller.Get(new Common.QueryParams());

        var ok = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsAssignableFrom<IEnumerable<Transaction>>(ok.Value);
        Assert.Empty(list);
    }

    [Fact]
    public async Task CreateTransaction_ReturnsCreated()
    {
        var controller = CreateController(out _);
        var dto = new TransactionMutationDTO
        {
            CategoryId = Guid.NewGuid(),
            Type = TransactionType.Income,
            Amount = 250m,
            Date = DateTime.UtcNow,
        };

        var result = await controller.CreateTransaction(dto);

        var created = Assert.IsType<CreatedAtRouteResult>(result);
        Assert.Equal(201, created.StatusCode);
        Assert.NotNull(created.Value);
    }

    [Fact]
    public async Task Summary_ReturnsOkWithCorrectTotals()
    {
        var controller = CreateController(out var context);
        var catId = Guid.NewGuid();
        context.Transaction.AddRange(
            new Transaction
            {
                Id = Guid.NewGuid(),
                CategoryId = catId,
                Type = TransactionType.Income,
                Value = 400m,
                EventDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = Guid.NewGuid(),
            },
            new Transaction
            {
                Id = Guid.NewGuid(),
                CategoryId = catId,
                Type = TransactionType.Expense,
                Value = 100m,
                EventDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = Guid.NewGuid(),
            }
        );
        await context.SaveChangesAsync();

        var result = await controller.Summary(catId);

        var ok = Assert.IsType<OkObjectResult>(result);
        var summary = Assert.IsType<TransactionSummaryDTO>(ok.Value);
        Assert.Equal(400m, summary.TotalIncome);
        Assert.Equal(100m, summary.TotalExpense);
        Assert.Equal(300m, summary.NetBalance);
    }

    [Fact]
    public async Task Summary_ReturnsZeros_WhenNoMatchingTransactions()
    {
        var controller = CreateController(out _);

        var result = await controller.Summary(Guid.NewGuid());

        var ok = Assert.IsType<OkObjectResult>(result);
        var summary = Assert.IsType<TransactionSummaryDTO>(ok.Value);
        Assert.Equal(0m, summary.TotalIncome);
        Assert.Equal(0m, summary.TotalExpense);
    }
}
