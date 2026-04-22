using System.Security.Cryptography;
using System.Text;
using FinanceTracker.Models;
using FinanceTracker.Providers;
using FinanceTracker.Services;
using FinanceTracker.Tests.Helpers;
using Xunit;
using static FinanceTracker.Interfaces.Common;

namespace FinanceTracker.Tests.Providers;

public class UserProviderTests
{
    private (UserProvider provider, DBContext context, UserSessionService sessionService) CreateProvider()
    {
        var context = DbContextFactory.Create();
        var jwtService = new JwtTokenService(TestHelpers.CreateJwtSettings());
        var sessionService = new UserSessionService();
        var provider = new UserProvider(context, TestHelpers.CreateAuthSettings(), jwtService, sessionService);
        return (provider, context, sessionService);
    }

    private static string ComputeCodeChallenge(string codeVerifier)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(codeVerifier));
        return Convert.ToBase64String(hash).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static async Task<User> SeedUser(
        DBContext context,
        string username = "testuser",
        string password = "Password123!",
        UserRole role = UserRole.User
    )
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            Password = BCrypt.Net.BCrypt.HashPassword(password),
            Role = role,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = Guid.NewGuid(),
        };
        context.User.Add(user);
        await context.SaveChangesAsync();
        return user;
    }

    // ── GetUserByUsername ────────────────────────────────────────────────────

    [Fact]
    public async Task GetUserByUsername_ReturnsUser_WhenExists()
    {
        var (provider, context, _) = CreateProvider();
        await SeedUser(context, "john");

        var result = await provider.GetUserByUsername("john");

        Assert.NotNull(result);
        Assert.Equal("john", result.Username);
    }

    [Fact]
    public async Task GetUserByUsername_ReturnsNull_WhenNotExists()
    {
        var (provider, _, _) = CreateProvider();

        var result = await provider.GetUserByUsername("nobody");

        Assert.Null(result);
    }

    // ── GetAllRoles ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllRoles_ReturnsAllUserRoleEnumValues()
    {
        var (provider, _, _) = CreateProvider();

        var result = await provider.GetAllRoles();

        var expectedNames = Enum.GetNames<UserRole>();
        Assert.Equal(expectedNames.Length, result.Count);
        foreach (var name in expectedNames)
            Assert.Contains(result, r => r.Label == name);
    }

    [Fact]
    public async Task GetAllRoles_RoleValues_MatchEnumIntValues()
    {
        var (provider, _, _) = CreateProvider();

        var result = await provider.GetAllRoles();

        foreach (var option in result)
        {
            var parsed = Enum.Parse<UserRole>(option.Label);
            Assert.Equal(((int)parsed).ToString(), option.Value);
        }
    }

    // ── GetUsers ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetUsers_ReturnsPaginatedList()
    {
        var (provider, context, _) = CreateProvider();
        for (int i = 0; i < 5; i++)
            await SeedUser(context, $"user{i}");

        var result = await provider.GetUsers(new QueryParams { Page = 1, PageSize = 3 });

        Assert.Equal(3, result.Count());
    }

    [Fact]
    public async Task GetUsers_SecondPage_ReturnsRemainingItems()
    {
        var (provider, context, _) = CreateProvider();
        for (int i = 0; i < 5; i++)
            await SeedUser(context, $"pageuser{i}");

        var result = await provider.GetUsers(new QueryParams { Page = 2, PageSize = 3 });

        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task GetUsers_FiltersBy_Username_Search()
    {
        var (provider, context, _) = CreateProvider();
        await SeedUser(context, "alice");
        await SeedUser(context, "bob");
        await SeedUser(context, "alice_admin");

        var result = await provider.GetUsers(new QueryParams { Search = "alice" });

        Assert.Equal(2, result.Count());
        Assert.All(result, u => Assert.Contains("alice", u.Username, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task GetUsers_ReturnsAll_WhenSearchIsNull()
    {
        var (provider, context, _) = CreateProvider();
        await SeedUser(context, "user1");
        await SeedUser(context, "user2");

        var result = await provider.GetUsers(new QueryParams { Search = null });

        Assert.Equal(2, result.Count());
    }

    // ── CreateUser ───────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateUser_HashesPassword_AndSetsAuditFields()
    {
        var (provider, _, _) = CreateProvider();
        var userId = Guid.NewGuid();
        var dto = new UserMutationDTO { Username = "newuser", Password = "Secret123!", Role = UserRole.User };
        var initiator = new MutationInitiator { UserId = userId, Timestamp = DateTime.UtcNow };

        var result = await provider.CreateUser(dto, initiator);

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("newuser", result.Username);
        Assert.True(BCrypt.Net.BCrypt.Verify("Secret123!", result.Password));
        Assert.Equal(userId, result.CreatedBy);
        Assert.Equal(UserRole.User, result.Role);
    }

    // ── HashPassword ─────────────────────────────────────────────────────────

    [Fact]
    public void HashPassword_ReturnsBcryptHash()
    {
        var (provider, _, _) = CreateProvider();
        const string password = "TestPassword123!";

        var hash = provider.HashPassword(password);

        Assert.True(BCrypt.Net.BCrypt.Verify(password, hash));
        Assert.NotEqual(password, hash);
    }

    [Fact]
    public void HashPassword_TwoCallsProduceDifferentHashes()
    {
        var (provider, _, _) = CreateProvider();

        var hash1 = provider.HashPassword("SamePassword");
        var hash2 = provider.HashPassword("SamePassword");

        // BCrypt uses a random salt each time
        Assert.NotEqual(hash1, hash2);
    }

    // ── VerifyUserCredentials ────────────────────────────────────────────────

    [Fact]
    public async Task VerifyUserCredentials_ValidCredentials_ReturnsAuthCode()
    {
        var (provider, context, _) = CreateProvider();
        await SeedUser(context, "loginuser", "Pass123!");
        var codeVerifier = "my-code-verifier-32-chars-exactly!!";
        var loginDTO = new LoginDTO
        {
            Username = "loginuser",
            Password = "Pass123!",
            CodeChallenge = ComputeCodeChallenge(codeVerifier),
        };

        var authCode = await provider.VerifyUserCredentials(loginDTO);

        Assert.False(string.IsNullOrEmpty(authCode));
    }

    [Fact]
    public async Task VerifyUserCredentials_InvalidUsername_ThrowsException()
    {
        var (provider, _, _) = CreateProvider();
        var loginDTO = new LoginDTO { Username = "nobody", Password = "pass", CodeChallenge = "challenge" };

        await Assert.ThrowsAsync<Exception>(() => provider.VerifyUserCredentials(loginDTO));
    }

    [Fact]
    public async Task VerifyUserCredentials_WrongPassword_ThrowsException()
    {
        var (provider, context, _) = CreateProvider();
        await SeedUser(context, "user", "CorrectPassword");
        var loginDTO = new LoginDTO { Username = "user", Password = "WrongPassword", CodeChallenge = "challenge" };

        await Assert.ThrowsAsync<Exception>(() => provider.VerifyUserCredentials(loginDTO));
    }

    // ── ExchangeAuthCodeForTokens ────────────────────────────────────────────

    [Fact]
    public async Task ExchangeAuthCodeForTokens_ValidFlow_ReturnsTokenPair()
    {
        var (provider, context, _) = CreateProvider();
        await SeedUser(context, "pkceuser", "Pass123!");
        var codeVerifier = "valid-code-verifier-string-for-test";
        var authCode = await provider.VerifyUserCredentials(new LoginDTO
        {
            Username = "pkceuser",
            Password = "Pass123!",
            CodeChallenge = ComputeCodeChallenge(codeVerifier),
        });

        var (accessToken, refreshToken) = await provider.ExchangeAuthCodeForTokens(authCode, codeVerifier);

        Assert.False(string.IsNullOrEmpty(accessToken));
        Assert.False(string.IsNullOrEmpty(refreshToken));
    }

    [Fact]
    public async Task ExchangeAuthCodeForTokens_InvalidAuthCode_ThrowsException()
    {
        var (provider, _, _) = CreateProvider();

        await Assert.ThrowsAsync<Exception>(() =>
            provider.ExchangeAuthCodeForTokens("invalid-auth-code", "any-verifier"));
    }

    [Fact]
    public async Task ExchangeAuthCodeForTokens_WrongCodeVerifier_ThrowsException()
    {
        var (provider, context, _) = CreateProvider();
        await SeedUser(context, "pkceuser2", "Pass123!");
        var correctVerifier = "correct-code-verifier-string-32char";
        var authCode = await provider.VerifyUserCredentials(new LoginDTO
        {
            Username = "pkceuser2",
            Password = "Pass123!",
            CodeChallenge = ComputeCodeChallenge(correctVerifier),
        });

        await Assert.ThrowsAsync<Exception>(() =>
            provider.ExchangeAuthCodeForTokens(authCode, "wrong-verifier"));
    }

    // ── RefreshTokens ────────────────────────────────────────────────────────

    [Fact]
    public async Task RefreshTokens_ValidToken_ReturnsNewTokenPair_InvalidatesOld()
    {
        var (provider, context, sessionService) = CreateProvider();
        await SeedUser(context, "refreshuser", "Pass123!");
        var codeVerifier = "refresh-test-code-verifier-string!";
        var authCode = await provider.VerifyUserCredentials(new LoginDTO
        {
            Username = "refreshuser",
            Password = "Pass123!",
            CodeChallenge = ComputeCodeChallenge(codeVerifier),
        });
        var (_, oldRefreshToken) = await provider.ExchangeAuthCodeForTokens(authCode, codeVerifier);

        var (newAccessToken, newRefreshToken) = await provider.RefreshTokens(oldRefreshToken);

        Assert.False(string.IsNullOrEmpty(newAccessToken));
        Assert.False(string.IsNullOrEmpty(newRefreshToken));
        Assert.NotEqual(oldRefreshToken, newRefreshToken);
        Assert.Null(sessionService.GetSession(oldRefreshToken));
    }

    [Fact]
    public async Task RefreshTokens_ExpiredToken_ThrowsException()
    {
        var (provider, context, sessionService) = CreateProvider();
        var user = await SeedUser(context);
        var expiredToken = "expired-refresh-token";
        sessionService.CreateSession(expiredToken, user.Id, DateTime.UtcNow.AddMinutes(-1));

        await Assert.ThrowsAsync<Exception>(() => provider.RefreshTokens(expiredToken));
    }

    [Fact]
    public async Task RefreshTokens_UnknownToken_ThrowsException()
    {
        var (provider, _, _) = CreateProvider();

        await Assert.ThrowsAsync<Exception>(() => provider.RefreshTokens("unknown-refresh-token"));
    }
}
