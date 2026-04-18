using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Models
{
    public enum TransactionType
    {
        Income,
        Expense,
    }

    public class TransactionMutationDTO
    {
        public Guid CategoryId { get; set; }
        public TransactionType Type { get; set; }
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
    }

    public class Transaction
    {
        public Guid Id { get; set; }

        public Guid CategoryId { get; set; }
        public TransactionType Type { get; set; }
        public decimal Value { get; set; }
        public DateTime EventDate { get; set; }

        // Fields for tracking creation
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }

        // Optional fields for tracking updates
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }

        // Navigation property
        public Category? Category { get; set; }
        public User? CreatedByUser { get; set; }
        public User? UpdatedByUser { get; set; }

        public static void Configure(ModelBuilder modelBuilder)
        {
            // Configuring the mapping for the Transaction entity
            modelBuilder
                .Entity<Transaction>()
                .Property(t => t.Id)
                .HasColumnName("id")
                .IsRequired();

            modelBuilder
                .Entity<Transaction>()
                .Property(t => t.CategoryId)
                .HasColumnName("category_id")
                .IsRequired();

            modelBuilder
                .Entity<Transaction>()
                .Property(t => t.Type)
                .HasColumnName("type")
                .IsRequired();

            modelBuilder
                .Entity<Transaction>()
                .Property(t => t.Value)
                .HasColumnName("value")
                .IsRequired();

            modelBuilder
                .Entity<Transaction>()
                .Property(t => t.EventDate)
                .HasColumnName("event_date")
                .IsRequired();

            modelBuilder
                .Entity<Transaction>()
                .Property(t => t.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            modelBuilder
                .Entity<Transaction>()
                .Property(t => t.CreatedBy)
                .HasColumnName("created_by")
                .IsRequired();

            modelBuilder
                .Entity<Transaction>()
                .Property(t => t.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired(false);

            modelBuilder
                .Entity<Transaction>()
                .Property(t => t.UpdatedBy)
                .HasColumnName("updated_by")
                .IsRequired(false);

            // Configuring relationships
            modelBuilder
                .Entity<Transaction>()
                .HasOne(t => t.Category)
                .WithMany(c => c.Transactions)
                .HasForeignKey(t => t.CategoryId);

            modelBuilder
                .Entity<Transaction>()
                .HasOne(t => t.CreatedByUser)
                .WithMany()
                .HasForeignKey(t => t.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<Transaction>()
                .HasOne(t => t.UpdatedByUser)
                .WithMany()
                .HasForeignKey(t => t.UpdatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
