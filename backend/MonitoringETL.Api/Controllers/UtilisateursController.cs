using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;
using MonitoringETL.Api.Models;

namespace MonitoringETL.Api.Controllers;

public sealed record InvitationRequest(string NomComplet, string Email, string Role = "CONSULTANT");
public sealed record UpdateUserRequest(string NomComplet, string Email, string Role);

[Authorize(Roles = "ADMINISTRATEUR"), ApiController, Route("api/utilisateurs")]
public sealed class UtilisateursController(
    UserManager<ApplicationUser> users,
    RoleManager<IdentityRole<Guid>> roles,
    MonitoringDbContext db,
    IWebHostEnvironment environment) : ControllerBase
{
    private static readonly HashSet<string> ManagedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "ADMINISTRATEUR", "ANALYSTE", "CONSULTANT",
    };

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var rows = await users.Users.AsNoTracking().OrderBy(user => user.NomComplet).ToListAsync(ct);
        var result = new List<object>();
        foreach (var user in rows)
            result.Add(await UserResponse(user));
        return Ok(result);
    }

    [HttpPost("inviter")]
    public async Task<IActionResult> Invite(InvitationRequest request, CancellationToken ct)
    {
        var role = NormalizeRole(request.Role);
        if (role is null || string.IsNullOrWhiteSpace(request.NomComplet) || !IsValidEmail(request.Email))
            return BadRequest(new { message = "Les informations de l’invitation sont invalides." });
        if (await users.FindByEmailAsync(request.Email.Trim()) is not null)
            return Conflict(new { message = "Cette adresse est déjà utilisée." });

        var ensuredRole = await EnsureRole(role);
        if (!ensuredRole.Succeeded)
            return ValidationProblem(IdentityErrors(ensuredRole));

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            NomComplet = request.NomComplet.Trim(),
            Email = request.Email.Trim(),
            UserName = request.Email.Trim(),
            EmailConfirmed = true,
            Actif = false,
        };
        var temporaryPassword = $"Tmp!{Guid.NewGuid():N}aA1";
        var created = await users.CreateAsync(user, temporaryPassword);
        if (!created.Succeeded)
            return ValidationProblem(IdentityErrors(created));

        var roleAdded = await users.AddToRoleAsync(user, role);
        if (!roleAdded.Succeeded)
        {
            await users.DeleteAsync(user);
            return ValidationProblem(IdentityErrors(roleAdded));
        }

        var token = RandomNumberGenerator.GetInt32(10000000, 100000000).ToString();
        var hash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
        db.Invitations.Add(new Invitation
        {
            IdUtilisateur = user.Id,
            TokenHash = hash,
            DateExpiration = DateTime.UtcNow.AddHours(24),
        });
        AddAudit("INVITATION_UTILISATEUR", $"Invitation créée pour l’utilisateur {user.Id}.");
        await db.SaveChangesAsync(ct);

        return StatusCode(StatusCodes.Status201Created, new
        {
            user.Id,
            user.NomComplet,
            user.Email,
            role,
            expiration = DateTime.UtcNow.AddHours(24),
            token = environment.IsDevelopment() ? token : null,
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateUserRequest request, CancellationToken ct)
    {
        var role = NormalizeRole(request.Role);
        if (role is null || string.IsNullOrWhiteSpace(request.NomComplet) || !IsValidEmail(request.Email))
            return BadRequest(new { message = "Le nom, l’adresse email et le rôle sont obligatoires." });

        var user = await users.FindByIdAsync(id.ToString());
        if (user is null)
            return NotFound(new { message = "Utilisateur introuvable." });

        var currentRoles = await users.GetRolesAsync(user);
        if (await WouldRemoveLastActiveAdministrator(user, currentRoles, role, user.Actif))
            return BadRequest(new { message = "La plateforme doit toujours conserver un administrateur actif." });

        var email = request.Email.Trim();
        var sameEmail = string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase);
        if (!sameEmail)
        {
            var existing = await users.FindByEmailAsync(email);
            if (existing is not null && existing.Id != user.Id)
                return Conflict(new { message = "Cette adresse est déjà utilisée." });
        }

        var ensuredRole = await EnsureRole(role);
        if (!ensuredRole.Succeeded)
            return ValidationProblem(IdentityErrors(ensuredRole));

        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        user.NomComplet = request.NomComplet.Trim();
        user.Email = email;
        user.UserName = email;
        var updated = await users.UpdateAsync(user);
        if (!updated.Succeeded)
            return ValidationProblem(IdentityErrors(updated));

        var rolesToRemove = currentRoles.Where(currentRole => !string.Equals(currentRole, role, StringComparison.OrdinalIgnoreCase)).ToArray();
        if (rolesToRemove.Length > 0)
        {
            var removed = await users.RemoveFromRolesAsync(user, rolesToRemove);
            if (!removed.Succeeded)
                return ValidationProblem(IdentityErrors(removed));
        }
        if (!currentRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
        {
            var added = await users.AddToRoleAsync(user, role);
            if (!added.Succeeded)
                return ValidationProblem(IdentityErrors(added));
        }

        AddAudit("MODIFICATION_UTILISATEUR", $"Informations de l’utilisateur {id} mises à jour.");
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Ok(await UserResponse(user));
    }

    [HttpPatch("{id:guid}/actif")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] bool actif, CancellationToken ct)
    {
        var user = await users.FindByIdAsync(id.ToString());
        if (user is null)
            return NotFound(new { message = "Utilisateur introuvable." });

        var userRoles = await users.GetRolesAsync(user);
        if (await WouldRemoveLastActiveAdministrator(user, userRoles, userRoles.FirstOrDefault() ?? "CONSULTANT", actif))
            return BadRequest(new { message = "La plateforme doit toujours conserver un administrateur actif." });

        user.Actif = actif;
        var result = await users.UpdateAsync(user);
        if (!result.Succeeded)
            return ValidationProblem(IdentityErrors(result));

        AddAudit(actif ? "ACTIVATION_UTILISATEUR" : "DESACTIVATION_UTILISATEUR", $"Utilisateur concerné : {id}.");
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var user = await users.FindByIdAsync(id.ToString());
        if (user is null)
            return NotFound(new { message = "Utilisateur introuvable." });

        var displayName = user.NomComplet;
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var result = await users.DeleteAsync(user);
        if (!result.Succeeded)
            return ValidationProblem(IdentityErrors(result));

        db.JournauxAudit.Add(new JournalAudit
        {
            IdUtilisateur = null,
            Action = "SUPPRESSION_UTILISATEUR",
            DateHeure = DateTime.UtcNow,
            AdresseIP = HttpContext.Connection.RemoteIpAddress?.ToString(),
            Details = $"Compte supprimé : {displayName} ({id}).",
        });
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return NoContent();
    }

    private async Task<object> UserResponse(ApplicationUser user) => new
    {
        user.Id,
        user.NomComplet,
        user.Email,
        user.Actif,
        user.DateCreation,
        user.DerniereConnexion,
        roles = await users.GetRolesAsync(user),
    };

    private async Task<bool> WouldRemoveLastActiveAdministrator(ApplicationUser user, IEnumerable<string> currentRoles, string nextRole, bool nextActive)
    {
        var isAdministrator = currentRoles.Contains("ADMINISTRATEUR", StringComparer.OrdinalIgnoreCase);
        if (!isAdministrator || !user.Actif || (nextActive && string.Equals(nextRole, "ADMINISTRATEUR", StringComparison.OrdinalIgnoreCase)))
            return false;

        var administrators = await users.GetUsersInRoleAsync("ADMINISTRATEUR");
        return !administrators.Any(administrator => administrator.Id != user.Id && administrator.Actif);
    }

    private async Task<IdentityResult> EnsureRole(string role)
    {
        if (await roles.RoleExistsAsync(role))
            return IdentityResult.Success;
        return await roles.CreateAsync(new IdentityRole<Guid>
        {
            Id = Guid.NewGuid(),
            Name = role,
            NormalizedName = role,
        });
    }

    private void AddAudit(string action, string details) => db.JournauxAudit.Add(new JournalAudit
    {
        IdUtilisateur = UserId(),
        Action = action,
        DateHeure = DateTime.UtcNow,
        AdresseIP = HttpContext.Connection.RemoteIpAddress?.ToString(),
        Details = details,
    });

    private Guid? UserId() => Guid.TryParse(users.GetUserId(User), out var id) ? id : null;
    private static string? NormalizeRole(string? role) => ManagedRoles.Contains(role?.Trim() ?? string.Empty) ? role!.Trim().ToUpperInvariant() : null;
    private static bool IsValidEmail(string? email) => !string.IsNullOrWhiteSpace(email) && new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(email.Trim());
    private static ValidationProblemDetails IdentityErrors(IdentityResult result) => new(result.Errors.GroupBy(error => error.Code).ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray()));
}
