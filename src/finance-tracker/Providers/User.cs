namespace FinanceTracker.Providers;

using BCrypt.Net;
using FinanceTracker.Interfaces;
using FinanceTracker.Models;
using FinanceTracker.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

public class UserProvider(
    DBContext dBContext,
    IOptions<AuthSettings> _authSettings,
    JwtTokenService jwtTokenService,
    UserSessionService userSessionService
) : BaseProvider<User>(dBContext)
{
    private readonly AuthSettings authSettings = _authSettings.Value;

    public async Task<User?> GetUserByUsername(string username)
    {
        return await DBContext.User.FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User> CreateUser(User user)
    {
        user.Id = Guid.NewGuid();
        user.CreatedAt = DateTime.UtcNow;
        user.CreatedBy = Guid.Empty; // Replace with actual user ID

        await DBContext.User.AddAsync(user);
        await DBContext.SaveChangesAsync();

        return user;
    }

    public async Task<string> VerifyUserCredentials(LoginDTO loginDTO)
    {
        var user = await GetUserByUsername(loginDTO.Username);
        if (user == null)
            throw new Exception("User not found");

        if (!BCrypt.Verify(loginDTO.Password, user.Password))
            throw new Exception("Invalid password");

        string authCode = userSessionService.CreateLoginRequest(loginDTO.CodeChallenge, user.Id);
        return authCode;
    }

    public async Task<(string AccessToken, string RefreshToken)> ExchangeAuthCodeForTokens(
        string authCode,
        string codeVerifier
    )
    {
        var loginRequest = userSessionService.GetLoginRequest(authCode);
        if (loginRequest == null)
            throw new Exception("Invalid auth code");

        // Verify the code verifier matches the code challenge
        if (!VerifyCodeChallenge(codeVerifier, loginRequest.CodeChallenge))
            throw new Exception("Invalid code verifier");

        var user = await DBContext.User.FindAsync(loginRequest.UserId);
        if (user == null)
            throw new Exception("User not found");

        string accessToken = await GenerateAccessToken(user);
        string refreshToken = await SetSession(user);

        return (accessToken, refreshToken);
    }

    public async Task<(string AccessToken, string RefreshToken)> RefreshTokens(string refreshToken)
    {
        var session = userSessionService.GetSession(refreshToken);
        if (session == null || session.ExpiresAt < DateTime.UtcNow)
            throw new Exception("Invalid or expired refresh token");

        var user = await DBContext.User.FindAsync(session.UserId);
        if (user == null)
            throw new Exception("User not found");

        string accessToken = await GenerateAccessToken(user);
        string newRefreshToken = await SetSession(user);

        // Invalidate the old refresh token
        userSessionService.RemoveSession(refreshToken);

        return (accessToken, newRefreshToken);
    }

    private static bool VerifyCodeChallenge(string codeVerifier, string codeChallenge)
    {
        var hash = System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(codeVerifier)
        );
        string computedChallenge = Convert
            .ToBase64String(hash)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

        if (computedChallenge != codeChallenge)
            throw new Exception("Invalid code verifier");

        return computedChallenge == codeChallenge;
    }

    private async Task<string> GenerateAccessToken(User user)
    {
        TimeSpan timeSpan = TimeSpan.FromMinutes(authSettings.AccessTokenExpireTimeInMinutes);
        DateTime expiresAt = DateTime.UtcNow.Add(timeSpan);
        return jwtTokenService.GenerateToken(user.Id, user.Role, expiresAt);
    }

    private async Task<string> SetSession(User user)
    {
        string refreshToken = UserSessionService.GenerateSessionToken();
        int refreshTokenExpireTimeInMinutes = authSettings.RefreshTokenExpireTimeInMinutes;
        TimeSpan refreshTokenTimeSpan = TimeSpan.FromMinutes(refreshTokenExpireTimeInMinutes);
        DateTime refreshTokenExpiresAt = DateTime.UtcNow.Add(refreshTokenTimeSpan);
        userSessionService.CreateSession(refreshToken, user.Id, refreshTokenExpiresAt);

        return refreshToken;
    }
}
