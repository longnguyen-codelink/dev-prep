using FinanceTracker.Services;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Tests.Helpers;

public static class DbContextFactory
{
    public static DBContext Create()
    {
        var options = new DbContextOptionsBuilder<DBContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        // Activator.CreateInstance bypasses C# required-member compile checks;
        // EF Core initialises all DbSet<> properties via its base class infrastructure.
        return (DBContext)Activator.CreateInstance(typeof(DBContext), options)!;
    }
}
