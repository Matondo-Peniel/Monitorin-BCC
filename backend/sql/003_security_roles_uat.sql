/*
  Sécurité UAT : rôles SQL à attribuer aux comptes de service fournis par la banque.
  Ce script ne crée aucun login et ne contient aucun mot de passe.
*/
USE [MonitoringETL_BCC_UAT];
GO

IF DATABASE_PRINCIPAL_ID(N'role_uat_suivi_etl') IS NULL
    CREATE ROLE [role_uat_suivi_etl];
GO
IF DATABASE_PRINCIPAL_ID(N'role_uat_validation') IS NULL
    CREATE ROLE [role_uat_validation];
GO

/* Suivi ETL : objets applicatifs précis, sans DELETE ni db_owner. */
GRANT SELECT, INSERT, UPDATE ON [dbo].[Connexions] TO [role_uat_suivi_etl];
GRANT SELECT, INSERT, UPDATE ON [dbo].[SuiviChargement] TO [role_uat_suivi_etl];
GRANT SELECT, INSERT ON [dbo].[JournalAudit] TO [role_uat_suivi_etl];
GRANT SELECT, INSERT, UPDATE ON [dbo].[AspNetUsers] TO [role_uat_suivi_etl];
GRANT SELECT, INSERT, UPDATE ON [dbo].[AspNetRoles] TO [role_uat_suivi_etl];
GRANT SELECT, INSERT, UPDATE ON [dbo].[AspNetUserRoles] TO [role_uat_suivi_etl];
GRANT SELECT, INSERT, UPDATE ON [dbo].[AspNetUserClaims] TO [role_uat_suivi_etl];
GRANT SELECT, INSERT, UPDATE ON [dbo].[AspNetUserLogins] TO [role_uat_suivi_etl];
GRANT SELECT, INSERT, UPDATE ON [dbo].[AspNetUserTokens] TO [role_uat_suivi_etl];
GRANT SELECT, INSERT, UPDATE ON [dbo].[AspNetRoleClaims] TO [role_uat_suivi_etl];
GRANT SELECT, INSERT, UPDATE ON [dbo].[Invitations] TO [role_uat_suivi_etl];
GRANT SELECT, INSERT, UPDATE ON [dbo].[UserPreferences] TO [role_uat_suivi_etl];
GRANT SELECT, INSERT, UPDATE ON [dbo].[SauvegardeJournal] TO [role_uat_suivi_etl];
GO

/* Validation : seuls les faits mappés sont modifiables, sans INSERT ni DELETE. */
GRANT SELECT, UPDATE ON [stg].[FaitValidation01] TO [role_uat_validation];
GRANT SELECT, UPDATE ON [stg].[FaitValidation02] TO [role_uat_validation];
GRANT SELECT, UPDATE ON [stg].[FaitValidation03] TO [role_uat_validation];
GRANT SELECT, UPDATE ON [stg].[FaitValidation04] TO [role_uat_validation];
GRANT SELECT, UPDATE ON [stg].[FaitValidation05] TO [role_uat_validation];
GRANT SELECT, UPDATE ON [stg].[FaitValidation06] TO [role_uat_validation];
GRANT SELECT, UPDATE ON [stg].[FaitValidation07] TO [role_uat_validation];
GRANT SELECT, UPDATE ON [stg].[FaitValidation08] TO [role_uat_validation];
GRANT SELECT, UPDATE ON [stg].[FaitValidation09] TO [role_uat_validation];
GRANT SELECT, UPDATE ON [stg].[FaitValidation10] TO [role_uat_validation];
GRANT SELECT, UPDATE ON [stg].[FaitValidation11] TO [role_uat_validation];
GRANT SELECT, UPDATE ON [stg].[FaitValidation12] TO [role_uat_validation];
GRANT SELECT, UPDATE ON [stg].[FaitValidation13] TO [role_uat_validation];
GRANT SELECT, UPDATE ON [stg].[FaitValidation14] TO [role_uat_validation];
GRANT SELECT, INSERT, UPDATE ON [dbo].[ValidationJournal] TO [role_uat_validation];
GRANT SELECT ON [dbo].[ValidationTableMappings] TO [role_uat_validation];
GRANT SELECT, INSERT, UPDATE ON [dbo].[ValidationConfiguration] TO [role_uat_validation];
GO

/* Exemple à exécuter uniquement après création du compte par l'administrateur SQL :
   CREATE USER [svc_monitoring_uat] FOR LOGIN [svc_monitoring_uat];
   ALTER ROLE [role_uat_suivi_etl] ADD MEMBER [svc_monitoring_uat];
   ALTER ROLE [role_uat_validation] ADD MEMBER [svc_monitoring_uat];
*/
