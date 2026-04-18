using FinanceTracker.Providers;

namespace FinanceTracker.Services
{
    public static class ServiceExtensions
    {
        public static IServiceCollection AddProviders(this IServiceCollection services)
        {
            // Add all your providers here
            services.AddScoped<CategoryProvider>();
            // services.AddScoped<UserProvider>();

            return services;
        }
    }
}
