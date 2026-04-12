using GasControl.Api.Models;
using GasControl.Api.Models.Gas;
using GasControl.Api.Models.Water;
using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public DbSet<Apartment> Apartments => Set<Apartment>();
    
    // Gas
    public DbSet<GasReading> GasReadings => Set<GasReading>();
    public DbSet<GasPrice> GasPrices => Set<GasPrice>();

    // Water
    public DbSet<WaterReading> WaterReadings => Set<WaterReading>();
    public DbSet<WaterPrice> WaterPrices => Set<WaterPrice>();

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Apartment>()
            .HasKey(a => a.Id);

        // Gas configuration
        modelBuilder.Entity<GasReading>()
            .HasKey(r => r.Id);

        modelBuilder.Entity<GasReading>()
            .HasOne<Apartment>()
            .WithMany()
            .HasForeignKey(r => r.ApartmentId);

        modelBuilder.Entity<GasPrice>()
            .HasKey(g => g.Id);

        // Water configuration
        modelBuilder.Entity<WaterReading>()
            .HasKey(r => r.Id);

        modelBuilder.Entity<WaterReading>()
            .HasOne<Apartment>()
            .WithMany()
            .HasForeignKey(r => r.ApartmentId);

        modelBuilder.Entity<WaterPrice>()
            .HasKey(w => w.Id);
    }
}