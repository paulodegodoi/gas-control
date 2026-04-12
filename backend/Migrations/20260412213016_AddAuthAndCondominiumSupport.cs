using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GasControl.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthAndCondominiumSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CondominiumId",
                table: "WaterPrices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CondominiumId",
                table: "GasPrices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CondominiumId",
                table: "Apartments",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    CondominiumId = table.Column<string>(type: "text", nullable: true),
                    ApartmentId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropColumn(
                name: "CondominiumId",
                table: "WaterPrices");

            migrationBuilder.DropColumn(
                name: "CondominiumId",
                table: "GasPrices");

            migrationBuilder.DropColumn(
                name: "CondominiumId",
                table: "Apartments");
        }
    }
}
