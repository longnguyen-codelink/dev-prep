using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Models
{
    public class CategoryMutationDTO
    {
        public required string Name { get; set; }
    }

    public class CategoryListDTO
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
    }

    public class Category
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }

        // Fields for tracking creation
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }

        // Optional fields for tracking updates
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }

        // Navigation property for related transactions
        public ICollection<Transaction>? Transactions { get; set; }
        public User? CreatedByUser { get; set; }
        public User? UpdatedByUser { get; set; }

        public static void Configure(ModelBuilder modelBuilder)
        {
            // Configuring the mapping for the Category entity
            modelBuilder.Entity<Category>().Property(c => c.Id).HasColumnName("id").IsRequired();

            modelBuilder
                .Entity<Category>()
                .Property(c => c.Name)
                .HasColumnName("name")
                .IsRequired();

            modelBuilder
                .Entity<Category>()
                .Property(c => c.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            modelBuilder
                .Entity<Category>()
                .Property(c => c.CreatedBy)
                .HasColumnName("created_by")
                .IsRequired();

            modelBuilder
                .Entity<Category>()
                .Property(c => c.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired(false);

            modelBuilder
                .Entity<Category>()
                .Property(c => c.UpdatedBy)
                .HasColumnName("updated_by")
                .IsRequired(false);

            // Configuring relationships
            modelBuilder
                .Entity<Category>()
                .HasOne(c => c.CreatedByUser)
                .WithMany()
                .HasForeignKey(c => c.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<Category>()
                .HasOne(c => c.UpdatedByUser)
                .WithMany()
                .HasForeignKey(c => c.UpdatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
