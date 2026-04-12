using GasControl.Api.Models;
using GasControl.Api.Models.Auth;
using GasControl.Api.Models.Gas;
using GasControl.Api.Models.Water;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

public class AppDbContext : DbContext
{
    public DbSet<Condominium> Condominiums => Set<Condominium>();
    public DbSet<Apartment> Apartments => Set<Apartment>();

    // Gas
    public DbSet<GasReading> GasReadings => Set<GasReading>();
    public DbSet<GasPrice> GasPrices => Set<GasPrice>();

    // Water
    public DbSet<WaterReading> WaterReadings => Set<WaterReading>();
    public DbSet<WaterPrice> WaterPrices => Set<WaterPrice>();

    // Auth
    public DbSet<User> Users => Set<User>();

    private readonly Func<ClaimsPrincipal?> _currentUserProvider;

    // EF Core dynamic parameters for Query Filters
    public bool IsAdmin => _currentUserProvider()?.FindFirst(ClaimTypes.Role)?.Value == nameof(UserRole.Admin);
    public List<string> UserCondominiumIds => _currentUserProvider()?.FindAll("condominiumId").Select(c => c.Value).ToList() ?? new List<string>();
    public string? UserApartmentId => _currentUserProvider()?.FindFirst("apartmentId")?.Value;


    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        Func<ClaimsPrincipal?> currentUserProvider)
        : base(options)
    {
        _currentUserProvider = currentUserProvider;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Condominium>()
            .HasKey(c => c.Id);

        modelBuilder.Entity<Apartment>()
            .HasKey(a => a.Id);

        modelBuilder.Entity<GasReading>()
            .HasKey(r => r.Id);
        modelBuilder.Entity<GasReading>()
            .HasOne<Apartment>()
            .WithMany()
            .HasForeignKey(r => r.ApartmentId);

        modelBuilder.Entity<GasPrice>()
            .HasKey(g => g.Id);

        modelBuilder.Entity<WaterReading>()
            .HasKey(r => r.Id);
        modelBuilder.Entity<WaterReading>()
            .HasOne<Apartment>()
            .WithMany()
            .HasForeignKey(r => r.ApartmentId);

        modelBuilder.Entity<WaterPrice>()
            .HasKey(w => w.Id);

        modelBuilder.Entity<User>()
            .HasKey(u => u.Id);
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasConversion<string>();

        // ---------------------------------------------------------
        // Global Query Filters
        // ---------------------------------------------------------
        modelBuilder.Entity<Apartment>()
            .HasQueryFilter(a => IsAdmin || (a.CondominiumId != null && UserCondominiumIds.Contains(a.CondominiumId) && (UserApartmentId == null || a.Id == UserApartmentId)));

        modelBuilder.Entity<GasReading>()
            .HasQueryFilter(r => IsAdmin || UserApartmentId == null || r.ApartmentId == UserApartmentId);

        modelBuilder.Entity<WaterReading>()
            .HasQueryFilter(r => IsAdmin || UserApartmentId == null || r.ApartmentId == UserApartmentId);

        modelBuilder.Entity<GasPrice>()
            .HasQueryFilter(g => IsAdmin || (g.CondominiumId != null && UserCondominiumIds.Contains(g.CondominiumId)));

        modelBuilder.Entity<WaterPrice>()
            .HasQueryFilter(w => IsAdmin || (w.CondominiumId != null && UserCondominiumIds.Contains(w.CondominiumId)));

        modelBuilder.Entity<Condominium>()
            .HasQueryFilter(c => IsAdmin || UserCondominiumIds.Contains(c.Id));
    }
}