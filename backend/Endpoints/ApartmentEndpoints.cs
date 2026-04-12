using GasControl.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GasControl.Api.Endpoints;

public static class ApartmentEndpoints
{
    public static void MapApartmentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/apartments");

        group.MapGet("/", async (AppDbContext db) => await db.Apartments.ToListAsync());

        group.MapPost("/", async (AppDbContext db, CreateApartmentRequest request) =>
        {
            var apt = new Apartment
            {
                Id = Guid.NewGuid().ToString(),
                Number = request.Number,
                Name = request.Name,
                IsActive = true
            };

            db.Apartments.Add(apt);
            await db.SaveChangesAsync();

            return Results.Created($"/api/apartments/{apt.Id}", apt);
        });

        group.MapPut("/{id}", async (AppDbContext db, string id, UpdateApartmentRequest request) =>
        {
            var apt = await db.Apartments.FindAsync(id);
            if (apt is null) return Results.NotFound();

            apt.Number = request.Number;
            apt.Name = request.Name;

            await db.SaveChangesAsync();
            return Results.Ok(apt);
        });

        group.MapPatch("/{id}/state", async (AppDbContext db, string id, UpdateApartmentStateRequest request) =>
        {
            var apt = await db.Apartments.FindAsync(id);
            if (apt is null) return Results.NotFound();

            apt.IsActive = request.IsActive;

            await db.SaveChangesAsync();
            return Results.Ok(apt);
        });
    }
}

public record CreateApartmentRequest(string Number, string Name);
public record UpdateApartmentRequest(string Number, string Name);
public record UpdateApartmentStateRequest(bool IsActive);
