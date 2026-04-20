using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Models
{
    public class LoginDTO
    {
        public required string Username { get; set; }
        public required string Password { get; set; }
        public required string CodeChallenge { get; set; }
    }

    public enum UserRole
    {
        User,
        Admin,
    }

    public class User
    {
        public Guid Id { get; set; }
        public required string Username { get; set; }
        public required string Password { get; set; }
        public required UserRole Role { get; set; } = UserRole.User;

        // Fields for tracking creation
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }

        // Optional fields for tracking updates
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }

        // Navigation properties for tracking who created/updated the user
        public User? CreatedByUser { get; set; }
        public User? UpdatedByUser { get; set; }

        public static void Configure(ModelBuilder modelBuilder)
        {
            // Configuring the mapping for the User entity
            modelBuilder.Entity<User>().Property(u => u.Id).HasColumnName("id").IsRequired();

            modelBuilder
                .Entity<User>()
                .Property(u => u.Username)
                .HasColumnName("username")
                .IsRequired();

            modelBuilder
                .Entity<User>()
                .Property(u => u.Password)
                .HasColumnName("password")
                .IsRequired();

            modelBuilder
                .Entity<User>()
                .Property(u => u.Role)
                .HasColumnName("role")
                .HasDefaultValue(UserRole.User);

            modelBuilder
                .Entity<User>()
                .Property(u => u.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            modelBuilder.Entity<User>().Property(u => u.CreatedBy).HasColumnName("created_by");

            modelBuilder
                .Entity<User>()
                .Property(u => u.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired(false);

            modelBuilder
                .Entity<User>()
                .Property(u => u.UpdatedBy)
                .HasColumnName("updated_by")
                .IsRequired(false);

            // Configuring relationships
            modelBuilder
                .Entity<User>()
                .HasOne(u => u.CreatedByUser)
                .WithMany()
                .HasForeignKey(u => u.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<User>()
                .HasOne(u => u.UpdatedByUser)
                .WithMany()
                .HasForeignKey(u => u.UpdatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
