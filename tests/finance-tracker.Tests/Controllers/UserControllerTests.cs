using System.Security.Claims;
using FinanceTracker.Controllers;
using FinanceTracker.Interfaces;
using FinanceTracker.Models;
using FinanceTracker.Providers;
using FinanceTracker.Services;
using FinanceTracker.Tests.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace FinanceTracker.Tests.Controllers;

public class UserControllerTests
{
    private (UserController controller, DBContext context) CreateController(Guid? userId = null)
    {
        var context = DbContextFactory.Create();
        var jwtService = new JwtTokenService(TestHelpers.CreateJwtSettings());
        var sessionService = new UserSessionService();
        var provider = new UserProvider(
            context,
            TestHelpers.CreateAuthSettings(),
            jwtService,
            sessionService
        );
        var controller = new UserController(provider);

        var identity = new ClaimsIdentity(
            [new Claim("sub", (userId ?? Guid.NewGuid()).ToString())],
            "TestAuth"
        );
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) },
        };
        return (controller, context);
    }

    [Fact]
    public async Task GetAllRoles_ReturnsOkWithAllRoles()
    {
        var (controller, _) = CreateController();

        var result = await controller.GetAllRoles();

        var ok = Assert.IsType<OkObjectResult>(result);
        var roles = Assert.IsAssignableFrom<IEnumerable<Common.SelectOption>>(ok.Value);
        Assert.Equal(Enum.GetNames<UserRole>().Length, roles.Count());
    }

    [Fact]
    public async Task GetAllRoles_RoleLabels_MatchEnumNames()
    {
        var (controller, _) = CreateController();

        var result = await controller.GetAllRoles();

        var ok = Assert.IsType<OkObjectResult>(result);
        var roles = Assert.IsAssignableFrom<IEnumerable<Common.SelectOption>>(ok.Value);
        var labels = roles.Select(r => r.Label).ToHashSet();
        foreach (var name in Enum.GetNames<UserRole>())
            Assert.Contains(name, labels);
    }

    [Fact]
    public async Task Get_ReturnsOkWithUserList()
    {
        var (controller, context) = CreateController();
        context.User.Add(
            new User
            {
                Id = Guid.NewGuid(),
                Username = "alice",
                Password = "hash",
                Role = UserRole.User,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = Guid.NewGuid(),
            }
        );
        await context.SaveChangesAsync();

        var result = await controller.Get(new Common.QueryParams());

        var ok = Assert.IsType<OkObjectResult>(result);
        var users = Assert.IsAssignableFrom<IEnumerable<UserListItemDTO>>(ok.Value);
        Assert.Single(users);
    }

    [Fact]
    public async Task Get_ReturnsEmptyList_WhenNoUsers()
    {
        var (controller, _) = CreateController();

        var result = await controller.Get(new Common.QueryParams());

        var ok = Assert.IsType<OkObjectResult>(result);
        var users = Assert.IsAssignableFrom<IEnumerable<UserListItemDTO>>(ok.Value);
        Assert.Empty(users);
    }

    [Fact]
    public async Task CreateUser_ReturnsOk()
    {
        var (controller, _) = CreateController(Guid.NewGuid());
        var dto = new UserMutationDTO
        {
            Username = "newuser",
            Password = "Password123!",
            Role = UserRole.User,
        };

        var result = await controller.CreateUser(dto);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task CreateUser_ResponseContainsUsername()
    {
        var (controller, _) = CreateController(Guid.NewGuid());
        var dto = new UserMutationDTO
        {
            Username = "bob",
            Password = "Pass123!",
            Role = UserRole.User,
        };

        var result = await controller.CreateUser(dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Contains("bob", ok.Value?.ToString());
    }
}
