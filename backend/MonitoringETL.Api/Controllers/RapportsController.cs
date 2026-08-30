using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;
using MonitoringETL.Api.Exports;

namespace MonitoringETL.Api.Controllers;

[Authorize, ApiController, Route("api/rapports")]
public sealed class RapportsController(MonitoringDbContext db) : ControllerBase
{
    [HttpGet("executions.csv")]
    public async Task<IActionResult> ExportExecutions([FromQuery] DateOnly? date, CancellationToken ct)
    {
        var selected = date?.ToDateTime(TimeOnly.MinValue) ?? DateTime.Today;
        var rows = await LoadRows(null, selected, selected.AddDays(1), ct);
        return CsvFile(BuildExecutionsRows(rows), $"rapport-monitoring-etl-{selected:yyyy-MM-dd}.csv");
    }

    [HttpGet("historique.csv")]
    public async Task<IActionResult> ExportHistory([FromQuery] int sourceId, [FromQuery] DateTime debut, [FromQuery] DateTime fin, CancellationToken ct)
    {
        if (sourceId <= 0 || fin <= debut) return BadRequest(new { message = "Période ou source invalide." });
        var rows = await LoadRows(sourceId, debut, fin, ct);
        var csvRows = new List<IEnumerable<string?>> { new[] { "Source", "Date", "Heure", "Staging", "Data Warehouse", "Statut global" } };
        csvRows.AddRange(rows.Select(row => new[] { row.Source, row.DateHeureETL.ToString("dd/MM/yyyy"), row.DateHeureETL.ToString("HH:mm:ss"), Step(row.Staging), Step(row.Entrepot), Status(row.Staging, row.Entrepot) }));
        return CsvFile(csvRows, $"historique-etl-{debut:yyyy-MM-dd}-{fin.AddDays(-1):yyyy-MM-dd}.csv");
    }

    private async Task<List<ExportRow>> LoadRows(int? sourceId, DateTime debut, DateTime fin, CancellationToken ct) => await db.SuiviChargements.AsNoTracking()
        .Where(x => (!sourceId.HasValue || x.IdConnexion == sourceId.Value) && x.DateHeureETL >= debut && x.DateHeureETL < fin)
        .OrderBy(x => x.DateHeureETL)
        .Select(x => new ExportRow(x.Connexion.NomConnexion, x.DateHeureETL, x.Staging, x.Entrepot))
        .ToListAsync(ct);

    private static List<IEnumerable<string?>> BuildExecutionsRows(IEnumerable<ExportRow> rows)
    {
        var csvRows = new List<IEnumerable<string?>> { new[] { "Source", "Date et heure", "Source vers Staging", "Staging vers Data Warehouse", "Statut global" } };
        csvRows.AddRange(rows.Select(row => new[] { row.Source, row.DateHeureETL.ToString("dd/MM/yyyy HH:mm:ss"), Step(row.Staging), Step(row.Entrepot), Status(row.Staging, row.Entrepot) }));
        return csvRows;
    }

    private FileContentResult CsvFile(IEnumerable<IEnumerable<string?>> rows, string fileName) => File(ExcelCsv.Create(rows), "text/csv; charset=utf-8", fileName);
    private static string Step(bool completed) => completed ? "Réussi" : "Échoué";
    private static string Status(bool staging, bool entrepot) => staging && entrepot ? "Réussi" : staging ? "Partiel" : "Échoué";
    private sealed record ExportRow(string Source, DateTime DateHeureETL, bool Staging, bool Entrepot);
}
