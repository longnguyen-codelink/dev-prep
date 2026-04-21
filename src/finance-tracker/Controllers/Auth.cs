using FinanceTracker.Interfaces;
using FinanceTracker.Models;
using FinanceTracker.Providers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace FinanceTracker.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController(UserProvider userProvider, IOptions<AuthSettings> _authSettings)
    : ControllerBase
{
    private readonly AuthSettings authSettings = _authSettings.Value;

    [HttpPost("login", Name = "Login")]
    public async Task<IActionResult> Login([FromBody] LoginDTO loginDTO)
    {
        var authCode = await userProvider.VerifyUserCredentials(loginDTO);

        return Ok(new { authCode });
    }

    [HttpPost("token", Name = "ExchangeToken")]
    public async Task<IActionResult> ExchangeToken([FromBody] TokenExchangeDTO tokenExchangeDTO)
    {
        var (accessToken, refreshToken) = await userProvider.ExchangeAuthCodeForTokens(
            tokenExchangeDTO.Code,
            tokenExchangeDTO.CodeVerifier
        );

        Response.Cookies.Append(
            Constants.Constants.AuthCookieName,
            refreshToken,
            GetCookieOptions()
        );

        return Ok(new { accessToken });
    }

    [HttpPost("token/refresh", Name = "RefreshToken")]
    public async Task<IActionResult> RefreshToken()
    {
        var refreshToken = Request.Cookies[Constants.Constants.AuthCookieName];
        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized();
        }

        var (accessToken, newRefreshToken) = await userProvider.RefreshTokens(refreshToken);

        Response.Cookies.Append(
            Constants.Constants.AuthCookieName,
            newRefreshToken,
            GetCookieOptions()
        );

        return Ok(new { accessToken });
    }

    private CookieOptions GetCookieOptions()
    {
        TimeSpan expireAt = TimeSpan.FromMinutes(authSettings.RefreshTokenExpireTimeInMinutes);
        return new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = authSettings.SecurePolicy,
            Expires = DateTimeOffset.UtcNow.Add(expireAt),
        };
    }
}
