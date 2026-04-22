using System.Security.Claims;
using AutoMapper;
using FinanceTracker.Controllers;
using FinanceTracker.Models;
using FinanceTracker.Providers;
using FinanceTracker.Services;
using FinanceTracker.Tests.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace FinanceTracker.Tests.Controllers;

public class CategoryControllerTests
{
    private readonly IMapper _mapper;

    public CategoryControllerTests()
    {
        var config = new MapperConfiguration(
            cfg => cfg.AddProfile<MappingProfile>(),
            NullLoggerFactory.Instance
        );
        _mapper = config.CreateMapper();
    }

    private CategoryController CreateController(out DBContext context, Guid? userId = null)
    {
        context = DbContextFactory.Create();
        var provider = new CategoryProvider(context);
        var controller = new CategoryController(
            NullLogger<CategoryController>.Instance,
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
    public async Task Get_ReturnsAllCategoriesMappedToDTO()
    {
        var controller = CreateController(out var context);
        SeedCategory(context, "Food");
        SeedCategory(context, "Transport");

        var result = await controller.Get();

        var list = Assert.IsAssignableFrom<IEnumerable<CategoryListDTO>>(result);
        Assert.Equal(2, list.Count());
    }

    [Fact]
    public async Task GetCategoryById_ReturnsCategory_WhenFound()
    {
        var controller = CreateController(out var context);
        var cat = SeedCategory(context, "Entertainment");

        var result = await controller.GetCategoryById(cat.Id);

        Assert.NotNull(result);
        Assert.Equal(cat.Id, result.Id);
        Assert.Equal("Entertainment", result.Name);
    }

    [Fact]
    public async Task GetCategoryById_ReturnsNull_WhenNotFound()
    {
        var controller = CreateController(out _);

        var result = await controller.GetCategoryById(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateCategory_ReturnsCreated_WithLocationHeader()
    {
        var controller = CreateController(out _);
        var dto = new CategoryMutationDTO { Name = "New Category" };

        var result = await controller.CreateCategory(dto);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(201, created.StatusCode);
        Assert.NotNull(created.Value);
    }

    [Fact]
    public async Task UpdateCategory_ReturnsNoContent_WhenFound()
    {
        var controller = CreateController(out var context);
        var cat = SeedCategory(context, "OldName");

        var result = await controller.UpdateCategory(
            cat.Id,
            new CategoryMutationDTO { Name = "NewName" }
        );

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task UpdateCategory_ReturnsNotFound_WhenMissing()
    {
        var controller = CreateController(out _);

        var result = await controller.UpdateCategory(
            Guid.NewGuid(),
            new CategoryMutationDTO { Name = "X" }
        );

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task DeleteCategory_ReturnsNoContent_WhenFound()
    {
        var controller = CreateController(out var context);
        var cat = SeedCategory(context);

        var result = await controller.DeleteCategory(cat.Id);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task DeleteCategory_ReturnsNotFound_WhenMissing()
    {
        var controller = CreateController(out _);

        var result = await controller.DeleteCategory(Guid.NewGuid());

        Assert.IsType<NotFoundResult>(result);
    }
}
