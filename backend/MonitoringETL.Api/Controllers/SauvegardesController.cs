using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Security.Claims;

namespace MonitoringETL.Api.Controllers;

[Authorize(Roles = "ADMINISTRATEUR,ANALYSTE"), ApiController, Route("api/sauvegardes")]
public sealed class SauvegardesController(IConfiguration configuration) : ControllerBase
{
    private string ConnectionString => configuration.GetConnectionString("MonitoringDatabase")
        ?? throw new InvalidOperationException("La chaîne de connexion est absente.");

    private static bool IsUatDatabase(string? database) => !string.IsNullOrWhiteSpace(database)
        && database.EndsWith("_UAT", StringComparison.OrdinalIgnoreCase);

    private IActionResult? EnsureUatDatabase()
    {
        var database = new SqlConnectionStringBuilder(ConnectionString).InitialCatalog;
        return IsUatDatabase(database) ? null : StatusCode(StatusCodes.Status403Forbidden,
            new { message = "Les sauvegardes depuis la plateforme sont autorisées uniquement pour une base UAT." });
    }

    private async Task<(string Perimetre, string Libelle, string Connection)> ResolveTarget(string scope, CancellationToken ct)
    {
        if (string.Equals(scope, "suivi-etl", StringComparison.OrdinalIgnoreCase))
            return ("SUIVI_ETL", "Suivi ETL", ConnectionString);
        if (!string.Equals(scope, "validation", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Périmètre de sauvegarde inconnu.");

        var validationConnection = configuration.GetConnectionString("ValidationDatabase") ?? ConnectionString;
        var builder = new SqlConnectionStringBuilder(validationConnection);
        try
        {
            await using var discovery = new SqlConnection(ConnectionString);
            await discovery.OpenAsync(ct);
            await using var command = new SqlCommand("SELECT BaseDonnees FROM dbo.ValidationConfiguration WHERE Id=1", discovery);
            var configuredDatabase = Convert.ToString(await command.ExecuteScalarAsync(ct));
            if (!string.IsNullOrWhiteSpace(configuredDatabase)) builder.InitialCatalog = configuredDatabase;
        }
        catch (SqlException)
        {
            // La configuration de validation n'est pas encore créée : la connexion dédiée reste la référence.
        }
        return ("VALIDATION", "Validation des données", builder.ConnectionString);
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        if (EnsureUatDatabase() is { } forbidden) return forbidden;
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(ct);
        const string sql = """
            SELECT TOP (50) Id, Perimetre, BaseDonnees, NomFichier, TailleOctets, Statut,
                   Utilisateur, DateDebut, DateFin, Erreur
            FROM dbo.SauvegardeJournal
            ORDER BY Id DESC;
            """;
        await using var command = new SqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(ct);
        var rows = new List<object>();
        while (await reader.ReadAsync(ct)) rows.Add(new
        {
            id = reader.GetInt64(0),
            perimetre = reader.GetString(1),
            databaseName = reader.GetString(2),
            fichier = reader.GetString(3),
            tailleOctets = reader.IsDBNull(4) ? (long?)null : reader.GetInt64(4),
            statut = reader.GetString(5),
            utilisateur = reader.GetString(6),
            dateDebut = reader.GetDateTime(7),
            dateFin = reader.IsDBNull(8) ? (DateTime?)null : reader.GetDateTime(8),
            erreur = reader.IsDBNull(9) ? null : reader.GetString(9),
        });
        return Ok(rows);
    }

    [HttpPost("{scope}")]
    public async Task<IActionResult> Create(string scope, CancellationToken ct)
    {
        (string perimetre, string libelle, string targetConnectionString) target;
        try { target = await ResolveTarget(scope, ct); }
        catch (ArgumentException exception) { return BadRequest(new { message = exception.Message }); }
        var builder = new SqlConnectionStringBuilder(target.targetConnectionString);
        var database = builder.InitialCatalog;
        if (!IsUatDatabase(database)) return StatusCode(StatusCodes.Status403Forbidden,
            new { message = "Les sauvegardes depuis la plateforme sont autorisées uniquement pour une base UAT." });
        if (string.IsNullOrWhiteSpace(database)) return BadRequest(new { message = "Base de données non définie." });
        var safeDatabase = database.Replace("]", "]]", StringComparison.Ordinal);
        await using var connection = new SqlConnection(target.targetConnectionString);
        await connection.OpenAsync(ct);
        await using var auditConnection = new SqlConnection(ConnectionString);
        await auditConnection.OpenAsync(ct);
        var pathCommand = new SqlCommand("SELECT CONVERT(nvarchar(4000), SERVERPROPERTY('InstanceDefaultBackupPath'));", connection);
        var directory = Convert.ToString(await pathCommand.ExecuteScalarAsync(ct));
        if (string.IsNullOrWhiteSpace(directory)) return StatusCode(500, new { message = "Répertoire de sauvegarde SQL Server introuvable." });
        var filename = $"{database}_{DateTime.UtcNow:yyyyMMdd_HHmmss}_copyonly.bak";
        var path = Path.Combine(directory, filename);
        var startedAt = DateTime.UtcNow;
        var utilisateur = User.FindFirstValue(ClaimTypes.Email) ?? User.Identity?.Name ?? "Administrateur";
        long journalId;
        await using (var journal = new SqlCommand("INSERT dbo.SauvegardeJournal(Perimetre,BaseDonnees,NomFichier,CheminFichier,Statut,Utilisateur,DateDebut) OUTPUT INSERTED.Id VALUES(@scope,@db,@file,@path,N'EN_COURS',@user,@started)", auditConnection))
        {
            journal.Parameters.AddWithValue("@scope", target.perimetre);
            journal.Parameters.AddWithValue("@db", database);
            journal.Parameters.AddWithValue("@file", filename);
            journal.Parameters.AddWithValue("@path", path);
            journal.Parameters.AddWithValue("@user", utilisateur);
            journal.Parameters.AddWithValue("@started", startedAt);
            journalId = Convert.ToInt64(await journal.ExecuteScalarAsync(ct));
        }
        var sql = $"BACKUP DATABASE [{safeDatabase}] TO DISK = @path WITH COPY_ONLY, CHECKSUM, COMPRESSION, INIT, STATS = 10;";
        try
        {
            await using var command = new SqlCommand(sql, connection) { CommandTimeout = 600 };
            command.Parameters.AddWithValue("@path", path);
            await command.ExecuteNonQueryAsync(ct);
            long? size = null;
            await using (var sizeCommand = new SqlCommand("SELECT TOP (1) backup_size FROM msdb.dbo.backupset WHERE database_name=@db AND type='D' AND backup_finish_date>=@started ORDER BY backup_finish_date DESC", connection))
            {
                sizeCommand.Parameters.AddWithValue("@db", database);
                sizeCommand.Parameters.AddWithValue("@started", startedAt.AddMinutes(-1));
                var value = await sizeCommand.ExecuteScalarAsync(ct);
                if (value is not null && value != DBNull.Value) size = Convert.ToInt64(value);
            }
            await using var complete = new SqlCommand("UPDATE dbo.SauvegardeJournal SET Statut=N'REUSSI',TailleOctets=@size,DateFin=sysutcdatetime() WHERE Id=@id", auditConnection);
            complete.Parameters.AddWithValue("@size", (object?)size ?? DBNull.Value);
            complete.Parameters.AddWithValue("@id", journalId);
            await complete.ExecuteNonQueryAsync(ct);
            return Created("/api/sauvegardes", new { message = $"Sauvegarde {target.libelle} terminée et journalisée.", fichier = filename, date = DateTime.UtcNow });
        }
        catch (Exception exception)
        {
            await using var failed = new SqlCommand("UPDATE dbo.SauvegardeJournal SET Statut=N'ECHEC',DateFin=sysutcdatetime(),Erreur=@error WHERE Id=@id", auditConnection);
            failed.Parameters.AddWithValue("@error", exception.Message.Length > 2000 ? exception.Message[..2000] : exception.Message);
            failed.Parameters.AddWithValue("@id", journalId);
            await failed.ExecuteNonQueryAsync(CancellationToken.None);
            return StatusCode(500, new { message = "La sauvegarde a échoué. Le détail est enregistré dans le journal." });
        }
    }
}
