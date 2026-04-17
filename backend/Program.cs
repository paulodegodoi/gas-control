using GasControl.Api.Endpoints;
using GasControl.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// ---------------------------------------------------------
// DbContext — injeta o ClaimsPrincipal atual via factory
// para uso nos Global Query Filters
// ---------------------------------------------------------
builder.Services.AddHttpContextAccessor();
builder.Services.AddDbContext<AppDbContext>((serviceProvider, options) =>
{
    options.UseNpgsql(connectionString);
    // Sobligar a factory nunca lança exceção fora de um request
    // pois o IHttpContextAccessor retorna null fora de scope HTTP
});
builder.Services.AddScoped<Func<ClaimsPrincipal?>>(sp =>
{
    var accessor = sp.GetRequiredService<IHttpContextAccessor>();
    return () => accessor.HttpContext?.User;
});

// ---------------------------------------------------------
// Autenticação JWT
// ---------------------------------------------------------
var jwtSection = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSection["SecretKey"]
    ?? throw new InvalidOperationException("JWT SecretKey não configurada em appsettings.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            RoleClaimType = ClaimTypes.Role
        };
    });

// ---------------------------------------------------------
// Autorização — Políticas RBAC
// ---------------------------------------------------------
builder.Services.AddAuthorization(options =>
{
    // Todos os roles autenticados podem ler
    options.AddPolicy("ReadOnly", policy =>
        policy.RequireRole(
            nameof(GasControl.Api.Models.Auth.UserRole.Admin),
            nameof(GasControl.Api.Models.Auth.UserRole.Sindico),
            nameof(GasControl.Api.Models.Auth.UserRole.Morador)));

    // Apenas Admin e Síndico podem escrever
    options.AddPolicy("CanWrite", policy =>
        policy.RequireRole(
            nameof(GasControl.Api.Models.Auth.UserRole.Admin),
            nameof(GasControl.Api.Models.Auth.UserRole.Sindico)));
});

// ---------------------------------------------------------
// Token Service
// ---------------------------------------------------------
builder.Services.AddScoped<TokenService>();

// ---------------------------------------------------------
// CORS — permite acesso do Frontend
// ---------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// ---------------------------------------------------------
// Aplicar migrations automaticamente na inicialização
// ---------------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// ---------------------------------------------------------
// Map Endpoints
// ---------------------------------------------------------
app.MapAuthEndpoints();
app.MapApartmentEndpoints();
app.MapCondominiumEndpoints();
app.MapGasEndpoints();
app.MapWaterEndpoints();
app.MapFinanceEndpoints();

app.Run();
