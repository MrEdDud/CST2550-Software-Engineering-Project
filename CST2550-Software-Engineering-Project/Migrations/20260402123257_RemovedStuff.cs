using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CST2550.Migrations
{
    /// <inheritdoc />
    public partial class RemovedStuff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            //migrationBuilder.DropColumn(
            //    name: "Interests",
            //    table: "Profiles");

            //migrationBuilder.DropColumn(
            //    name: "MaxAge",
            //    table: "Profiles");

            //migrationBuilder.DropColumn(
            //    name: "MaxDistance",
            //    table: "Profiles");

            //migrationBuilder.DropColumn(
            //    name: "MinAge",
            //    table: "Profiles");

            //migrationBuilder.DropColumn(
            //    name: "Occupation",
            //    table: "Profiles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Hobbies",
                table: "Profiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Interests",
                table: "Profiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MaxAge",
                table: "Profiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxDistance",
                table: "Profiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MinAge",
                table: "Profiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Occupation",
                table: "Profiles",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
