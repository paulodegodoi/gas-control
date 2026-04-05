using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

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

// Simulação de Banco de Dados em Memória (como não estamos usando um BD real por enquanto)
var apartments = new List<Apartment>
{
    new Apartment { Id = Guid.NewGuid().ToString(), Number = "101", Name = "Família Silva", IsActive = true },
    new Apartment { Id = Guid.NewGuid().ToString(), Number = "102", Name = "Família Souza", IsActive = true },
    new Apartment { Id = Guid.NewGuid().ToString(), Number = "103", Name = "Família Lima", IsActive = false },
    new Apartment { Id = Guid.NewGuid().ToString(), Number = "201", Name = "Família Carvalho", IsActive = true }
};

var readings = new List<Reading>
{
    new Reading { Id = Guid.NewGuid().ToString(), ApartmentId = apartments[0].Id, Month = "2023-09", PreviousReading = 120, CurrentReading = 135 },
    new Reading { Id = Guid.NewGuid().ToString(), ApartmentId = apartments[1].Id, Month = "2023-09", PreviousReading = 200, CurrentReading = 215 },
    new Reading { Id = Guid.NewGuid().ToString(), ApartmentId = apartments[3].Id, Month = "2023-09", PreviousReading = 80, CurrentReading = 92 },
    new Reading { Id = Guid.NewGuid().ToString(), ApartmentId = apartments[0].Id, Month = "2023-10", PreviousReading = 135, CurrentReading = 151 }
};


// ----------------
// Endpoints de Apartamentos
// ----------------

app.MapGet("/api/apartments", () => Results.Ok(apartments));

app.MapPost("/api/apartments", ([FromBody] CreateApartmentRequest request) =>
{
    var newApt = new Apartment
    {
        Id = Guid.NewGuid().ToString(),
        Number = request.Number,
        Name = request.Name,
        IsActive = true
    };
    apartments.Add(newApt);
    return Results.Created($"/api/apartments/{newApt.Id}", newApt);
});

app.MapPut("/api/apartments/{id}", (string id, [FromBody] UpdateApartmentRequest request) =>
{
    var apt = apartments.FirstOrDefault(a => a.Id == id);
    if (apt is null) return Results.NotFound();

    apt.Number = request.Number;
    apt.Name = request.Name;
    return Results.Ok(apt);
});

app.MapPatch("/api/apartments/{id}/state", (string id, [FromBody] UpdateApartmentStateRequest request) =>
{
    var apt = apartments.FirstOrDefault(a => a.Id == id);
    if (apt is null) return Results.NotFound();

    apt.IsActive = request.IsActive;
    return Results.Ok(apt);
});

// ----------------
// Endpoints de Leituras
// ----------------

app.MapGet("/api/readings", ([FromQuery] string? month) => 
{
    if(string.IsNullOrEmpty(month)) return Results.Ok(readings);
    return Results.Ok(readings.Where(r => r.Month == month));
});

app.MapGet("/api/readings/history/{apartmentId}", (string apartmentId) =>
{
    return Results.Ok(readings.Where(r => r.ApartmentId == apartmentId).OrderBy(r => r.Month));
});

app.MapGet("/api/readings/all", () =>
{
    return Results.Ok(readings);
});

app.MapPost("/api/readings", ([FromBody] CreateReadingRequest request) =>
{
    var existingReading = readings.FirstOrDefault(r => r.ApartmentId == request.ApartmentId && r.Month == request.Month);
    if (existingReading != null)
    {
        existingReading.CurrentReading = request.CurrentReading;
        existingReading.PreviousReading = request.PreviousReading;
        return Results.Ok(existingReading);
    }

    var newReading = new Reading
    {
        Id = Guid.NewGuid().ToString(),
        ApartmentId = request.ApartmentId,
        Month = request.Month,
        PreviousReading = request.PreviousReading,
        CurrentReading = request.CurrentReading
    };
    readings.Add(newReading);
    return Results.Created($"/api/readings", newReading);
});

app.Run();

// ----------------
// Models & DTOs
// ----------------

class Apartment
{
    public string Id { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

class Reading
{
    public string Id { get; set; } = string.Empty;
    public string ApartmentId { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;
    public double PreviousReading { get; set; }
    public double CurrentReading { get; set; }
}

public record CreateApartmentRequest(string Number, string Name);
public record UpdateApartmentRequest(string Number, string Name);
public record UpdateApartmentStateRequest(bool IsActive);
public record CreateReadingRequest(string ApartmentId, string Month, double PreviousReading, double CurrentReading);
