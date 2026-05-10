using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GasControl.Api.Migrations
{
    /// <inheritdoc />
    public partial class Add_EFinanceCategoryType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "FinanceCategories",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "FinanceCategories");
        }
    }
}
