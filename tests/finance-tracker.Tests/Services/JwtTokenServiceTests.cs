using System.IdentityModel.Tokens.Jwt;
using System.Text;
using FinanceTracker.Models;
using FinanceTracker.Services;
using FinanceTracker.Tests.Helpers;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace FinanceTracker.Tests.Services;

public class JwtTokenServiceTests
{
    private readonly JwtTokenService _service;
    private readonly string _secretKey = "test-secret-key-that-is-at-least-32-characters-long!";
    private readonly string _authority = "https://test.authority";
    private readonly string _audience = "https://test.authority";

    public JwtTokenServiceTests()
    {
        _service = new JwtTokenService(
            TestHelpers.CreateJwtSettings(_secretKey, _authority, _audience)
        );
    }

    [Fact]
    public void GenerateToken_ReturnsValidJwt_WithCorrectClaims()
    {
        var userId = Guid.NewGuid();
        var role = UserRole.Admin;
        var expiresAt = DateTime.UtcNow.AddMinutes(15);

        var token = _service.GenerateToken(userId, role, expiresAt);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        Assert.Equal(userId.ToString(), jwt.Claims.First(c => c.Type == "sub").Value);
        Assert.Equal(role.ToString(), jwt.Claims.First(c => c.Type == "role").Value);
    }

    [Fact]
    public void GenerateToken_TokenExpiresAtSpecifiedTime()
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(30);

        var token = _service.GenerateToken(Guid.NewGuid(), UserRole.User, expiresAt);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        Assert.True(Math.Abs((jwt.ValidTo - expiresAt).TotalSeconds) < 5);
    }

    [Fact]
    public void GenerateToken_UsesHmacSha256Algorithm()
    {
        var token = _service.GenerateToken(
            Guid.NewGuid(),
            UserRole.User,
            DateTime.UtcNow.AddMinutes(1)
        );

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        Assert.Equal("HS256", jwt.Header.Alg);
    }

    [Fact]
    public void GenerateToken_HasCorrectIssuerAndAudience()
    {
        var token = _service.GenerateToken(
            Guid.NewGuid(),
            UserRole.User,
            DateTime.UtcNow.AddMinutes(1)
        );

        var handler = new JwtSecurityTokenHandler();
        var validationParams = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = _authority,
            ValidateAudience = true,
            ValidAudience = _audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_secretKey)),
            ValidateLifetime = false,
        };

        // Throws if validation fails
        handler.ValidateToken(token, validationParams, out _);
    }

    [Fact]
    public void GenerateToken_UserRoleUser_SetsCorrectRoleClaim()
    {
        var token = _service.GenerateToken(
            Guid.NewGuid(),
            UserRole.User,
            DateTime.UtcNow.AddMinutes(1)
        );

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        Assert.Equal(UserRole.User.ToString(), jwt.Claims.First(c => c.Type == "role").Value);
    }
}
