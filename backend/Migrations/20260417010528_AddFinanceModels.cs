using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GasControl.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FinanceCategories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CondominiumId = table.Column<string>(type: "text", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    BaseValues = table.Column<decimal[]>(type: "numeric[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FinanceSubCategories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    FinanceCategoryId = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Values = table.Column<decimal[]>(type: "numeric[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceSubCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FinanceSubCategories_FinanceCategories_FinanceCategoryId",
                        column: x => x.FinanceCategoryId,
                        principalTable: "FinanceCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FinanceSubCategories_FinanceCategoryId",
                table: "FinanceSubCategories",
                column: "FinanceCategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FinanceSubCategories");

            migrationBuilder.DropTable(
                name: "FinanceCategories");
        }
    }
}
