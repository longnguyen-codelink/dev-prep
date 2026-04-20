using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceTracker.Migrations
{
    /// <inheritdoc />
    public partial class UserRoleColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Role",
                table: "User",
                newName: "role");

            migrationBuilder.AlterColumn<int>(
                name: "role",
                table: "User",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "role",
                table: "User",
                newName: "Role");

            migrationBuilder.AlterColumn<int>(
                name: "Role",
                table: "User",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);
        }
    }
}
