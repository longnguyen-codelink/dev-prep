using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceTracker.Migrations
{
    /// <inheritdoc />
    public partial class MapTransactionColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transaction_Category_CategoryId",
                table: "Transaction");

            migrationBuilder.DropForeignKey(
                name: "FK_Transaction_User_CreatedByUserId",
                table: "Transaction");

            migrationBuilder.DropForeignKey(
                name: "FK_Transaction_User_UpdatedByUserId",
                table: "Transaction");

            migrationBuilder.DropIndex(
                name: "IX_Transaction_CreatedByUserId",
                table: "Transaction");

            migrationBuilder.DropIndex(
                name: "IX_Transaction_UpdatedByUserId",
                table: "Transaction");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Transaction");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Transaction");

            migrationBuilder.RenameColumn(
                name: "CategoryId",
                table: "Transaction",
                newName: "category_id");

            migrationBuilder.RenameIndex(
                name: "IX_Transaction_CategoryId",
                table: "Transaction",
                newName: "IX_Transaction_category_id");

            migrationBuilder.CreateIndex(
                name: "IX_Transaction_created_by",
                table: "Transaction",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_Transaction_updated_by",
                table: "Transaction",
                column: "updated_by");

            migrationBuilder.AddForeignKey(
                name: "FK_Transaction_Category_category_id",
                table: "Transaction",
                column: "category_id",
                principalTable: "Category",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Transaction_User_created_by",
                table: "Transaction",
                column: "created_by",
                principalTable: "User",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Transaction_User_updated_by",
                table: "Transaction",
                column: "updated_by",
                principalTable: "User",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transaction_Category_category_id",
                table: "Transaction");

            migrationBuilder.DropForeignKey(
                name: "FK_Transaction_User_created_by",
                table: "Transaction");

            migrationBuilder.DropForeignKey(
                name: "FK_Transaction_User_updated_by",
                table: "Transaction");

            migrationBuilder.DropIndex(
                name: "IX_Transaction_created_by",
                table: "Transaction");

            migrationBuilder.DropIndex(
                name: "IX_Transaction_updated_by",
                table: "Transaction");

            migrationBuilder.RenameColumn(
                name: "category_id",
                table: "Transaction",
                newName: "CategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_Transaction_category_id",
                table: "Transaction",
                newName: "IX_Transaction_CategoryId");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Transaction",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByUserId",
                table: "Transaction",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transaction_CreatedByUserId",
                table: "Transaction",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Transaction_UpdatedByUserId",
                table: "Transaction",
                column: "UpdatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Transaction_Category_CategoryId",
                table: "Transaction",
                column: "CategoryId",
                principalTable: "Category",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Transaction_User_CreatedByUserId",
                table: "Transaction",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Transaction_User_UpdatedByUserId",
                table: "Transaction",
                column: "UpdatedByUserId",
                principalTable: "User",
                principalColumn: "id");
        }
    }
}
