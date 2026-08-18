using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MonitoringETL.Api.Models;
namespace MonitoringETL.Api.Data;

public sealed class MonitoringDbContext(DbContextOptions<MonitoringDbContext> options):IdentityDbContext<ApplicationUser,IdentityRole<Guid>,Guid>(options){
 public DbSet<Connexion> Connexions=>Set<Connexion>();public DbSet<SuiviChargement> SuiviChargements=>Set<SuiviChargement>();public DbSet<Alerte> Alertes=>Set<Alerte>();public DbSet<Invitation> Invitations=>Set<Invitation>();public DbSet<JournalAudit> JournauxAudit=>Set<JournalAudit>();
 protected override void OnModelCreating(ModelBuilder b){base.OnModelCreating(b);
  b.Entity<IdentityRole<Guid>>().HasData(
   new IdentityRole<Guid>{Id=Guid.Parse("11111111-1111-1111-1111-111111111111"),Name="ADMINISTRATEUR",NormalizedName="ADMINISTRATEUR",ConcurrencyStamp="role-administrateur-v1"},
   new IdentityRole<Guid>{Id=Guid.Parse("22222222-2222-2222-2222-222222222222"),Name="CONSULTANT",NormalizedName="CONSULTANT",ConcurrencyStamp="role-consultant-v1"});
  b.Entity<ApplicationUser>(e=>{e.Property(x=>x.NomComplet).HasMaxLength(180);e.Property(x=>x.PhotoProfil).HasMaxLength(500);e.Property(x=>x.DateCreation).HasPrecision(0);});
  b.Entity<Connexion>(e=>{e.ToTable("Connexions");e.HasKey(x=>x.IdConnexion);e.Property(x=>x.NomConnexion).HasMaxLength(150);e.Property(x=>x.TypeConnexion).HasMaxLength(80);e.Property(x=>x.NomServeur).HasMaxLength(150);e.Property(x=>x.NomBase).HasMaxLength(150);e.Property(x=>x.NomTableMonitoring).HasMaxLength(200);e.Property(x=>x.DateCreation).HasPrecision(0);});
  b.Entity<SuiviChargement>(e=>{e.ToTable("SuiviChargement",t=>t.HasCheckConstraint("CK_SuiviChargement_OrdreEtapes","[Entrepot] = 0 OR [Staging] = 1"));e.HasKey(x=>x.Id);e.Property(x=>x.DateHeureETL).HasPrecision(0);e.Property(x=>x.DateCreation).HasPrecision(0);e.HasIndex(x=>x.DateHeureETL).HasDatabaseName("IX_SuiviChargement_DateHeureETL");e.HasIndex(x=>x.IdConnexion).HasDatabaseName("IX_SuiviChargement_IdConnexion");e.HasOne(x=>x.Connexion).WithMany(x=>x.Chargements).HasForeignKey(x=>x.IdConnexion).OnDelete(DeleteBehavior.Restrict);});
  b.Entity<Alerte>(e=>{e.ToTable("Alertes",t=>{t.HasCheckConstraint("CK_Alertes_Niveau","[Niveau] IN ('CRITIQUE','IMPORTANT','INFORMATIF')");t.HasCheckConstraint("CK_Alertes_Statut","[Statut] IN ('NON_RESOLUE','RESOLUE')");});e.HasKey(x=>x.IdAlerte);e.Property(x=>x.Niveau).HasMaxLength(20);e.Property(x=>x.Etape).HasMaxLength(40);e.Property(x=>x.Message).HasMaxLength(500);e.Property(x=>x.Statut).HasMaxLength(20);e.Property(x=>x.DateHeureAlerte).HasPrecision(0);e.Property(x=>x.DateResolution).HasPrecision(0);e.HasIndex(x=>x.DateHeureAlerte).HasDatabaseName("IX_Alertes_DateHeureAlerte");e.HasIndex(x=>x.Statut).HasDatabaseName("IX_Alertes_Statut");e.HasOne(x=>x.Chargement).WithMany(x=>x.Alertes).HasForeignKey(x=>x.IdChargement).OnDelete(DeleteBehavior.Cascade);});
  b.Entity<Invitation>(e=>{e.ToTable("Invitations");e.HasKey(x=>x.IdInvitation);e.Property(x=>x.TokenHash).HasMaxLength(128);e.HasIndex(x=>x.TokenHash).IsUnique();e.HasOne(x=>x.Utilisateur).WithMany(x=>x.Invitations).HasForeignKey(x=>x.IdUtilisateur).OnDelete(DeleteBehavior.Cascade);});
  b.Entity<JournalAudit>(e=>{e.ToTable("JournalAudit");e.HasKey(x=>x.IdJournal);e.Property(x=>x.Action).HasMaxLength(100);e.Property(x=>x.AdresseIP).HasMaxLength(64);e.Property(x=>x.Details).HasMaxLength(1000);e.HasIndex(x=>x.DateHeure);e.HasOne(x=>x.Utilisateur).WithMany(x=>x.JournauxAudit).HasForeignKey(x=>x.IdUtilisateur).OnDelete(DeleteBehavior.SetNull);});
 }
}
