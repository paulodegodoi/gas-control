using GasControl.Api.Models;
using GasControl.Api.Models.Auth;
using Microsoft.EntityFrameworkCore;

namespace GasControl.Api.Endpoints;

public static class CondominiumEndpoints
{
    public static void MapCondominiumEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/condominiums");

        group.MapGet("/", async (AppDbContext db) =>
        {
            var condos = await db.Condominiums.ToListAsync();
            return Results.Ok(condos);
        }).RequireAuthorization("ReadOnly");

        group.MapPost("/", async (AppDbContext db, CreateCondominiumRequest request, HttpContext httpContext) =>
        {
            var callerRole = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (callerRole == nameof(UserRole.Morador))
                return Results.Forbid();

            var condo = new Condominium
            {
                Id = Guid.NewGuid().ToString(),
                Name = request.Name
            };

            db.Condominiums.Add(condo);

            if (callerRole == nameof(UserRole.Sindico))
            {
                var subIdStr = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? httpContext.User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

                if (Guid.TryParse(subIdStr, out var callerIdGuid))
                {
                    var callerUser = await db.Users.FindAsync(callerIdGuid);
                    if (callerUser != null)
                    {
                        if (callerUser.CondominiumIds == null) callerUser.CondominiumIds = new List<string>();
                        callerUser.CondominiumIds.Add(condo.Id);
                    }
                }
            }

            await db.SaveChangesAsync();

            return Results.Created($"/api/condominiums/{condo.Id}", condo);
        }).RequireAuthorization("CanWrite");
    }
}

public record CreateCondominiumRequest(string Name);
