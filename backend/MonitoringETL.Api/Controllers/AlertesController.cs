using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;
namespace MonitoringETL.Api.Controllers;

[ApiController,Route("api/alertes")]
public sealed class AlertesController(MonitoringDbContext db):ControllerBase{
 [HttpGet]public async Task<IActionResult> List([FromQuery]string? statut,[FromQuery]string? niveau,CancellationToken ct){var q=db.Alertes.AsNoTracking().AsQueryable();if(!string.IsNullOrWhiteSpace(statut))q=q.Where(x=>x.Statut==statut);if(!string.IsNullOrWhiteSpace(niveau))q=q.Where(x=>x.Niveau==niveau);return Ok(await q.OrderByDescending(x=>x.DateHeureAlerte).Select(x=>new{x.IdAlerte,x.IdChargement,x.DateHeureAlerte,x.Niveau,x.Etape,x.Message,x.Statut,x.DateResolution}).Take(100).ToListAsync(ct));}
}
