using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Data;
using MonitoringETL.Api.Models;
namespace MonitoringETL.Api.Controllers;

public sealed record LoginRequest(string Email,string MotDePasse,bool SeSouvenir=false);
public sealed record ForgotPasswordRequest(string Email);
public sealed record ResetPasswordRequest(string Email,string Token,string NouveauMotDePasse);

[ApiController,Route("api/auth")]
public sealed class AuthController(UserManager<ApplicationUser> users,SignInManager<ApplicationUser> signIn,MonitoringDbContext db,IWebHostEnvironment environment):ControllerBase{
 [AllowAnonymous,HttpPost("connexion")]
 public async Task<IActionResult> Login(LoginRequest request,CancellationToken ct){var user=await users.FindByEmailAsync(request.Email.Trim());if(user is null||!user.Actif)return Unauthorized(new{message="Identifiants incorrects."});var result=await signIn.PasswordSignInAsync(user,request.MotDePasse,request.SeSouvenir,lockoutOnFailure:true);if(!result.Succeeded)return Unauthorized(new{message=result.IsLockedOut?"Compte temporairement verrouillé.":"Identifiants incorrects."});user.DerniereConnexion=DateTime.UtcNow;db.JournauxAudit.Add(new JournalAudit{IdUtilisateur=user.Id,Action="CONNEXION",AdresseIP=HttpContext.Connection.RemoteIpAddress?.ToString(),Details="Connexion réussie."});await db.SaveChangesAsync(ct);return Ok(await UserInfo(user));}
 [Authorize,HttpPost("deconnexion")]public async Task<IActionResult> Logout(CancellationToken ct){var user=await users.GetUserAsync(User);if(user is not null){db.JournauxAudit.Add(new JournalAudit{IdUtilisateur=user.Id,Action="DECONNEXION",AdresseIP=HttpContext.Connection.RemoteIpAddress?.ToString(),Details="Déconnexion utilisateur."});await db.SaveChangesAsync(ct);}await signIn.SignOutAsync();return NoContent();}
 [Authorize,HttpGet("moi")]public async Task<IActionResult> Me(){var user=await users.GetUserAsync(User);return user is null?Unauthorized():Ok(await UserInfo(user));}
 [AllowAnonymous,HttpPost("mot-de-passe-oublie")]public async Task<IActionResult> Forgot(ForgotPasswordRequest request){var user=await users.FindByEmailAsync(request.Email.Trim());if(user is null)return Ok(new{message="Si le compte existe, une procédure de réinitialisation a été créée.",token=(string?)null});var token=await users.GeneratePasswordResetTokenAsync(user);return Ok(environment.IsDevelopment()?new{message="Jeton de développement généré.",token=(string?)token}:new{message="Si le compte existe, une procédure de réinitialisation a été créée.",token=(string?)null});}
 [AllowAnonymous,HttpPost("reinitialiser-mot-de-passe")]public async Task<IActionResult> Reset(ResetPasswordRequest request){var user=await users.FindByEmailAsync(request.Email.Trim());if(user is null)return BadRequest(new{message="Demande invalide."});var result=await users.ResetPasswordAsync(user,request.Token,request.NouveauMotDePasse);if(!result.Succeeded)return ValidationProblem(new ValidationProblemDetails(result.Errors.GroupBy(x=>x.Code).ToDictionary(x=>x.Key,x=>x.Select(e=>e.Description).ToArray())));user.Actif=true;await users.UpdateAsync(user);return Ok(new{message="Mot de passe réinitialisé."});}
 private async Task<object> UserInfo(ApplicationUser user)=>new{user.Id,user.NomComplet,user.Email,user.PhotoProfil,user.Actif,roles=await users.GetRolesAsync(user)};
}
