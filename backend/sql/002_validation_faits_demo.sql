/*
  Initialisation minimale du contexte de validation.
  Ce script ne crée ni tables de faits ni données de démonstration.
  Les tables et indicateurs sont lus directement dans l'entrepôt sélectionné.
*/
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'stg')
    EXEC(N'CREATE SCHEMA stg');

/* Journal d'audit des corrections : aucune donnée de faits n'est insérée ici. */
IF OBJECT_ID(N'dbo.ValidationJournal', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ValidationJournal
    (
        Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
        TableFait sysname NOT NULL,
        IdLigne bigint NULL,
        DateReference date NOT NULL,
        Indicateur nvarchar(100) NOT NULL,
        AncienneValeur decimal(18,2) NOT NULL,
        ValeurAjoutee decimal(18,2) NOT NULL,
        NouvelleValeur decimal(18,2) NOT NULL,
        Motif nvarchar(500) NOT NULL,
        Utilisateur nvarchar(256) NOT NULL,
        DateHeure datetime2 NOT NULL CONSTRAINT DF_ValidationJournal_DateHeure DEFAULT sysutcdatetime(),
        Statut nvarchar(20) NOT NULL CONSTRAINT DF_ValidationJournal_Statut DEFAULT N'APPLIQUE'
    );
END;
