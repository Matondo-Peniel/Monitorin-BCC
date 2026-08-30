using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MonitoringETL.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserPreferences",
                columns: table => new
                {
                    IdUtilisateur = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GeneralJson = table.Column<string>(type: "nvarchar(max)", maxLength: 10000, nullable: false),
                    NotificationsJson = table.Column<string>(type: "nvarchar(max)", maxLength: 10000, nullable: false),
                    DateModification = table.Column<DateTime>(type: "datetime2(0)", precision: 0, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPreferences", x => x.IdUtilisateur);
                    table.ForeignKey(
                        name: "FK_UserPreferences_AspNetUsers_IdUtilisateur",
                        column: x => x.IdUtilisateur,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserPreferences");
        }
    }
}
