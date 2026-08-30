/* Seconde vague du pilote UAT : quatre tables de faits actives. */
USE [MonitoringETL_BCC_UAT];
GO

BEGIN TRANSACTION;

UPDATE dbo.ValidationTableMappings
SET Actif = CASE
    WHEN SchemaName = N'stg' AND TableName IN
        (N'FaitValidation01', N'FaitValidation02', N'FaitValidation03', N'FaitValidation04') THEN 1
    ELSE 0
END;

COMMIT TRANSACTION;
GO

SELECT TableName, Actif
FROM dbo.ValidationTableMappings
WHERE SchemaName = N'stg'
ORDER BY TableName;
GO

/* Retour au périmètre initial :
UPDATE dbo.ValidationTableMappings
SET Actif = CASE WHEN TableName IN (N'FaitValidation01', N'FaitValidation02') THEN 1 ELSE 0 END
WHERE SchemaName = N'stg';
*/
