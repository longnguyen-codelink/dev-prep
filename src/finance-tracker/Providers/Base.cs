using FinanceTracker.Services;

namespace FinanceTracker.Providers
{
    public class BaseProvider<T>(DBContext dBContext)
    {
        protected DBContext DBContext { get; } = dBContext;

        protected static DateTime NormalizeUtcTimestamp(DateTime value)
        {
            return value.Kind switch
            {
                DateTimeKind.Utc => value,
                DateTimeKind.Local => value.ToUniversalTime(),
                _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
            };
        }
    }
}
