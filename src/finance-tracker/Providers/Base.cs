using FinanceTracker.Services;

namespace FinanceTracker.Providers
{
    public class BaseProvider<T>(DBContext dBContext)
    {
        protected DBContext DBContext { get; } = dBContext;
    }
}
