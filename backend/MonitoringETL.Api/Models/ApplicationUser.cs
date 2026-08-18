using Microsoft.AspNetCore.Identity;
namespace MonitoringETL.Api.Models;
public sealed class ApplicationUser : IdentityUser<Guid>{public required string NomComplet{get;set;}public bool Actif{get;set;}public string? PhotoProfil{get;set;}public DateTime DateCreation{get;set;}=DateTime.UtcNow;public DateTime? DerniereConnexion{get;set;}public ICollection<Invitation> Invitations{get;set;}=[];public ICollection<JournalAudit> JournauxAudit{get;set;}=[];}
