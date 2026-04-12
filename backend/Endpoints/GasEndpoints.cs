using GasControl.Api.Models.Gas;
using Microsoft.EntityFrameworkCore;

namespace GasControl.Api.Endpoints;

public static class GasEndpoints
{
    public static void MapGasEndpoints(this IEndpointRouteBuilder app)
    {
        // ----------------
        // Endpoints de Leituras
        // ----------------
        app.MapGet("/api/gas/readings", async (AppDbContext db, string? month) =>
        {
            var query = db.GasReadings.AsQueryable();

            if (!string.IsNullOrEmpty(month))
                query = query.Where(r => r.Month == month);

            return await query.ToListAsync();
        }).RequireAuthorization("ReadOnly");

        app.MapPost("/api/gas/readings/bulk", async (AppDbContext db, List<CreateGasReadingRequest> requests) =>
        {
            foreach (var req in requests)
            {
                var existing = await db.GasReadings
                    .FirstOrDefaultAsync(r => r.ApartmentId == req.ApartmentId && r.Month == req.Month);

                if (existing != null)
                {
                    existing.CurrentReading = req.CurrentReading;
                }
                else
                {
                    var reading = new GasReading
                    {
                        Id = Guid.NewGuid().ToString(),
                        ApartmentId = req.ApartmentId,
                        Month = req.Month,
                        CurrentReading = req.CurrentReading
                    };
                    db.GasReadings.Add(reading);
                }
            }
            
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization("CanWrite");

        app.MapPost("/api/gas/readings", async (AppDbContext db, CreateGasReadingRequest request) =>
        {
            var existing = await db.GasReadings
                .FirstOrDefaultAsync(r => r.ApartmentId == request.ApartmentId && r.Month == request.Month);

            if (existing != null)
            {
                existing.CurrentReading = request.CurrentReading;
                await db.SaveChangesAsync();
                return Results.Ok(existing);
            }

            var reading = new GasReading
            {
                Id = Guid.NewGuid().ToString(),
                ApartmentId = request.ApartmentId,
                Month = request.Month,
                CurrentReading = request.CurrentReading
            };

            db.GasReadings.Add(reading);
            await db.SaveChangesAsync();

            return Results.Created("/api/gas/readings", reading);
        }).RequireAuthorization("CanWrite");

        // ----------------
        // Endpoints de Preços do Gás
        // ----------------
        app.MapGet("/api/gasprices/{month}", async (AppDbContext db, string month, [Microsoft.AspNetCore.Mvc.FromQuery] string? condominiumId) =>
        {
            var query = db.GasPrices.Where(g => g.Month == month);
            if (!string.IsNullOrEmpty(condominiumId))
                query = query.Where(g => g.CondominiumId == condominiumId);

            var gasPrice = await query.FirstOrDefaultAsync();
            if (gasPrice is null) return Results.NotFound();
            return Results.Ok(gasPrice);
        }).RequireAuthorization("ReadOnly");

        app.MapPost("/api/gasprices", async (AppDbContext db, CreateGasPriceRequest request) =>
        {
            var query = db.GasPrices.Where(g => g.Month == request.Month);
            if (!string.IsNullOrEmpty(request.CondominiumId))
                query = query.Where(g => g.CondominiumId == request.CondominiumId);

            var existing = await query.FirstOrDefaultAsync();
            
            if (existing != null)
            {
                existing.PricePerCubicMeter = request.PricePerCubicMeter;
                await db.SaveChangesAsync();
                return Results.Ok(existing);
            }

            var gasPrice = new GasPrice
            {
                Id = Guid.NewGuid().ToString(),
                Month = request.Month,
                PricePerCubicMeter = request.PricePerCubicMeter,
                CondominiumId = request.CondominiumId
            };

            db.GasPrices.Add(gasPrice);
            await db.SaveChangesAsync();

            return Results.Created($"/api/gasprices/{gasPrice.Month}", gasPrice);
        }).RequireAuthorization("CanWrite");
    }
}

public record CreateGasReadingRequest(string ApartmentId, string Month, double PreviousReading, double CurrentReading);
public record CreateGasPriceRequest(string Month, double PricePerCubicMeter, string? CondominiumId);
