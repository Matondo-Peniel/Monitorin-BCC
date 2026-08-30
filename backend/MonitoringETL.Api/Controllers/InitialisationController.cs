using System.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;
using MonitoringETL.Api.Models;
namespace MonitoringETL.Api.Controllers;

public sealed record CreerPremierAdministrateur(string NomComplet,string Email,string MotDePasse);

[ApiController,Route("api/initialisation")]
public sealed class InitialisationController(UserManager<ApplicationUser> users,MonitoringDbContext db):ControllerBase{
 [HttpGet("statut")]public async Task<IActionResult> Status()=>Ok(new{initialisationRequise=(await users.GetUsersInRoleAsync("ADMINISTRATEUR")).Count==0});

 [HttpPost("premier-administrateur")]
 public async Task<IActionResult> CreateFirstAdmin(CreerPremierAdministrateur request,CancellationToken ct){
  if(string.IsNullOrWhiteSpace(request.NomComplet)||string.IsNullOrWhiteSpace(request.Email)||string.IsNullOrWhiteSpace(request.MotDePasse))return BadRequest("Nom, email et mot de passe sont obligatoires.");
  await using var transaction=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
  if((await users.GetUsersInRoleAsync("ADMINISTRATEUR")).Count>0)return Conflict(new{message="L’initialisation est déjà fermée."});
  var user=new ApplicationUser{Id=Guid.NewGuid(),NomComplet=request.NomComplet.Trim(),Email=request.Email.Trim(),UserName=request.Email.Trim(),EmailConfirmed=true,Actif=true,DateCreation=DateTime.UtcNow};
  var created=await users.CreateAsync(user,request.MotDePasse);
  if(!created.Succeeded){await transaction.RollbackAsync(ct);return ValidationProblem(new ValidationProblemDetails(created.Errors.GroupBy(x=>x.Code).ToDictionary(x=>x.Key,x=>x.Select(e=>e.Description).ToArray())));}
  var roleResult=await users.AddToRoleAsync(user,"ADMINISTRATEUR");
  if(!roleResult.Succeeded){await transaction.RollbackAsync(ct);return StatusCode(500,new{message="Impossible d’attribuer le rôle administrateur."});}
  db.JournauxAudit.Add(new JournalAudit{IdUtilisateur=user.Id,Action="CREATION_PREMIER_ADMINISTRATEUR",DateHeure=DateTime.UtcNow,AdresseIP=HttpContext.Connection.RemoteIpAddress?.ToString(),Details="Initialisation sécurisée de la plateforme."});
  await db.SaveChangesAsync(ct);await transaction.CommitAsync(ct);
  return StatusCode(StatusCodes.Status201Created,new{user.Id,user.NomComplet,user.Email,role="ADMINISTRATEUR"});
 }
}
