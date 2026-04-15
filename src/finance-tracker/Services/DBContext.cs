using FinanceTracker.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Services
{
    public class DBContext(DbContextOptions<DBContext> options) : DbContext(options)
    {
        public DbSet<Category> Category { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder) { }
    }
}
