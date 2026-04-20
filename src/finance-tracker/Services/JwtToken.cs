namespace FinanceTracker.Services;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FinanceTracker.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

public class JwtTokenService(IOptions<JwtSettings> jwtSettings)
{
    private readonly JwtSettings _jwtSettings = jwtSettings.Value;

    public string GenerateToken(Guid userId, Models.UserRole role, DateTime expiresAt)
    {
        var key = Encoding.ASCII.GetBytes(_jwtSettings.SecretKey);

        JwtSecurityTokenHandler tokenHandler = new();
        SecurityTokenDescriptor tokenDescriptor = new()
        {
            Issuer = _jwtSettings.Authority,
            Audience = _jwtSettings.Audience,
            Expires = expiresAt,
            Subject = new ClaimsIdentity([
                new Claim("sub", userId.ToString()),
                new Claim("role", role.ToString()),
            ]),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature
            ),
        };

        SecurityToken token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
