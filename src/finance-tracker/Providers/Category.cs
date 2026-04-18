using FinanceTracker.Models;
using FinanceTracker.Services;
using Microsoft.EntityFrameworkCore;

namespace FinanceTracker.Providers
{
    public class CategoryProvider(DBContext dBContext) : BaseProvider<Category>(dBContext)
    {
        public async Task<IEnumerable<Category>> GetCategories()
        {
            // Placeholder for fetching categories from the database
            return await DBContext.Category.ToListAsync();
        }

        public async Task<Category?> GetCategoryById(Guid id)
        {
            return await DBContext.Category.FindAsync(id);
        }

        public async Task<Category> CreateCategory(CategoryMutationDTO category)
        {
            Category newCategory = new()
            {
                Id = Guid.NewGuid(),
                Name = category.Name,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = Guid.Empty, // Replace with actual user ID
            };

            await DBContext.Category.AddAsync(newCategory);
            await DBContext.SaveChangesAsync();

            return newCategory;
        }

        public async Task<Category?> UpdateCategory(Guid id, CategoryMutationDTO category)
        {
            var existingCategory = await DBContext.Category.FindAsync(id);
            if (existingCategory == null)
            {
                return null;
            }

            existingCategory.Name = category.Name;
            existingCategory.UpdatedAt = DateTime.UtcNow;
            existingCategory.UpdatedBy = Guid.Empty; // Replace with actual user ID

            DBContext.Category.Update(existingCategory);
            await DBContext.SaveChangesAsync();

            return existingCategory;
        }
    }
}
