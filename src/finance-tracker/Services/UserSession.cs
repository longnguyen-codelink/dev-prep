namespace FinanceTracker.Services;

public class UserSessionService
{
    public class UserSession
    {
        public Guid UserId { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    public class UserLoginRequest
    {
        public Guid UserId { get; set; }
        public required string CodeChallenge { get; set; }
    }

    private readonly Dictionary<string, UserSession> _sessions = [];

    private readonly Dictionary<string, UserLoginRequest> _loginRequests = [];

    public UserSessionService CreateSession(string token, Guid userId, DateTime dateTime)
    {
        _sessions[token] = new UserSession { UserId = userId, ExpiresAt = dateTime };

        return this;
    }

    public UserSession? GetSession(string token)
    {
        if (_sessions.TryGetValue(token, out var session))
        {
            if (session.ExpiresAt > DateTime.UtcNow)
                return session;

            _sessions.Remove(token);
        }

        return null;
    }

    public UserSessionService RemoveSession(string token)
    {
        _sessions.Remove(token);
        return this;
    }

    public static string GenerateSessionToken()
    {
        return Guid.NewGuid().ToString();
    }

    public string CreateLoginRequest(string codeChallenge, Guid userId)
    {
        string authCode = GenerateRandomString();
        _loginRequests[authCode] = new UserLoginRequest
        {
            UserId = userId,
            CodeChallenge = codeChallenge,
        };

        // Clean up the login request after 10 minutes
        Task.Run(() =>
        {
            Thread.Sleep(TimeSpan.FromMinutes(10));
            _loginRequests.Remove(authCode);
        });

        return authCode;
    }

    public UserLoginRequest? GetLoginRequest(string authCode)
    {
        if (_loginRequests.TryGetValue(authCode, out var loginRequest))
        {
            return loginRequest;
        }

        return null;
    }

    public UserSessionService RemoveLoginRequest(string authCode)
    {
        _loginRequests.Remove(authCode);
        return this;
    }

    private static string GenerateRandomString(int length = 32)
    {
        var random = new Random();
        return new string([
            .. Enumerable
                .Repeat(Constants.Constants.Chars, length)
                .Select(s => s[random.Next(s.Length)]),
        ]);
    }
}
