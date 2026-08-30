using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;
using MonitoringETL.Api.Models;

namespace MonitoringETL.Api.Controllers;

public sealed record UpdatePreferencesRequest(JsonElement? General, JsonElement? Notifications, bool? TwoFactorEnabled);

[Authorize, ApiController, Route("api/preferences")]
public sealed class PreferencesController(UserManager<ApplicationUser> users, MonitoringDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var preference = await db.UserPreferences.AsNoTracking().SingleOrDefaultAsync(x => x.IdUtilisateur == user.Id, ct);
        return Ok(new
        {
            general = ParseOrEmpty(preference?.GeneralJson),
            notifications = ParseOrEmpty(preference?.NotificationsJson),
            twoFactorEnabled = user.TwoFactorEnabled
        });
    }

    [HttpPut]
    public async Task<IActionResult> Update(UpdatePreferencesRequest request, CancellationToken ct)
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        if (request.TwoFactorEnabled is not null)
            return BadRequest(new { message = "L’authentification à deux facteurs n’est pas encore configurée pour cette plateforme." });
        if (request.General is { } general && general.GetRawText().Length > 10000 || request.Notifications is { } notifications && notifications.GetRawText().Length > 10000)
            return BadRequest(new { message = "Les préférences sont trop volumineuses." });

        var preference = await db.UserPreferences.SingleOrDefaultAsync(x => x.IdUtilisateur == user.Id, ct);
        if (preference is null)
        {
            preference = new UserPreference { IdUtilisateur = user.Id };
            db.UserPreferences.Add(preference);
        }
        if (request.General is { } nextGeneral) preference.GeneralJson = nextGeneral.GetRawText();
        if (request.Notifications is { } nextNotifications) preference.NotificationsJson = nextNotifications.GetRawText();
        preference.DateModification = DateTime.UtcNow;
        db.JournauxAudit.Add(new JournalAudit { IdUtilisateur = user.Id, Action = "MODIFICATION_PREFERENCES", AdresseIP = HttpContext.Connection.RemoteIpAddress?.ToString(), Details = "Préférences utilisateur mises à jour." });
        await db.SaveChangesAsync(ct);
        return Ok(new { message = "Préférences enregistrées.", preference.DateModification, twoFactorEnabled = user.TwoFactorEnabled });
    }

    private static JsonElement ParseOrEmpty(string? json)
    {
        using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
        return document.RootElement.Clone();
    }
}
