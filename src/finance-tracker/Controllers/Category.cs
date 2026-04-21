using System.Security.Claims;
using AutoMapper;
using FinanceTracker.Models;
using FinanceTracker.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static FinanceTracker.Interfaces.Common;

namespace FinanceTracker.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class CategoryController(
        ILogger<CategoryController> logger,
        CategoryProvider categoryProvider,
        IMapper mapper
    ) : ControllerBase
    {
        private readonly ILogger<CategoryController> _logger = logger;
        private readonly CategoryProvider _categoryProvider = categoryProvider;
        private readonly IMapper _mapper = mapper;

        [HttpGet(Name = "GetCategories")]
        public async Task<IEnumerable<CategoryListDTO>> Get()
        {
            var categories = await _categoryProvider.GetCategories();
            return categories.Select(_mapper.Map<CategoryListDTO>);
        }

        [HttpGet("{id}", Name = "GetCategoryById")]
        public async Task<Category?> GetCategoryById(Guid id)
        {
            return await _categoryProvider.GetCategoryById(id);
        }

        [HttpPost(Name = "CreateCategory")]
        public async Task<IActionResult> CreateCategory([FromBody] CategoryMutationDTO category)
        {
            MutationInitiator mutationInitiator = MutationInitiator.WithJWTClaims(
                HttpContext.User.Identity as ClaimsIdentity
            );

            // Placeholder for creating a new category
            var newCategory = await _categoryProvider.CreateCategory(category, mutationInitiator);
            _logger.LogInformation($"Creating category: {newCategory.Name}");
            return CreatedAtAction(
                nameof(GetCategoryById),
                new { id = newCategory.Id },
                newCategory
            );
        }

        [HttpPut("{id}", Name = "UpdateCategory")]
        public async Task<IActionResult> UpdateCategory(
            Guid id,
            [FromBody] CategoryMutationDTO category
        )
        {
            MutationInitiator mutationInitiator = MutationInitiator.WithJWTClaims(
                HttpContext.User.Identity as ClaimsIdentity
            );

            // Placeholder for updating a category
            var updatedCategory = await _categoryProvider.UpdateCategory(
                id,
                category,
                mutationInitiator
            );
            if (updatedCategory == null)
            {
                return NotFound();
            }

            _logger.LogInformation($"Updating category: {updatedCategory.Name}");
            return NoContent();
        }

        [HttpDelete("{id}", Name = "DeleteCategory")]
        public async Task<IActionResult> DeleteCategory(Guid id)
        {
            // Placeholder for deleting a category
            bool deleted = await _categoryProvider.DeleteCategory(id);
            if (!deleted)
            {
                return NotFound();
            }
            _logger.LogInformation($"Deleted category with ID: {id}");
            return NoContent();
        }
    }
}
