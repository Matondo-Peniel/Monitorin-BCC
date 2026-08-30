namespace MonitoringETL.Api.Models;
public sealed class Invitation{public Guid IdInvitation{get;set;}=Guid.NewGuid();public Guid IdUtilisateur{get;set;}public required string TokenHash{get;set;}public DateTime DateExpiration{get;set;}public DateTime? DateUtilisation{get;set;}public DateTime DateCreation{get;set;}=DateTime.UtcNow;public ApplicationUser Utilisateur{get;set;}=null!;}
