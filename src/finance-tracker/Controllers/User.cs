using System.Security.Claims;
using FinanceTracker.Interfaces;
using FinanceTracker.Models;
using FinanceTracker.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceTracker.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class UserController(UserProvider userProvider) : ControllerBase
{
    [HttpGet("roles", Name = "GetAllRoles")]
    public async Task<IActionResult> GetAllRoles()
    {
        var roles = await userProvider.GetAllRoles();
        return Ok(roles);
    }

    [HttpGet(Name = "GetUsers")]
    public async Task<IActionResult> Get([FromQuery] Common.QueryParams queryParams)
    {
        var users = await userProvider.GetUsers(queryParams);
        return Ok(users);
    }

    [Authorize(Roles = nameof(UserRole.Admin))]
    [HttpPost(Name = "CreateUser")]
    public async Task<IActionResult> CreateUser([FromBody] UserMutationDTO userDto)
    {
        Common.MutationInitiator mutationInitiator = Common.MutationInitiator.WithJWTClaims(
            HttpContext.User.Identity as ClaimsIdentity
        );

        await userProvider.CreateUser(userDto, mutationInitiator);
        return Ok($"User '{userDto.Username}' created successfully.");
    }
}
