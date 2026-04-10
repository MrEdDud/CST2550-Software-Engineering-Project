using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CST2550.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotosJsonColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Photos",
                table: "Profiles",
                newName: "PhotosJson");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PhotosJson",
                table: "Profiles",
                newName: "Photos");
        }
    }
}
