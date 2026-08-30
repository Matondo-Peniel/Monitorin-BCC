using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;
using MonitoringETL.Api.Models;

namespace MonitoringETL.Api.Controllers;

[Authorize, ApiController, Route("api/profil")]
public sealed class ProfilController(UserManager<ApplicationUser> users, MonitoringDbContext db, IWebHostEnvironment environment, IConfiguration configuration) : ControllerBase
{
    private const long MaximumPhotoSize = 2 * 1024 * 1024;
    private static readonly string[] BasePermissions = ["Tableau de bord", "Suivi des chargements", "Flux ETL", "Sources", "Historique", "Alertes", "Rapports", "Paramètres"];
    private static readonly string[] AdministratorPermissions = ["Gestion des utilisateurs", "Résolution des alertes"];

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var user = await users.GetUserAsync(User);
        return user is null ? Unauthorized() : Ok(await BuildProfile(user, ct));
    }

    [HttpPost("photo")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaximumPhotoSize)]
    public async Task<IActionResult> UploadPhoto([FromForm] IFormFile? photo, CancellationToken ct)
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        if (photo is null || photo.Length == 0) return BadRequest(new { message = "Sélectionnez une image valide." });
        if (photo.Length > MaximumPhotoSize) return BadRequest(new { message = "La photo ne doit pas dépasser 2 Mo." });

        var mediaType = photo.ContentType?.ToLowerInvariant() ?? string.Empty;
        var extension = mediaType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => null,
        };
        if (extension is null || !await HasValidImageSignature(photo, mediaType, ct))
            return BadRequest(new { message = "Le fichier doit être une image JPG, PNG ou WebP valide." });

        var directory = Path.Combine(PhotoStorageRoot(), user.Id.ToString("N"));
        Directory.CreateDirectory(directory);
        var filename = $"{Guid.NewGuid():N}{extension}";
        var destination = Path.Combine(directory, filename);
        await using (var output = System.IO.File.Create(destination))
            await photo.CopyToAsync(output, ct);

        DeletePreviousPhoto(user);
        user.PhotoProfil = $"/uploads/profiles/{user.Id:N}/{filename}";
        db.JournauxAudit.Add(new JournalAudit
        {
            IdUtilisateur = user.Id,
            Action = "MODIFICATION_PHOTO_PROFIL",
            AdresseIP = HttpContext.Connection.RemoteIpAddress?.ToString(),
            Details = "Photo de profil mise à jour.",
        });
        await db.SaveChangesAsync(ct);
        return Ok(await BuildProfile(user, ct));
    }

    private async Task<object> BuildProfile(ApplicationUser user, CancellationToken ct)
    {
        var roles = await users.GetRolesAsync(user);
        var isAdministrator = roles.Contains("ADMINISTRATEUR", StringComparer.OrdinalIgnoreCase);
        var activities = await db.JournauxAudit.AsNoTracking()
            .Where(entry => entry.IdUtilisateur == user.Id)
            .OrderByDescending(entry => entry.DateHeure)
            .Take(8)
            .Select(entry => new { entry.IdJournal, entry.Action, entry.DateHeure, entry.Details })
            .ToListAsync(ct);
        return new
        {
            user.Id,
            user.NomComplet,
            user.Email,
            identifiant = user.UserName,
            user.PhotoProfil,
            user.Actif,
            user.DateCreation,
            user.DerniereConnexion,
            roles,
            permissions = isAdministrator ? BasePermissions.Concat(AdministratorPermissions) : BasePermissions,
            activites = activities,
            sessionsSupported = false,
            sessions = Array.Empty<object>(),
        };
    }

    private string PhotoStorageRoot()
    {
        var configured = configuration["ProfileStorage:Path"];
        return string.IsNullOrWhiteSpace(configured)
            ? Path.Combine(environment.ContentRootPath, "App_Data", "profiles")
            : Path.IsPathRooted(configured) ? configured : Path.Combine(environment.ContentRootPath, configured);
    }

    private void DeletePreviousPhoto(ApplicationUser user)
    {
        if (string.IsNullOrWhiteSpace(user.PhotoProfil)) return;
        var filename = Path.GetFileName(user.PhotoProfil);
        if (string.IsNullOrWhiteSpace(filename)) return;
        var path = Path.Combine(PhotoStorageRoot(), user.Id.ToString("N"), filename);
        if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
    }

    private static async Task<bool> HasValidImageSignature(IFormFile photo, string mediaType, CancellationToken ct)
    {
        var buffer = new byte[12];
        await using var stream = photo.OpenReadStream();
        var count = await stream.ReadAsync(buffer.AsMemory(0, buffer.Length), ct);
        return mediaType switch
        {
            "image/jpeg" => count >= 3 && buffer[0] == 0xff && buffer[1] == 0xd8 && buffer[2] == 0xff,
            "image/png" => count >= 8 && buffer.Take(8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a }),
            "image/webp" => count >= 12 && buffer.Take(4).SequenceEqual("RIFF"u8.ToArray()) && buffer.Skip(8).Take(4).SequenceEqual("WEBP"u8.ToArray()),
            _ => false,
        };
    }
}
