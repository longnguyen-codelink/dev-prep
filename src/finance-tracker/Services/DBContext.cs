using FinanceTracker.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Services
{
    public class DBContext(DbContextOptions<DBContext> options) : DbContext(options)
    {
        public required DbSet<Category> Category { get; set; }
        public required DbSet<Transaction> Transaction { get; set; }
        public required DbSet<User> User { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            Models.User.Configure(modelBuilder);
            Models.Category.Configure(modelBuilder);
            Models.Transaction.Configure(modelBuilder);
        }
    }
}
