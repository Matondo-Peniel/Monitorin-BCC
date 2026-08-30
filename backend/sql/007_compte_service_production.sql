/*
  Compte de service de l'application — PRODUCTION

  À exécuter par le DBA sur l'instance SQL Server de production.
  Remplacer uniquement les deux variables ci-dessous par les valeurs validées
  par la banque. Ne jamais placer de mot de passe dans ce fichier ou dans Git.

  Prérequis :
  - la base Production existe ;
  - les rôles role_prod_suivi_etl et role_prod_validation existent déjà ;
  - le compte Active Directory est créé par l'équipe IAM/DSI.
*/
:setvar TargetDatabase "MonitoringETL_BCC_PROD"
:setvar ServiceAccount "DOMAINE\\svc_monitoring_etl_prod"

USE [master];
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'$(ServiceAccount)')
BEGIN
    DECLARE @createLogin nvarchar(max) = N'CREATE LOGIN [' + REPLACE(N'$(ServiceAccount)', N']', N']]') + N'] FROM WINDOWS;';
    EXEC sys.sp_executesql @createLogin;
END;
GO

USE [$(TargetDatabase)];
GO

IF DATABASE_PRINCIPAL_ID(N'$(ServiceAccount)') IS NULL
BEGIN
    DECLARE @createUser nvarchar(max) = N'CREATE USER [' + REPLACE(N'$(ServiceAccount)', N']', N']]') + N'] FOR LOGIN [' + REPLACE(N'$(ServiceAccount)', N']', N']]') + N'];';
    EXEC sys.sp_executesql @createUser;
END;
GO

IF DATABASE_PRINCIPAL_ID(N'role_prod_suivi_etl') IS NULL
    THROW 50001, 'Le rôle role_prod_suivi_etl doit être créé avant le compte de service.', 1;

IF DATABASE_PRINCIPAL_ID(N'role_prod_validation') IS NULL
    THROW 50002, 'Le rôle role_prod_validation doit être créé avant le compte de service.', 1;
GO

DECLARE @member sysname = N'$(ServiceAccount)';
DECLARE @addSuivi nvarchar(max) = N'ALTER ROLE [role_prod_suivi_etl] ADD MEMBER [' + REPLACE(@member, N']', N']]') + N'];';
DECLARE @addValidation nvarchar(max) = N'ALTER ROLE [role_prod_validation] ADD MEMBER [' + REPLACE(@member, N']', N']]') + N'];';

IF NOT EXISTS (
    SELECT 1 FROM sys.database_role_members drm
    JOIN sys.database_principals rolePrincipal ON rolePrincipal.principal_id = drm.role_principal_id
    JOIN sys.database_principals memberPrincipal ON memberPrincipal.principal_id = drm.member_principal_id
    WHERE rolePrincipal.name = N'role_prod_suivi_etl' AND memberPrincipal.name = @member
) EXEC sys.sp_executesql @addSuivi;

IF NOT EXISTS (
    SELECT 1 FROM sys.database_role_members drm
    JOIN sys.database_principals rolePrincipal ON rolePrincipal.principal_id = drm.role_principal_id
    JOIN sys.database_principals memberPrincipal ON memberPrincipal.principal_id = drm.member_principal_id
    WHERE rolePrincipal.name = N'role_prod_validation' AND memberPrincipal.name = @member
) EXEC sys.sp_executesql @addValidation;
GO

/* Contrôle final : aucun rôle db_owner ne doit apparaître. */
SELECT memberPrincipal.name AS CompteService, rolePrincipal.name AS RoleAttribue
FROM sys.database_role_members drm
JOIN sys.database_principals rolePrincipal ON rolePrincipal.principal_id = drm.role_principal_id
JOIN sys.database_principals memberPrincipal ON memberPrincipal.principal_id = drm.member_principal_id
WHERE memberPrincipal.name = N'$(ServiceAccount)'
ORDER BY rolePrincipal.name;
GO
