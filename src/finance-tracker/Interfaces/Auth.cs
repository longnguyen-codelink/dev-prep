namespace FinanceTracker.Interfaces;

public interface ILoginResponse
{
    public string AccessToken { get; set; }
    public string RefreshToken { get; set; }
}

public class LoginResponse : ILoginResponse
{
    public required string AccessToken { get; set; }
    public required string RefreshToken { get; set; }
}

public interface IAuthSettings
{
    public int AccessTokenExpireTimeInMinutes { get; set; }
    public int RefreshTokenExpireTimeInMinutes { get; set; }
    public bool SecurePolicy { get; set; }
}

public class AuthSettings : IAuthSettings
{
    public int AccessTokenExpireTimeInMinutes { get; set; }
    public int RefreshTokenExpireTimeInMinutes { get; set; }
    public bool SecurePolicy { get; set; }
}

public interface IJwtSettings
{
    public string Authority { get; set; }
    public string Audience { get; set; }
    public string SecretKey { get; set; }
}

public class JwtSettings : IJwtSettings
{
    public required string Authority { get; set; }
    public required string Audience { get; set; }
    public required string SecretKey { get; set; }
}

public class TokenExchangeDTO
{
    public required string Code { get; set; }
    public required string CodeVerifier { get; set; }
}
