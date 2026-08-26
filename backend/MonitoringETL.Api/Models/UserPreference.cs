namespace MonitoringETL.Api.Models;

public sealed class UserPreference
{
    public Guid IdUtilisateur { get; set; }
    public string GeneralJson { get; set; } = "{}";
    public string NotificationsJson { get; set; } = "{}";
    public DateTime DateModification { get; set; } = DateTime.UtcNow;
    public ApplicationUser Utilisateur { get; set; } = null!;
}