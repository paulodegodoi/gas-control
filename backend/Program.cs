using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

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

app.UseCors();

// ----------------
// Endpoints de Apartamentos
// ----------------

app.MapGet("/api/apartments", async (AppDbContext db) => await db.Apartments.ToListAsync());

app.MapPost("/api/apartments", async (AppDbContext db, CreateApartmentRequest request) =>
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

app.MapPut("/api/apartments/{id}", async (AppDbContext db, string id, UpdateApartmentRequest request) =>
{
    var apt = await db.Apartments.FindAsync(id);
    if (apt is null) return Results.NotFound();

    apt.Number = request.Number;
    apt.Name = request.Name;

    await db.SaveChangesAsync();
    return Results.Ok(apt);
});

app.MapPatch("/api/apartments/{id}/state", async (AppDbContext db, string id, UpdateApartmentStateRequest request) =>
{
    var apt = await db.Apartments.FindAsync(id);
    if (apt is null) return Results.NotFound();

    apt.IsActive = request.IsActive;

    await db.SaveChangesAsync();
    return Results.Ok(apt);
});

// ----------------
// Endpoints de Leituras
// ----------------

app.MapGet("/api/readings", async (AppDbContext db, string? month) =>
{
    var query = db.Readings.AsQueryable();

    if (!string.IsNullOrEmpty(month))
        query = query.Where(r => r.Month == month);

    return await query.ToListAsync();
});

//app.MapGet("/api/readings/history/{apartmentId}", (string apartmentId) =>
//{
//    return Results.Ok(readings.Where(r => r.ApartmentId == apartmentId).OrderBy(r => r.Month));
//});

app.MapGet("/api/readings/all", async (AppDbContext db) =>
{
    var readings = await db.Readings
        .OrderBy(r => r.ApartmentId)
        .ThenBy(r => r.Month)
        .ToListAsync();

    // calcula PreviousReading para cada leitura
    foreach (var r in readings)
    {
        var prev = readings
            .Where(x => x.ApartmentId == r.ApartmentId && string.Compare(x.Month, r.Month) < 0)
            .OrderByDescending(x => x.Month)
            .FirstOrDefault();

        r.PreviousReading = prev?.CurrentReading ?? 0;
    }

    return readings;
});

app.MapPost("/api/readings", async (AppDbContext db, CreateReadingRequest request) =>
{
    var existing = await db.Readings
        .FirstOrDefaultAsync(r => r.ApartmentId == request.ApartmentId && r.Month == request.Month);

    if (existing != null)
    {
        existing.CurrentReading = request.CurrentReading;
        await db.SaveChangesAsync();
        return Results.Ok(existing);
    }

    var reading = new Reading
    {
        Id = Guid.NewGuid().ToString(),
        ApartmentId = request.ApartmentId,
        Month = request.Month,
        CurrentReading = request.CurrentReading
        // PreviousReading não é salvo
    };

    db.Readings.Add(reading);
    await db.SaveChangesAsync();

    return Results.Created("/api/readings", reading);
});

// ----------------
// Endpoints de Preços do Gás (Gas Prices)
// ----------------

app.MapGet("/api/gasprices/{month}", async (AppDbContext db, string month) =>
{
    var gasPrice = await db.GasPrices.FirstOrDefaultAsync(g => g.Month == month);
    if (gasPrice is null) return Results.NotFound();
    return Results.Ok(gasPrice);
});

app.MapPost("/api/gasprices", async (AppDbContext db, CreateGasPriceRequest request) =>
{
    var existing = await db.GasPrices.FirstOrDefaultAsync(g => g.Month == request.Month);
    
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
        PricePerCubicMeter = request.PricePerCubicMeter
    };

    db.GasPrices.Add(gasPrice);
    await db.SaveChangesAsync();

    return Results.Created($"/api/gasprices/{gasPrice.Month}", gasPrice);
});

app.Run();

// ----------------
// Models & DTOs
// ----------------

public class Apartment
{
    public string Id { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class Reading
{
    public string Id { get; set; } = string.Empty;
    public string ApartmentId { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;

    [NotMapped]
    public double PreviousReading { get; set; }
    public double CurrentReading { get; set; }
}

public class GasPrice
{
    public string Id { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;
    public double PricePerCubicMeter { get; set; }
}

public record CreateApartmentRequest(string Number, string Name);
public record UpdateApartmentRequest(string Number, string Name);
public record UpdateApartmentStateRequest(bool IsActive);
public record CreateReadingRequest(string ApartmentId, string Month, double PreviousReading, double CurrentReading);
public record CreateGasPriceRequest(string Month, double PricePerCubicMeter);
