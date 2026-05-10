using GasControl.Api.Models.Finance;
using Microsoft.EntityFrameworkCore;

namespace GasControl.Api.Endpoints;

public static class FinanceEndpoints
{
    public static void MapFinanceEndpoints(this IEndpointRouteBuilder app)
    {
        // GET Dashboard Data
        app.MapGet("/api/finance/{condominiumId}/{year}/{type}", async (AppDbContext db, string condominiumId, int year, string type) =>
        {
            if (!Enum.TryParse<EFinanceCategoryType>(type, true, out var parsedType))
                return Results.BadRequest("Invalid type parameter.");

            var categories = await db.FinanceCategories
                .Include(c => c.SubCategories)
                .Where(c => c.CondominiumId == condominiumId && c.Year == year && c.Type == parsedType)
                .OrderBy(c => c.Name)
                .ToListAsync();

            if (categories.Count == 0)
            {
                // Create defaults explicitly in the order requested by Frontend
                string[] defaultCats = ["Pessoal", "Consumo", "Manutenção", "Material", "Seguros", "Administrativo", "Fundo de Reserva"];
                foreach(var c in defaultCats) 
                {
                    var cat = new FinanceCategory 
                    { 
                        Id = Guid.NewGuid().ToString(),
                        CondominiumId = condominiumId, 
                        Year = year, 
                        Name = c, 
                        Type = parsedType,
                        BaseValues = new decimal[12] 
                    };
                    db.FinanceCategories.Add(cat);
                    categories.Add(cat);
                }
                await db.SaveChangesAsync();
            }
            
            return Results.Ok(categories);
        }).RequireAuthorization("CanWrite"); // Only Sindico and Admin

        // POST Sync Dashboard Data
        app.MapPost("/api/finance/sync/{condominiumId}/{year}/{type}", async (AppDbContext db, string condominiumId, int year, string type, List<FinanceCategoryPayload> payload) =>
        {
            if (!Enum.TryParse<EFinanceCategoryType>(type, true, out var parsedType))
                return Results.BadRequest("Invalid type parameter.");

            var existingCats = await db.FinanceCategories
                .Include(c => c.SubCategories)
                .Where(c => c.CondominiumId == condominiumId && c.Year == year && c.Type == parsedType)
                .ToListAsync();

            foreach (var reqCat in payload)
            {
                var dbCat = existingCats.FirstOrDefault(c => c.Id == reqCat.Id);
                if (dbCat != null)
                {
                    // Update base values
                    dbCat.BaseValues = reqCat.BaseValues;
                    
                    // Delete removed subcategories
                    var reqSubIds = reqCat.SubCategories.Select(s => s.Id).ToList();
                    dbCat.SubCategories.RemoveAll(s => !reqSubIds.Contains(s.Id));

                    // Add or update
                    foreach (var reqSub in reqCat.SubCategories)
                    {
                        var dbSub = dbCat.SubCategories.FirstOrDefault(s => s.Id == reqSub.Id);
                        if (dbSub != null)
                        {
                            dbSub.Name = reqSub.Name;
                            dbSub.Values = reqSub.Values;
                        }
                        else
                        {
                            dbCat.SubCategories.Add(new FinanceSubCategory
                            {
                                Id = string.IsNullOrEmpty(reqSub.Id) ? Guid.NewGuid().ToString() : reqSub.Id,
                                FinanceCategoryId = dbCat.Id,
                                Name = reqSub.Name,
                                Values = reqSub.Values
                            });
                        }
                    }
                }
            }

            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization("CanWrite");

        // GET Export Dashboard Data to PDF
        app.MapGet("/api/finance/{condominiumId}/{year}/{type}/export", async (AppDbContext db, string condominiumId, int year, string type) =>
        {
            if (!Enum.TryParse<EFinanceCategoryType>(type, true, out var parsedType))
                return Results.BadRequest("Invalid type parameter.");

            var categories = await db.FinanceCategories
                .Include(c => c.SubCategories)
                .Where(c => c.CondominiumId == condominiumId && c.Year == year && c.Type == parsedType)
                .OrderBy(c => c.Name)
                .ToListAsync();

            if (categories.Count == 0)
            {
                return Results.NotFound("Nenhum dado encontrado para este ano.");
            }

            var pdfBytes = Services.FinancePdfGenerator.GeneratePdf(categories, year);

            return Results.File(pdfBytes, "application/pdf", $"Dashboard_Financeiro_{parsedType}_{year}.pdf");
        }).RequireAuthorization("ReadOnly");
    }
}

public record FinanceSubCategoryPayload(string Id, string Name, decimal[] Values);
public record FinanceCategoryPayload(string Id, string Name, decimal[] BaseValues, List<FinanceSubCategoryPayload> SubCategories);