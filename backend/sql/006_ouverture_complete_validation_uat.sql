/* Ouverture complète après validation du pilote UAT. */
USE [MonitoringETL_BCC_UAT];
GO

BEGIN TRANSACTION;

UPDATE dbo.ValidationTableMappings
SET Actif = 1
WHERE SchemaName = N'stg';

COMMIT TRANSACTION;
GO

SELECT COUNT(*) AS TablesDeFaitsActives
FROM dbo.ValidationTableMappings
WHERE SchemaName = N'stg' AND Actif = 1;
GO
