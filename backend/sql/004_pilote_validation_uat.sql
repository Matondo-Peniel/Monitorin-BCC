/*
  Pilote UAT — Validation des données
  Périmètre initial : FaitValidation01 et FaitValidation02 uniquement.

  Pour étendre le pilote, mettre Actif = 1 sur une table supplémentaire.
  Pour revenir aux 14 tables, exécuter le bloc ROLLBACK ci-dessous.
*/
USE [MonitoringETL_BCC_UAT];
GO

IF OBJECT_ID(N'dbo.ValidationTableMappings', N'U') IS NULL
    THROW 50001, 'La configuration de validation doit être créée avant d''activer le pilote.', 1;
GO

BEGIN TRANSACTION;

UPDATE dbo.ValidationTableMappings
SET Actif = CASE
    WHEN SchemaName = N'stg' AND TableName IN (N'FaitValidation01', N'FaitValidation02') THEN 1
    ELSE 0
END;

COMMIT TRANSACTION;
GO

SELECT SchemaName, TableName, Actif
FROM dbo.ValidationTableMappings
WHERE SchemaName = N'stg'
ORDER BY TableName;
GO

/* ROLLBACK DU PILOTE — ouvrir les 14 tables après validation métier.
UPDATE dbo.ValidationTableMappings
SET Actif = 1
WHERE SchemaName = N'stg';
*/
