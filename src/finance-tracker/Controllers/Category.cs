using FinanceTracker.Models;
using Microsoft.AspNetCore.Mvc;

namespace FinanceTracker.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CategoryController(ILogger<CategoryController> logger) : ControllerBase
    {
        private readonly ILogger<CategoryController> _logger = logger;

        [HttpGet(Name = "GetCategories")]
        public IEnumerable<string> Get()
        {
            return ["Category1", "Category2"];
        }

        [HttpGet("{id}", Name = "GetCategoryById")]
        public Category GetCategoryById(Guid id)
        {
            // Placeholder for fetching category by ID
            return new Category { Id = id, Name = $"Category{id}" };
        }

        [HttpPost(Name = "CreateCategory")]
        public IActionResult CreateCategory([FromBody] Category category)
        {
            // Placeholder for creating a new category
            _logger.LogInformation($"Creating category: {category.Name}");
            return CreatedAtAction(nameof(GetCategoryById), new { id = category.Id }, category);
        }

        [HttpPut("{id}", Name = "UpdateCategory")]
        public IActionResult UpdateCategory(Guid id, [FromBody] Category category)
        {
            // Placeholder for updating a category
            _logger.LogInformation($"Updating category: {category.Name}");
            return NoContent();
        }
    }
}
