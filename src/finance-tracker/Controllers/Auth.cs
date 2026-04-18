using FinanceTracker.Models;
using Microsoft.AspNetCore.Mvc;

namespace FinanceTracker.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    [HttpPost("login", Name = "Login")]
    public async Task<IActionResult> Login([FromBody] LoginDTO loginDTO)
    {
        // Placeholder for user authentication logic
        if (loginDTO.Username == "admin" && loginDTO.Password == "password")
        {
            return Ok(new { Token = "fake-jwt-token" });
        }

        return Unauthorized();
    }
}
