using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CST2550.Migrations
{
    /// <inheritdoc />
    public partial class EnforceUniqueMatchesAndLikes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Matches_User1Id",
                table: "Matches");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_User1Id_User2Id",
                table: "Matches",
                columns: new[] { "User1Id", "User2Id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Matches_User1Id_User2Id",
                table: "Matches");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_User1Id",
                table: "Matches",
                column: "User1Id");
        }
    }
}
