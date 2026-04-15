var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Enforce lowercase URLs globally
builder.Services.Configure<RouteOptions>(options =>
{
    options.LowercaseUrls = true;
});

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseHttpsRedirection();

// Configure the HTTP request pipeline.
// if (app.Environment.IsDevelopment()) { }
app.UseSwagger();
app.UseSwaggerUI();

app.MapOpenApi();
app.MapControllers();

app.Run();
