using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace MonitoringETL.Api.Controllers;

[Authorize(Roles = "ADMINISTRATEUR"), ApiController, Route("api/sauvegardes")]
public sealed class SauvegardesController(IConfiguration configuration) : ControllerBase
{
    private string ConnectionString => configuration.GetConnectionString("MonitoringDatabase")
        ?? throw new InvalidOperationException("La chaîne de connexion est absente.");

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(ct);
        const string sql = """
            SELECT TOP (20) backup_set_id AS id, database_name AS databaseName,
                   backup_start_date AS dateDebut, backup_finish_date AS dateFin,
                   backup_size AS tailleOctets, is_copy_only AS copyOnly
            FROM msdb.dbo.backupset
            WHERE database_name = DB_NAME() AND type = 'D'
            ORDER BY backup_finish_date DESC;
            """;
        await using var command = new SqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(ct);
        var rows = new List<object>();
        while (await reader.ReadAsync(ct)) rows.Add(new
        {
            id = reader.GetInt32(0),
            databaseName = reader.GetString(1),
            dateDebut = reader.GetDateTime(2),
            dateFin = reader.IsDBNull(3) ? (DateTime?)null : reader.GetDateTime(3),
            tailleOctets = Convert.ToInt64(reader.GetValue(4)),
            copyOnly = reader.GetBoolean(5),
        });
        return Ok(rows);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CancellationToken ct)
    {
        var builder = new SqlConnectionStringBuilder(ConnectionString);
        var database = builder.InitialCatalog;
        if (string.IsNullOrWhiteSpace(database)) return BadRequest(new { message = "Base de données non définie." });
        var safeDatabase = database.Replace("]", "]]", StringComparison.Ordinal);
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(ct);
        var pathCommand = new SqlCommand("SELECT CONVERT(nvarchar(4000), SERVERPROPERTY('InstanceDefaultBackupPath'));", connection);
        var directory = Convert.ToString(await pathCommand.ExecuteScalarAsync(ct));
        if (string.IsNullOrWhiteSpace(directory)) return StatusCode(500, new { message = "Répertoire de sauvegarde SQL Server introuvable." });
        var filename = $"{database}_{DateTime.UtcNow:yyyyMMdd_HHmmss}_copyonly.bak";
        var path = Path.Combine(directory, filename);
        var sql = $"BACKUP DATABASE [{safeDatabase}] TO DISK = @path WITH COPY_ONLY, CHECKSUM, COMPRESSION, INIT, STATS = 10;";
        await using var command = new SqlCommand(sql, connection) { CommandTimeout = 600 };
        command.Parameters.AddWithValue("@path", path);
        await command.ExecuteNonQueryAsync(ct);
        return Created("/api/sauvegardes", new { message = "Sauvegarde terminée.", fichier = filename, date = DateTime.UtcNow });
    }
}
