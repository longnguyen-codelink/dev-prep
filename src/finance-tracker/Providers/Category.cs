using FinanceTracker.Models;
using FinanceTracker.Services;
using Gridify;
using Microsoft.EntityFrameworkCore;
using static FinanceTracker.Interfaces.Common;

namespace FinanceTracker.Providers
{
    public class CategoryProvider(DBContext dBContext) : BaseProvider<Category>(dBContext)
    {
        public async Task<IEnumerable<Category>> GetCategories(IGridifyQuery queryParams)
        {
            // Placeholder for fetching categories from the database
            return await DBContext.Category.ApplyFilteringOrderingPaging(queryParams).ToListAsync();
        }

        public async Task<Category?> GetCategoryById(Guid id)
        {
            return await DBContext.Category.FindAsync(id);
        }

        public async Task<Category> CreateCategory(
            CategoryMutationDTO category,
            IMutationInitiator mutationInitiator
        )
        {
            Category newCategory = new()
            {
                Id = Guid.NewGuid(),
                Name = category.Name,
                CreatedAt = mutationInitiator.Timestamp,
                CreatedBy = mutationInitiator.UserId,
            };

            await DBContext.Category.AddAsync(newCategory);
            await DBContext.SaveChangesAsync();

            return newCategory;
        }

        public async Task<Category?> UpdateCategory(
            Guid id,
            CategoryMutationDTO category,
            IMutationInitiator mutationInitiator
        )
        {
            var existingCategory = await DBContext.Category.FindAsync(id);
            if (existingCategory == null)
            {
                return null;
            }

            existingCategory.Name = category.Name;
            existingCategory.UpdatedAt = mutationInitiator.Timestamp;
            existingCategory.UpdatedBy = mutationInitiator.UserId;

            DBContext.Category.Update(existingCategory);
            await DBContext.SaveChangesAsync();

            return existingCategory;
        }

        public async Task<bool> DeleteCategory(Guid id)
        {
            var category = await DBContext.Category.FindAsync(id);
            if (category == null)
            {
                return false;
            }

            DBContext.Category.Remove(category);
            await DBContext.SaveChangesAsync();
            return true;
        }
    }
}
