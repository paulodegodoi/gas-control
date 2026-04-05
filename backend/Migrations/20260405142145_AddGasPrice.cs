using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GasControl.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGasPrice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GasPrices",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Month = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PricePerCubicMeter = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GasPrices", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GasPrices");
        }
    }
}
