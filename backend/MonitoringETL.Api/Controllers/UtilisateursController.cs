using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;
using MonitoringETL.Api.Models;
namespace MonitoringETL.Api.Controllers;

public sealed record InvitationRequest(string NomComplet,string Email,string Role="CONSULTANT");
[Authorize(Roles="ADMINISTRATEUR"),ApiController,Route("api/utilisateurs")]
public sealed class UtilisateursController(UserManager<ApplicationUser> users,MonitoringDbContext db,IWebHostEnvironment environment):ControllerBase{
 [HttpGet]public async Task<IActionResult> List(CancellationToken ct){var rows=await users.Users.AsNoTracking().OrderBy(x=>x.NomComplet).ToListAsync(ct);var result=new List<object>();foreach(var user in rows)result.Add(new{user.Id,user.NomComplet,user.Email,user.Actif,user.DateCreation,user.DerniereConnexion,roles=await users.GetRolesAsync(user)});return Ok(result);}
 [HttpPost("inviter")]public async Task<IActionResult> Invite(InvitationRequest request,CancellationToken ct){var role=request.Role.ToUpperInvariant();if(role is not("ADMINISTRATEUR" or "CONSULTANT"))return BadRequest(new{message="Rôle invalide."});if(await users.FindByEmailAsync(request.Email.Trim()) is not null)return Conflict(new{message="Cette adresse est déjà utilisée."});var user=new ApplicationUser{Id=Guid.NewGuid(),NomComplet=request.NomComplet.Trim(),Email=request.Email.Trim(),UserName=request.Email.Trim(),EmailConfirmed=true,Actif=false};var temporary=$"Tmp!{Guid.NewGuid():N}aA1";var created=await users.CreateAsync(user,temporary);if(!created.Succeeded)return ValidationProblem(new ValidationProblemDetails(created.Errors.GroupBy(x=>x.Code).ToDictionary(x=>x.Key,x=>x.Select(e=>e.Description).ToArray())));await users.AddToRoleAsync(user,role);var token=await users.GeneratePasswordResetTokenAsync(user);var hash=Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(token)));db.Invitations.Add(new Invitation{IdUtilisateur=user.Id,TokenHash=hash,DateExpiration=DateTime.UtcNow.AddHours(24)});db.JournauxAudit.Add(new JournalAudit{IdUtilisateur=UserId(),Action="INVITATION_UTILISATEUR",Details=$"Invitation créée pour l’utilisateur {user.Id}."});await db.SaveChangesAsync(ct);return StatusCode(201,new{user.Id,user.NomComplet,user.Email,role,expiration=DateTime.UtcNow.AddHours(24),token=environment.IsDevelopment()?token:null});}
 [HttpPatch("{id:guid}/actif")]public async Task<IActionResult> SetActive(Guid id,[FromBody]bool actif,CancellationToken ct){var user=await users.FindByIdAsync(id.ToString());if(user is null)return NotFound();user.Actif=actif;await users.UpdateAsync(user);db.JournauxAudit.Add(new JournalAudit{IdUtilisateur=UserId(),Action=actif?"ACTIVATION_UTILISATEUR":"DESACTIVATION_UTILISATEUR",Details=$"Utilisateur concerné : {id}."});await db.SaveChangesAsync(ct);return NoContent();}
 private Guid? UserId()=>Guid.TryParse(users.GetUserId(User),out var id)?id:null;
}
