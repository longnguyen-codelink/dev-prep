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
    }
}
