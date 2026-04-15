using FinanceTracker.Services;

namespace FinanceTracker.Providers
{
    public class BaseProvider(ILogger<BaseProvider> logger)
    {
        protected readonly ILogger<BaseProvider> _logger = logger;
        protected readonly DBContext? dBContext;
    }
}
