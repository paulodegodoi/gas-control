using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GasControl.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCondominiumTableAndUsersArray : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CondominiumId",
                table: "Users");

            migrationBuilder.AddColumn<List<string>>(
                name: "CondominiumIds",
                table: "Users",
                type: "text[]",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Condominiums",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Condominiums", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Condominiums");

            migrationBuilder.DropColumn(
                name: "CondominiumIds",
                table: "Users");

            migrationBuilder.AddColumn<string>(
                name: "CondominiumId",
                table: "Users",
                type: "text",
                nullable: true);
        }
    }
}
