using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;
using MonitoringETL.Api.Models;

namespace MonitoringETL.Api.Controllers;

public sealed record ConfigurerSourceRequest(string BaseDonnees, string Schema, string Table, string? NomConnexion);
public sealed record TableCompatible(string Schema, string Table, string ColonnesRequises);

[Authorize, ApiController, Route("api/sources")]
public sealed class SourcesController(MonitoringDbContext db, IConfiguration configuration) : ControllerBase
{
    private string ConnectionString => configuration.GetConnectionString("MonitoringDatabase") ?? throw new InvalidOperationException("La connexion SQL Server est absente.");

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await db.Connexions.AsNoTracking().Where(x => x.Actif).OrderBy(x => x.NomConnexion).Select(x => new { x.IdConnexion, x.NomConnexion, x.TypeConnexion, x.NomServeur, x.NomBase, x.NomTableMonitoring, x.Actif }).ToListAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, CancellationToken ct) { var source = await db.Connexions.AsNoTracking().Where(x => x.IdConnexion == id).Select(x => new { x.IdConnexion, x.NomConnexion, x.TypeConnexion, x.NomServeur, x.NomBase, x.NomTableMonitoring, x.Actif }).SingleOrDefaultAsync(ct); return source is null ? NotFound() : Ok(source); }

    [Authorize(Roles = "ADMINISTRATEUR,ANALYSTE"), HttpGet("configuration/serveur")]
    public IActionResult Server() { var builder = new SqlConnectionStringBuilder(ConnectionString); return Ok(new { serveur = builder.DataSource, authentification = builder.IntegratedSecurity ? "Windows / Active Directory" : "Compte de service SQL", lectureSeule = true }); }

    [Authorize(Roles = "ADMINISTRATEUR,ANALYSTE"), HttpGet("configuration/bases")]
    public async Task<IActionResult> Databases(CancellationToken ct)
    {
        await using var connection = CreateConnection("master"); await connection.OpenAsync(ct);
        await using var command = connection.CreateCommand(); command.CommandText = "SELECT [name] FROM sys.databases WHERE [state]=0 AND HAS_DBACCESS([name])=1 AND database_id>4 ORDER BY [name]";
        var items = new List<string>(); await using var reader = await command.ExecuteReaderAsync(ct); while (await reader.ReadAsync(ct)) items.Add(reader.GetString(0)); return Ok(items);
    }

    [Authorize(Roles = "ADMINISTRATEUR,ANALYSTE"), HttpGet("configuration/tables")]
    public async Task<IActionResult> Tables([FromQuery] string baseDonnees, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(baseDonnees) || !await DatabaseIsAccessible(baseDonnees, ct)) return BadRequest(new { message = "Base non autorisée ou inaccessible." });
        return Ok(await CompatibleTables(baseDonnees, ct));
    }

    [Authorize(Roles = "ADMINISTRATEUR,ANALYSTE"), HttpPost("configuration")]
    public async Task<IActionResult> Configure(ConfigurerSourceRequest request, CancellationToken ct)
    {
        if (!await DatabaseIsAccessible(request.BaseDonnees, ct)) return BadRequest(new { message = "Base non autorisée ou inaccessible." });
        var selected = (await CompatibleTables(request.BaseDonnees, ct)).SingleOrDefault(x => x.Schema.Equals(request.Schema, StringComparison.OrdinalIgnoreCase) && x.Table.Equals(request.Table, StringComparison.OrdinalIgnoreCase));
        if (selected is null) return BadRequest(new { message = "Seule une table de suivi ETL compatible peut être enregistrée." });
        var server = new SqlConnectionStringBuilder(ConnectionString).DataSource; var table = $"[{selected.Schema}].[{selected.Table}]";
        var source = await db.Connexions.SingleOrDefaultAsync(x => x.NomServeur == server && x.NomBase == request.BaseDonnees && x.NomTableMonitoring == table, ct);
        if (source is null) { source = new Connexion { NomConnexion = string.IsNullOrWhiteSpace(request.NomConnexion) ? $"{request.BaseDonnees} — {selected.Table}" : request.NomConnexion.Trim(), TypeConnexion = "SQL Server — lecture seule", NomServeur = server, NomBase = request.BaseDonnees, NomTableMonitoring = table, Actif = true }; db.Connexions.Add(source); await db.SaveChangesAsync(ct); }
        return Ok(new { source.IdConnexion, source.NomConnexion, source.NomServeur, source.NomBase, source.NomTableMonitoring, message = "Table de suivi ETL configurée avec succès." });
    }

    private SqlConnection CreateConnection(string database) { var builder = new SqlConnectionStringBuilder(ConnectionString) { InitialCatalog = database, ApplicationName = "Monitoring BCC - Lecture seule" }; return new SqlConnection(builder.ConnectionString); }
    private async Task<bool> DatabaseIsAccessible(string database, CancellationToken ct) { await using var connection = CreateConnection("master"); await connection.OpenAsync(ct); await using var command = connection.CreateCommand(); command.CommandText = "SELECT COUNT(1) FROM sys.databases WHERE [name]=@database AND [state]=0 AND HAS_DBACCESS([name])=1"; command.Parameters.AddWithValue("@database", database); return Convert.ToInt32(await command.ExecuteScalarAsync(ct)) == 1; }
    private async Task<List<TableCompatible>> CompatibleTables(string database, CancellationToken ct)
    {
        await using var connection = CreateConnection(database); await connection.OpenAsync(ct); await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT s.[name],t.[name] FROM sys.tables t INNER JOIN sys.schemas s ON s.schema_id=t.schema_id
            WHERE EXISTS(SELECT 1 FROM sys.columns c JOIN sys.types ty ON ty.user_type_id=c.user_type_id WHERE c.object_id=t.object_id AND c.[name]='DateHeureETL' AND ty.[name] IN('date','datetime','datetime2','smalldatetime'))
              AND EXISTS(SELECT 1 FROM sys.columns c JOIN sys.types ty ON ty.user_type_id=c.user_type_id WHERE c.object_id=t.object_id AND c.[name]='Staging' AND ty.[name]='bit')
              AND EXISTS(SELECT 1 FROM sys.columns c JOIN sys.types ty ON ty.user_type_id=c.user_type_id WHERE c.object_id=t.object_id AND c.[name]='Entrepot' AND ty.[name]='bit')
            ORDER BY s.[name],t.[name]
            """;
        var items = new List<TableCompatible>(); await using var reader = await command.ExecuteReaderAsync(ct); while (await reader.ReadAsync(ct)) items.Add(new(reader.GetString(0), reader.GetString(1), "DateHeureETL, Staging, Entrepot")); return items;
    }
}
