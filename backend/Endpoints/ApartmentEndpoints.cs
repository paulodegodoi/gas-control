using GasControl.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GasControl.Api.Endpoints;

public static class ApartmentEndpoints
{
    public static void MapApartmentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/apartments");

        group.MapGet("/", async (AppDbContext db, [Microsoft.AspNetCore.Mvc.FromQuery] string? condominiumId) =>
        {
            var query = db.Apartments.AsQueryable();
            if (!string.IsNullOrEmpty(condominiumId))
                query = query.Where(a => a.CondominiumId == condominiumId);
            return await query.ToListAsync();
        }).RequireAuthorization("ReadOnly");

        group.MapPost("/", async (AppDbContext db, CreateApartmentRequest request) =>
        {
            var apt = new Apartment
            {
                Id = Guid.NewGuid().ToString(),
                Number = request.Number,
                Name = request.Name,
                IsActive = true,
                CondominiumId = request.CondominiumId
            };

            db.Apartments.Add(apt);
            await db.SaveChangesAsync();

            return Results.Created($"/api/apartments/{apt.Id}", apt);
        }).RequireAuthorization("CanWrite");

        group.MapPut("/{id}", async (AppDbContext db, string id, UpdateApartmentRequest request) =>
        {
            var apt = await db.Apartments.FindAsync(id);
            if (apt is null) return Results.NotFound();

            apt.Number = request.Number;
            apt.Name = request.Name;

            await db.SaveChangesAsync();
            return Results.Ok(apt);
        }).RequireAuthorization("CanWrite");

        group.MapPatch("/{id}/state", async (AppDbContext db, string id, UpdateApartmentStateRequest request) =>
        {
            var apt = await db.Apartments.FindAsync(id);
            if (apt is null) return Results.NotFound();

            apt.IsActive = request.IsActive;

            await db.SaveChangesAsync();
            return Results.Ok(apt);
        }).RequireAuthorization("CanWrite");
    }
}

public record CreateApartmentRequest(string Number, string Name, string? CondominiumId);
public record UpdateApartmentRequest(string Number, string Name);
public record UpdateApartmentStateRequest(bool IsActive);
