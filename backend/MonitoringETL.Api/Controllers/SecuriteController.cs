using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;
using MonitoringETL.Api.Models;

namespace MonitoringETL.Api.Controllers;

[Authorize, ApiController, Route("api/securite")]
public sealed class SecuriteController(UserManager<ApplicationUser> users, MonitoringDbContext db) : ControllerBase
{
    [HttpGet("session-courante")]
    public async Task<IActionResult> CurrentSession()
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        return Ok(new
        {
            user.Id,
            user.Email,
            adresseIp = HttpContext.Connection.RemoteIpAddress?.ToString(),
            navigateur = Request.Headers.UserAgent.ToString(),
            authentification = User.Identity?.AuthenticationType,
            expirationHeures = 8,
            courante = true,
        });
    }

    [Authorize(Roles = "ADMINISTRATEUR,ANALYSTE"), HttpGet("audit")]
    public async Task<IActionResult> Audit([FromQuery] int limite = 100, CancellationToken ct = default)
    {
        limite = Math.Clamp(limite, 1, 500);
        var entries = await db.JournauxAudit.AsNoTracking()
            .OrderByDescending(entry => entry.DateHeure)
            .Take(limite)
            .Select(entry => new
            {
                entry.IdJournal,
                entry.Action,
                entry.DateHeure,
                entry.AdresseIP,
                entry.Details,
                utilisateur = entry.Utilisateur == null ? null : entry.Utilisateur.NomComplet,
                email = entry.Utilisateur == null ? null : entry.Utilisateur.Email,
            })
            .ToListAsync(ct);
        return Ok(entries);
    }
}
