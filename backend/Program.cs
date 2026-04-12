using GasControl.Api.Endpoints;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// Configuração de CORS para permitir que o Frontend acesse a API
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // If you are using migrations heavily, typically you should call Migrate() or EnsureCreated.
    // db.Database.Migrate(); is safe if valid, but just ensure created is fine here based on previous state
    db.Database.EnsureCreated();
}

app.UseCors();

// Map Endpoints
app.MapApartmentEndpoints();
app.MapGasEndpoints();
app.MapWaterEndpoints();

app.Run();
