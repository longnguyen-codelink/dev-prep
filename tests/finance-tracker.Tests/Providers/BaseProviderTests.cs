using FinanceTracker.Models;
using FinanceTracker.Providers;
using FinanceTracker.Services;
using FinanceTracker.Tests.Helpers;
using Xunit;

namespace FinanceTracker.Tests.Providers;

public class BaseProviderTests
{
    // Expose the protected static method via an inner test subclass
    private class TestableProvider(DBContext context) : BaseProvider<Category>(context)
    {
        public static DateTime Normalize(DateTime value) => NormalizeUtcTimestamp(value);
    }

    [Fact]
    public void NormalizeUtcTimestamp_UtcKind_RemainsUtc()
    {
        var utcTime = new DateTime(2026, 4, 22, 10, 0, 0, DateTimeKind.Utc);

        var result = TestableProvider.Normalize(utcTime);

        Assert.Equal(DateTimeKind.Utc, result.Kind);
        Assert.Equal(utcTime, result);
    }

    [Fact]
    public void NormalizeUtcTimestamp_LocalKind_ConvertsToUtc()
    {
        var localTime = new DateTime(2026, 4, 22, 10, 0, 0, DateTimeKind.Local);

        var result = TestableProvider.Normalize(localTime);

        Assert.Equal(DateTimeKind.Utc, result.Kind);
        Assert.Equal(localTime.ToUniversalTime(), result);
    }

    [Fact]
    public void NormalizeUtcTimestamp_UnspecifiedKind_SpecifiesAsUtc()
    {
        var unspecifiedTime = new DateTime(2026, 4, 22, 10, 0, 0, DateTimeKind.Unspecified);

        var result = TestableProvider.Normalize(unspecifiedTime);

        Assert.Equal(DateTimeKind.Utc, result.Kind);
        Assert.Equal(unspecifiedTime.Ticks, result.Ticks);
    }
}
