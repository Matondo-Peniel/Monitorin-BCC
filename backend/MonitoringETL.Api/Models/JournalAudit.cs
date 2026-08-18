namespace MonitoringETL.Api.Models;
public sealed class JournalAudit{public long IdJournal{get;set;}public Guid? IdUtilisateur{get;set;}public required string Action{get;set;}public DateTime DateHeure{get;set;}=DateTime.UtcNow;public string? AdresseIP{get;set;}public string? Details{get;set;}public ApplicationUser? Utilisateur{get;set;}}
