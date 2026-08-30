using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MonitoringETL.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAnalysteRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[] { new Guid("33333333-3333-3333-3333-333333333333"), "role-analyste-v1", "ANALYSTE", "ANALYSTE" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"));
        }
    }
}
