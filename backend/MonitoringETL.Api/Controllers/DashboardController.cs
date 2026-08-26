using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;

namespace MonitoringETL.Api.Controllers;

[Authorize, ApiController, Route("api/dashboard")]
public sealed class DashboardController(MonitoringDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] DateOnly? date, [FromQuery] string? jours, CancellationToken ct)
    {
        var today = date?.ToDateTime(TimeOnly.MinValue) ?? DateTime.Today;
        var tomorrow = today.AddDays(1);
        var periodLength = int.TryParse(jours, out var requestedDays) ? Math.Clamp(requestedDays, 1, 3650) : 7;
        var start = today.AddDays(-(periodLength - 1));
        if (string.Equals(jours, "all", StringComparison.OrdinalIgnoreCase))
        {
            var firstExecution = await db.SuiviChargements.AsNoTracking()
                .Where(x => x.DateHeureETL < tomorrow)
                .MinAsync(x => (DateTime?)x.DateHeureETL, ct);
            start = firstExecution?.Date ?? today;
            if (start < today.AddDays(-3649)) start = today.AddDays(-3649);
            periodLength = (today - start).Days + 1;
        }

        var sources = await db.Connexions.AsNoTracking()
            .Where(x => x.Actif)
            .OrderBy(x => x.NomConnexion)
            .Select(x => new
            {
                x.IdConnexion,
                x.NomConnexion,
                latest = x.Chargements.Where(c => c.DateHeureETL >= today && c.DateHeureETL < tomorrow).OrderByDescending(c => c.DateHeureETL)
                    .Select(c => new { c.Id, c.DateHeureETL, c.Staging, c.Entrepot })
                    .FirstOrDefault()
            }).ToListAsync(ct);

        var todayRows = await db.SuiviChargements.AsNoTracking()
            .Where(x => x.DateHeureETL >= today && x.DateHeureETL < tomorrow)
            .Select(x => new { x.Staging, x.Entrepot })
            .ToListAsync(ct);

        var history = await db.SuiviChargements.AsNoTracking()
            .Where(x => x.DateHeureETL >= start && x.DateHeureETL < tomorrow)
            .GroupBy(x => x.DateHeureETL.Date)
            .Select(g => new
            {
                date = g.Key,
                total = g.Count(),
                staging = g.Count(x => x.Staging),
                entrepot = g.Count(x => x.Entrepot)
            }).ToListAsync(ct);

        var evolution = Enumerable.Range(0, periodLength).Select(offset =>
        {
            var date = start.AddDays(offset);
            var day = history.FirstOrDefault(x => x.date == date);
            return new
            {
                date,
                tauxStaging = day is null || day.total == 0 ? 0 : Math.Round(day.staging * 100m / day.total, 2),
                tauxEntrepot = day is null || day.total == 0 ? 0 : Math.Round(day.entrepot * 100m / day.total, 2)
            };
        });

        var alerts = await db.Alertes.AsNoTracking()
            .OrderByDescending(x => x.DateHeureAlerte)
            .Take(3)
            .Select(x => new { x.IdAlerte, x.DateHeureAlerte, x.Niveau, x.Etape, x.Message, x.Statut })
            .ToListAsync(ct);

        var total = todayRows.Count;
        var staging = todayRows.Count(x => x.Staging);
        var warehouse = todayRows.Count(x => x.Entrepot);
        return Ok(new
        {
            generatedAt = DateTime.Now,
            sources,
            metrics = new
            {
                activeSources = sources.Count,
                loadedSources = sources.Count(x => x.latest is not null),
                total,
                stagingSuccess = staging,
                stagingFailed = total - staging,
                warehouseSuccess = warehouse,
                warehouseFailed = total - warehouse,
                stagingRate = total == 0 ? 0 : Math.Round(staging * 100m / total, 2),
                warehouseRate = total == 0 ? 0 : Math.Round(warehouse * 100m / total, 2),
                globalRate = total == 0 ? 0 : Math.Round(todayRows.Count(x => x.Staging && x.Entrepot) * 100m / total, 2)
            },
            evolution,
            alerts
        });
    }
}
