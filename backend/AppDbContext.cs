using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public DbSet<Apartment> Apartments => Set<Apartment>();
    public DbSet<Reading> Readings => Set<Reading>();
    public DbSet<GasPrice> GasPrices => Set<GasPrice>();

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Apartment>()
            .HasKey(a => a.Id);

        modelBuilder.Entity<Reading>()
            .HasKey(r => r.Id);

        modelBuilder.Entity<Reading>()
            .HasOne<Apartment>()
            .WithMany()
            .HasForeignKey(r => r.ApartmentId);

        modelBuilder.Entity<GasPrice>()
            .HasKey(g => g.Id);
    }
}