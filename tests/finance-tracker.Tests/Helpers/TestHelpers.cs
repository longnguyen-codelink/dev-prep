using FinanceTracker.Interfaces;
using Microsoft.Extensions.Options;
using static FinanceTracker.Interfaces.Common;

namespace FinanceTracker.Tests.Helpers;

public static class TestHelpers
{
    public static IOptions<JwtSettings> CreateJwtSettings(
        string secretKey = "test-secret-key-that-is-at-least-32-characters-long!",
        string authority = "https://test.authority",
        string audience = "https://test.authority"
    ) =>
        Options.Create(
            new JwtSettings
            {
                SecretKey = secretKey,
                Authority = authority,
                Audience = audience,
            }
        );

    public static IOptions<AuthSettings> CreateAuthSettings(
        int accessTokenExpireMinutes = 15,
        int refreshTokenExpireMinutes = 60,
        bool securePolicy = false
    ) =>
        Options.Create(
            new AuthSettings
            {
                AccessTokenExpireTimeInMinutes = accessTokenExpireMinutes,
                RefreshTokenExpireTimeInMinutes = refreshTokenExpireMinutes,
                SecurePolicy = securePolicy,
            }
        );

    public static IMutationInitiator CreateMutationInitiator(Guid? userId = null) =>
        new MutationInitiator { UserId = userId ?? Guid.NewGuid(), Timestamp = DateTime.UtcNow };
}
