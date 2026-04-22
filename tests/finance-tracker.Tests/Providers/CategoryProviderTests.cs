using FinanceTracker.Models;
using FinanceTracker.Providers;
using FinanceTracker.Services;
using FinanceTracker.Tests.Helpers;
using Xunit;
using static FinanceTracker.Interfaces.Common;

namespace FinanceTracker.Tests.Providers;

public class CategoryProviderTests
{
    private CategoryProvider CreateProvider(out DBContext context)
    {
        context = DbContextFactory.Create();
        return new CategoryProvider(context);
    }

    private static Category SeedCategory(DBContext context, string name = "Test")
    {
        var cat = new Category
        {
            Id = Guid.NewGuid(),
            Name = name,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = Guid.NewGuid(),
        };
        context.Category.Add(cat);
        context.SaveChanges();
        return cat;
    }

    [Fact]
    public async Task GetCategories_ReturnsAllCategories()
    {
        var provider = CreateProvider(out var context);
        SeedCategory(context, "Food");
        SeedCategory(context, "Transport");

        var result = await provider.GetCategories();

        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task GetCategories_ReturnsEmpty_WhenNoneExist()
    {
        var provider = CreateProvider(out _);

        var result = await provider.GetCategories();

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetCategoryById_ReturnsCategory_WhenExists()
    {
        var provider = CreateProvider(out var context);
        var cat = SeedCategory(context, "Food");

        var result = await provider.GetCategoryById(cat.Id);

        Assert.NotNull(result);
        Assert.Equal(cat.Id, result.Id);
        Assert.Equal("Food", result.Name);
    }

    [Fact]
    public async Task GetCategoryById_ReturnsNull_WhenNotExists()
    {
        var provider = CreateProvider(out _);

        var result = await provider.GetCategoryById(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateCategory_PersistsCategory_WithCorrectName()
    {
        var provider = CreateProvider(out _);
        var dto = new CategoryMutationDTO { Name = "Groceries" };
        var initiator = TestHelpers.CreateMutationInitiator();

        var result = await provider.CreateCategory(dto, initiator);

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("Groceries", result.Name);
    }

    [Fact]
    public async Task CreateCategory_SetsAuditFields()
    {
        var provider = CreateProvider(out _);
        var userId = Guid.NewGuid();
        var timestamp = DateTime.UtcNow;
        var initiator = new MutationInitiator { UserId = userId, Timestamp = timestamp };
        var dto = new CategoryMutationDTO { Name = "Bills" };

        var result = await provider.CreateCategory(dto, initiator);

        Assert.Equal(userId, result.CreatedBy);
        Assert.Equal(timestamp, result.CreatedAt);
        Assert.Null(result.UpdatedAt);
        Assert.Null(result.UpdatedBy);
    }

    [Fact]
    public async Task UpdateCategory_UpdatesNameAndAuditFields()
    {
        var provider = CreateProvider(out var context);
        var cat = SeedCategory(context, "Old Name");
        var updaterId = Guid.NewGuid();
        var updateTime = DateTime.UtcNow;
        var initiator = new MutationInitiator { UserId = updaterId, Timestamp = updateTime };

        var result = await provider.UpdateCategory(cat.Id, new CategoryMutationDTO { Name = "New Name" }, initiator);

        Assert.NotNull(result);
        Assert.Equal("New Name", result.Name);
        Assert.Equal(updaterId, result.UpdatedBy);
        Assert.Equal(updateTime, result.UpdatedAt);
    }

    [Fact]
    public async Task UpdateCategory_ReturnsNull_WhenNotFound()
    {
        var provider = CreateProvider(out _);
        var initiator = TestHelpers.CreateMutationInitiator();

        var result = await provider.UpdateCategory(Guid.NewGuid(), new CategoryMutationDTO { Name = "X" }, initiator);

        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteCategory_RemovesCategory_ReturnsTrue()
    {
        var provider = CreateProvider(out var context);
        var cat = SeedCategory(context, "ToDelete");

        var result = await provider.DeleteCategory(cat.Id);

        Assert.True(result);
        Assert.Null(await context.Category.FindAsync(cat.Id));
    }

    [Fact]
    public async Task DeleteCategory_ReturnsFalse_WhenNotFound()
    {
        var provider = CreateProvider(out _);

        var result = await provider.DeleteCategory(Guid.NewGuid());

        Assert.False(result);
    }
}
