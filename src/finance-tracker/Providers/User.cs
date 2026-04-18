namespace FinanceTracker.Providers;

using BCrypt.Net;
using FinanceTracker.Models;
using FinanceTracker.Services;
using Microsoft.EntityFrameworkCore;

public class UserProvider(DBContext dBContext) : BaseProvider<User>(dBContext)
{
    public async Task<User?> GetUserByUsername(string username)
    {
        return await DBContext.User.FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User> CreateUser(User user)
    {
        user.Id = Guid.NewGuid();
        user.CreatedAt = DateTime.UtcNow;
        user.CreatedBy = Guid.Empty; // Replace with actual user ID

        await DBContext.User.AddAsync(user);
        await DBContext.SaveChangesAsync();

        return user;
    }

    public async Task<string> VerifyUserCredentials(LoginDTO loginDTO)
    {
        var user =
            await GetUserByUsername(loginDTO.Username) ?? throw new Exception("Invalid username");

        if (!BCrypt.Verify(loginDTO.Password, user.Password))
            throw new Exception("Invalid password");

        // Generate and return a JWT token or similar authentication token here
        return "token"; // Placeholder for actual token generation logic
    }
}
