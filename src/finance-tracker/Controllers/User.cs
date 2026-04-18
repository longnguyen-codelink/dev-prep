using Microsoft.AspNetCore.Mvc;

namespace FinanceTracker.Controllers;

[ApiController]
[Route("[controller]")]
public class UserController : ControllerBase
{
    [HttpGet(Name = "GetUsers")]
    public async Task<IEnumerable<string>> Get()
    {
        // Placeholder for fetching users from the database
        return ["User1", "User2"];
    }
}
