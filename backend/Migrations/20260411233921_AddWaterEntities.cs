using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GasControl.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWaterEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Readings");

            migrationBuilder.CreateTable(
                name: "GasReadings",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ApartmentId = table.Column<string>(type: "text", nullable: false),
                    Month = table.Column<string>(type: "text", nullable: false),
                    CurrentReading = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GasReadings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GasReadings_Apartments_ApartmentId",
                        column: x => x.ApartmentId,
                        principalTable: "Apartments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WaterPrices",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Month = table.Column<string>(type: "text", nullable: false),
                    PricePerCubicMeter = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WaterPrices", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WaterReadings",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ApartmentId = table.Column<string>(type: "text", nullable: false),
                    Month = table.Column<string>(type: "text", nullable: false),
                    CurrentReading = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WaterReadings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WaterReadings_Apartments_ApartmentId",
                        column: x => x.ApartmentId,
                        principalTable: "Apartments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GasReadings_ApartmentId",
                table: "GasReadings",
                column: "ApartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_WaterReadings_ApartmentId",
                table: "WaterReadings",
                column: "ApartmentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GasReadings");

            migrationBuilder.DropTable(
                name: "WaterPrices");

            migrationBuilder.DropTable(
                name: "WaterReadings");

            migrationBuilder.CreateTable(
                name: "Readings",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ApartmentId = table.Column<string>(type: "text", nullable: false),
                    CurrentReading = table.Column<double>(type: "double precision", nullable: false),
                    Month = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Readings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Readings_Apartments_ApartmentId",
                        column: x => x.ApartmentId,
                        principalTable: "Apartments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Readings_ApartmentId",
                table: "Readings",
                column: "ApartmentId");
        }
    }
}
