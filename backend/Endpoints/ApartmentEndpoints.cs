using GasControl.Api.Models;
using GasControl.Api.Models.Gas;
using GasControl.Api.Models.Water;
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

        group.MapGet("/{id}/history", async (AppDbContext db, string id, [Microsoft.AspNetCore.Mvc.FromQuery] int limit = 12) =>
        {
            var apt = await db.Apartments.FindAsync(id);
            if (apt is null) return Results.NotFound();

            var gasReadings = await db.GasReadings
                .Where(r => r.ApartmentId == id)
                .OrderByDescending(r => r.Month)
                .Take(limit)
                .ToListAsync();

            var waterReadings = await db.WaterReadings
                .Where(r => r.ApartmentId == id)
                .OrderByDescending(r => r.Month)
                .Take(limit)
                .ToListAsync();

            return Results.Ok(new
            {
                Apartment = apt,
                GasReadings = gasReadings,
                WaterReadings = waterReadings
            });
        }).RequireAuthorization("ReadOnly");
    }
}

public record CreateApartmentRequest(string Number, string Name, string? CondominiumId);
public record UpdateApartmentRequest(string Number, string Name);
public record UpdateApartmentStateRequest(bool IsActive);
