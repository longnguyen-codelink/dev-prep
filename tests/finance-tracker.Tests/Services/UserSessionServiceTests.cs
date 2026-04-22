using FinanceTracker.Services;
using Xunit;

namespace FinanceTracker.Tests.Services;

public class UserSessionServiceTests
{
    private readonly UserSessionService _service = new();

    [Fact]
    public void CreateSession_GetSession_ReturnsSession()
    {
        var token = "test-token";
        var userId = Guid.NewGuid();
        var expiresAt = DateTime.UtcNow.AddHours(1);

        _service.CreateSession(token, userId, expiresAt);
        var session = _service.GetSession(token);

        Assert.NotNull(session);
        Assert.Equal(userId, session.UserId);
        Assert.Equal(expiresAt, session.ExpiresAt);
    }

    [Fact]
    public void GetSession_ReturnsNull_WhenExpired()
    {
        var token = "expired-token";
        _service.CreateSession(token, Guid.NewGuid(), DateTime.UtcNow.AddMinutes(-1));

        var session = _service.GetSession(token);

        Assert.Null(session);
    }

    [Fact]
    public void GetSession_AutoRemovesExpiredSession_OnSubsequentAccess()
    {
        var token = "auto-remove-token";
        _service.CreateSession(token, Guid.NewGuid(), DateTime.UtcNow.AddMinutes(-1));

        _service.GetSession(token); // triggers removal

        // Second call should also be null (not throw)
        var second = _service.GetSession(token);
        Assert.Null(second);
    }

    [Fact]
    public void RemoveSession_DeletesSession()
    {
        var token = "remove-token";
        _service.CreateSession(token, Guid.NewGuid(), DateTime.UtcNow.AddHours(1));

        _service.RemoveSession(token);

        Assert.Null(_service.GetSession(token));
    }

    [Fact]
    public void GetSession_ReturnsNull_WhenTokenNotFound()
    {
        var session = _service.GetSession("nonexistent-token");

        Assert.Null(session);
    }

    [Fact]
    public void GenerateSessionToken_ReturnsNonEmptyString()
    {
        var token = UserSessionService.GenerateSessionToken();

        Assert.False(string.IsNullOrEmpty(token));
    }

    [Fact]
    public void GenerateSessionToken_ReturnsDifferentValuesOnEachCall()
    {
        var token1 = UserSessionService.GenerateSessionToken();
        var token2 = UserSessionService.GenerateSessionToken();

        Assert.NotEqual(token1, token2);
    }

    [Fact]
    public void CreateLoginRequest_GetLoginRequest_ReturnsRequest()
    {
        var codeChallenge = "test-code-challenge";
        var userId = Guid.NewGuid();

        var authCode = _service.CreateLoginRequest(codeChallenge, userId);
        var loginRequest = _service.GetLoginRequest(authCode);

        Assert.NotNull(loginRequest);
        Assert.Equal(userId, loginRequest.UserId);
        Assert.Equal(codeChallenge, loginRequest.CodeChallenge);
    }

    [Fact]
    public void GetLoginRequest_ReturnsNull_WhenAuthCodeNotFound()
    {
        var loginRequest = _service.GetLoginRequest("invalid-auth-code");

        Assert.Null(loginRequest);
    }

    [Fact]
    public void RemoveLoginRequest_DeletesRequest()
    {
        var authCode = _service.CreateLoginRequest("challenge", Guid.NewGuid());

        _service.RemoveLoginRequest(authCode);

        Assert.Null(_service.GetLoginRequest(authCode));
    }

    [Fact]
    public void CreateLoginRequest_ReturnsDifferentCodeEachCall()
    {
        var code1 = _service.CreateLoginRequest("challenge-a", Guid.NewGuid());
        var code2 = _service.CreateLoginRequest("challenge-b", Guid.NewGuid());

        Assert.NotEqual(code1, code2);
    }
}
