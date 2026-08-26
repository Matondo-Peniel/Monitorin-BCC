using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;
using MonitoringETL.Api.Models;

namespace MonitoringETL.Api.Controllers;

[Authorize, ApiController, Route("api/alertes")]
public sealed class AlertesController(MonitoringDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? statut, [FromQuery] string? niveau, CancellationToken ct)
    {
        var query = db.Alertes.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(statut)) query = query.Where(x => x.Statut == statut);
        if (!string.IsNullOrWhiteSpace(niveau)) query = query.Where(x => x.Niveau == niveau);
        return Ok(await query.OrderByDescending(x => x.DateHeureAlerte)
            .Select(x => new { x.IdAlerte, x.IdChargement, x.DateHeureAlerte, x.Niveau, x.Etape, x.Message, x.Statut, x.DateResolution })
            .Take(100).ToListAsync(ct));
    }

    [Authorize(Roles = "ADMINISTRATEUR")]
    [HttpPatch("{id:int}/resoudre")]
    public async Task<IActionResult> Resolve(int id, CancellationToken ct)
    {
        var alert = await db.Alertes.SingleOrDefaultAsync(x => x.IdAlerte == id, ct);
        if (alert is null) return NotFound(new { message = "Alerte introuvable." });
        if (alert.Statut == "RESOLUE") return Ok(new { message = "Cette alerte est déjà résolue.", alert.DateResolution });

        alert.Statut = "RESOLUE";
        alert.DateResolution = DateTime.UtcNow;
        var userId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var parsed) ? parsed : (Guid?)null;
        db.JournauxAudit.Add(new JournalAudit
        {
            IdUtilisateur = userId,
            Action = "RESOLUTION_ALERTE",
            AdresseIP = HttpContext.Connection.RemoteIpAddress?.ToString(),
            Details = $"Alerte résolue : {alert.IdAlerte}."
        });
        await db.SaveChangesAsync(ct);
        return Ok(new { message = "Alerte résolue.", alert.DateResolution });
    }
}
