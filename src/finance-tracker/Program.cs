using System.Text;
using FinanceTracker.Interfaces;
using FinanceTracker.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Configuration.AddEnvironmentVariables();

// Enforce lowercase URLs globally
builder.Services.Configure<RouteOptions>(options =>
{
    options.LowercaseUrls = true;
});

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi

// Swagger/OpenAPI configuration
builder.Services.AddOpenApi().AddEndpointsApiExplorer().AddSwaggerGen();

// Mapper
builder.Services.AddAutoMapper(cfg =>
{
    cfg.LicenseKey = builder.Configuration.GetValue<string>("AutoMapper:LicenseKey");
    cfg.AddProfile<MappingProfile>();
});

// Database configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<DBContext>(options => options.UseNpgsql(connectionString));

// Authentication
builder.Services.Configure<AuthSettings>(builder.Configuration.GetSection(nameof(AuthSettings)));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(nameof(JwtSettings)));

var jwtSettings = builder.Configuration.GetSection(nameof(JwtSettings)).Get<JwtSettings>();

if (
    jwtSettings is null
    || string.IsNullOrWhiteSpace(jwtSettings.SecretKey)
    || string.IsNullOrWhiteSpace(jwtSettings.Authority)
    || string.IsNullOrWhiteSpace(jwtSettings.Audience)
)
{
    throw new InvalidOperationException(
        "Missing JWT configuration. Set JwtSettings:SecretKey, JwtSettings:Authority, and JwtSettings:Audience (or env vars JwtSettings__SecretKey, JwtSettings__Authority, JwtSettings__Audience)."
    );
}

builder
    .Services.AddSingleton<UserSessionService>()
    .AddSingleton<JwtTokenService>()
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(jwtOptions =>
    {
        jwtOptions.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwtSettings.Authority,
            ValidAudience = jwtSettings.Audience,
        };
    });

// Providers
builder.Services.AddProviders();

var app = builder.Build();
app.UseHttpsRedirection();

// Configure the HTTP request pipeline.
// if (app.Environment.IsDevelopment()) { }
app.UseSwagger();
app.UseSwaggerUI();

app.MapOpenApi();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
