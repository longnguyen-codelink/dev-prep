using System.Security.Cryptography;
using System.Text;
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

public class AuthControllerTests
{
    private static (
        AuthController controller,
        UserProvider provider,
        DBContext context
    ) CreateStack()
    {
        var context = DbContextFactory.Create();
        var jwtService = new JwtTokenService(TestHelpers.CreateJwtSettings());
        var sessionService = new UserSessionService();
        var authSettings = TestHelpers.CreateAuthSettings();
        var provider = new UserProvider(context, authSettings, jwtService, sessionService);
        var controller = new AuthController(provider, authSettings)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
        return (controller, provider, context);
    }

    private static async Task<User> SeedUser(
        DBContext context,
        string username = "testuser",
        string password = "Pass123!"
    )
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            Password = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = Guid.NewGuid(),
        };
        context.User.Add(user);
        await context.SaveChangesAsync();
        return user;
    }

    private static string ComputeCodeChallenge(string codeVerifier)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(codeVerifier));
        return Convert.ToBase64String(hash).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsOkWithAuthCode()
    {
        var (controller, _, context) = CreateStack();
        await SeedUser(context, "loginuser", "Pass123!");
        var codeVerifier = "test-code-verifier-string-for-login";
        var loginDTO = new LoginDTO
        {
            Username = "loginuser",
            Password = "Pass123!",
            CodeChallenge = ComputeCodeChallenge(codeVerifier),
        };

        var result = await controller.Login(loginDTO);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task Login_InvalidUsername_ThrowsException()
    {
        var (controller, _, _) = CreateStack();
        var loginDTO = new LoginDTO
        {
            Username = "nobody",
            Password = "pass",
            CodeChallenge = "challenge",
        };

        await Assert.ThrowsAsync<Exception>(() => controller.Login(loginDTO));
    }

    [Fact]
    public async Task Login_WrongPassword_ThrowsException()
    {
        var (controller, _, context) = CreateStack();
        await SeedUser(context, "user", "CorrectPass");
        var loginDTO = new LoginDTO
        {
            Username = "user",
            Password = "WrongPass",
            CodeChallenge = "challenge",
        };

        await Assert.ThrowsAsync<Exception>(() => controller.Login(loginDTO));
    }

    [Fact]
    public async Task ExchangeToken_ValidCode_ReturnsOkAndSetsCookie()
    {
        var (controller, provider, context) = CreateStack();
        await SeedUser(context, "tokenuser", "Pass123!");
        var codeVerifier = "exchange-code-verifier-for-test-abc";
        var codeChallenge = ComputeCodeChallenge(codeVerifier);
        var authCode = await provider.VerifyUserCredentials(
            new LoginDTO
            {
                Username = "tokenuser",
                Password = "Pass123!",
                CodeChallenge = codeChallenge,
            }
        );

        var result = await controller.ExchangeToken(
            new TokenExchangeDTO { Code = authCode, CodeVerifier = codeVerifier }
        );

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
        var setCookieHeader = controller.Response.Headers["Set-Cookie"].ToString();
        Assert.Contains("AuthToken", setCookieHeader);
    }

    [Fact]
    public async Task ExchangeToken_InvalidCode_ThrowsException()
    {
        var (controller, _, _) = CreateStack();

        await Assert.ThrowsAsync<Exception>(() =>
            controller.ExchangeToken(
                new TokenExchangeDTO { Code = "bad-code", CodeVerifier = "any-verifier" }
            )
        );
    }

    [Fact]
    public async Task RefreshToken_ValidCookie_ReturnsOkWithNewAccessToken()
    {
        var (controller, provider, context) = CreateStack();
        await SeedUser(context, "refreshuser", "Pass123!");
        var codeVerifier = "refresh-code-verifier-for-test-abc";
        var authCode = await provider.VerifyUserCredentials(
            new LoginDTO
            {
                Username = "refreshuser",
                Password = "Pass123!",
                CodeChallenge = ComputeCodeChallenge(codeVerifier),
            }
        );
        var (_, refreshToken) = await provider.ExchangeAuthCodeForTokens(authCode, codeVerifier);

        controller.HttpContext.Request.Headers["Cookie"] = $"AuthToken={refreshToken}";

        var result = await controller.RefreshToken();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task RefreshToken_MissingCookie_ReturnsUnauthorized()
    {
        var (controller, _, _) = CreateStack();
        // No cookie set in request

        var result = await controller.RefreshToken();

        Assert.IsType<UnauthorizedResult>(result);
    }
}
