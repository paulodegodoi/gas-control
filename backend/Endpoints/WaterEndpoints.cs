using GasControl.Api.Models.Water;
using Microsoft.EntityFrameworkCore;

namespace GasControl.Api.Endpoints;

public static class WaterEndpoints
{
    public static void MapWaterEndpoints(this IEndpointRouteBuilder app)
    {
        // ----------------
        // Endpoints de Leituras de Água
        // ----------------
        app.MapGet("/api/water/readings", async (AppDbContext db, string? month) =>
        {
            var query = db.WaterReadings.AsQueryable();

            if (!string.IsNullOrEmpty(month))
                query = query.Where(r => r.Month == month);

            return await query.ToListAsync();
        });

        app.MapPost("/api/water/readings/bulk", async (AppDbContext db, List<CreateWaterReadingRequest> requests) =>
        {
            foreach (var req in requests)
            {
                var existing = await db.WaterReadings
                    .FirstOrDefaultAsync(r => r.ApartmentId == req.ApartmentId && r.Month == req.Month);

                if (existing != null)
                {
                    existing.CurrentReading = req.CurrentReading;
                }
                else
                {
                    var reading = new WaterReading
                    {
                        Id = Guid.NewGuid().ToString(),
                        ApartmentId = req.ApartmentId,
                        Month = req.Month,
                        CurrentReading = req.CurrentReading
                    };
                    db.WaterReadings.Add(reading);
                }
            }
            
            await db.SaveChangesAsync();
            return Results.Ok();
        });

        app.MapPost("/api/water/readings", async (AppDbContext db, CreateWaterReadingRequest request) =>
        {
            var existing = await db.WaterReadings
                .FirstOrDefaultAsync(r => r.ApartmentId == request.ApartmentId && r.Month == request.Month);

            if (existing != null)
            {
                existing.CurrentReading = request.CurrentReading;
                await db.SaveChangesAsync();
                return Results.Ok(existing);
            }

            var reading = new WaterReading
            {
                Id = Guid.NewGuid().ToString(),
                ApartmentId = request.ApartmentId,
                Month = request.Month,
                CurrentReading = request.CurrentReading
            };

            db.WaterReadings.Add(reading);
            await db.SaveChangesAsync();

            return Results.Created("/api/water/readings", reading);
        });

        // ----------------
        // Endpoints de Preços da Água
        // ----------------
        app.MapGet("/api/waterprices/{month}", async (AppDbContext db, string month) =>
        {
            var waterPrice = await db.WaterPrices.FirstOrDefaultAsync(g => g.Month == month);
            if (waterPrice is null) return Results.NotFound();
            return Results.Ok(waterPrice);
        });

        app.MapPost("/api/waterprices", async (AppDbContext db, CreateWaterPriceRequest request) =>
        {
            var existing = await db.WaterPrices.FirstOrDefaultAsync(g => g.Month == request.Month);
            
            if (existing != null)
            {
                existing.PricePerCubicMeter = request.PricePerCubicMeter;
                await db.SaveChangesAsync();
                return Results.Ok(existing);
            }

            var waterPrice = new WaterPrice
            {
                Id = Guid.NewGuid().ToString(),
                Month = request.Month,
                PricePerCubicMeter = request.PricePerCubicMeter
            };

            db.WaterPrices.Add(waterPrice);
            await db.SaveChangesAsync();

            return Results.Created($"/api/waterprices/{waterPrice.Month}", waterPrice);
        });
    }
}

public record CreateWaterReadingRequest(string ApartmentId, string Month, double PreviousReading, double CurrentReading);
public record CreateWaterPriceRequest(string Month, double PricePerCubicMeter);
