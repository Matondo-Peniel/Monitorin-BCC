CREATE OR ALTER PROCEDURE dbo.usp_GenererDonneesTestMonitoring
    @DateDebut date,
    @NombreJours int,
    @ExecutionsParJour int,
    @TauxReussite decimal(5,2),
    @SupprimerAnciennesDonnees bit = 0,
    @IdConnexion int = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @DateDebut IS NULL THROW 50001, 'DateDebut est obligatoire.', 1;
    IF @NombreJours NOT BETWEEN 1 AND 3650 THROW 50002, 'NombreJours doit être compris entre 1 et 3650.', 1;
    IF @ExecutionsParJour NOT BETWEEN 1 AND 96 THROW 50003, 'ExecutionsParJour doit être compris entre 1 et 96.', 1;
    IF @TauxReussite NOT BETWEEN 0 AND 100 THROW 50004, 'TauxReussite doit être compris entre 0 et 100.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @SupprimerAnciennesDonnees = 1
        BEGIN
            DELETE a FROM dbo.Alertes a
            INNER JOIN dbo.SuiviChargement s ON s.Id = a.IdChargement
            WHERE a.EstDonneeTest = 1 AND s.EstDonneeTest = 1
              AND (@IdConnexion IS NULL OR s.IdConnexion = @IdConnexion);

            DELETE FROM dbo.SuiviChargement
            WHERE EstDonneeTest = 1
              AND (@IdConnexion IS NULL OR IdConnexion = @IdConnexion);
        END;

        IF @IdConnexion IS NULL
        BEGIN
            SELECT TOP (1) @IdConnexion = IdConnexion
            FROM dbo.Connexions WHERE EstDonneeTest = 1 ORDER BY IdConnexion;

            IF @IdConnexion IS NULL
            BEGIN
                INSERT dbo.Connexions(NomConnexion,TypeConnexion,NomServeur,NomBase,NomTableMonitoring,Actif,EstDonneeTest,DateCreation)
                VALUES(N'Connexion de démonstration',N'SQL Server',N'SERVEUR-DEMO',N'MonitoringETL_BCC',N'dbo.SuiviChargement',1,1,SYSUTCDATETIME());
                SET @IdConnexion = SCOPE_IDENTITY();
            END;
        END;

        IF NOT EXISTS (SELECT 1 FROM dbo.Connexions WHERE IdConnexion=@IdConnexion)
            THROW 50005, 'La connexion demandée est introuvable.', 1;

        DECLARE @Jour int=0,@Execution int,@DateHeure datetime2(0),@Aleatoire int,@Staging bit,@Entrepot bit;
        DECLARE @Nouveaux TABLE(Id int,DateHeureETL datetime2(0),Staging bit,Entrepot bit);

        WHILE @Jour < @NombreJours
        BEGIN
            SET @Execution=0;
            WHILE @Execution < @ExecutionsParJour
            BEGIN
                SET @DateHeure=DATEADD(SECOND,22+(@Execution*19)%38,DATEADD(MINUTE,(@Execution*1440)/@ExecutionsParJour,CAST(DATEADD(DAY,@Jour,@DateDebut) AS datetime2(0))));
                SET @Aleatoire=ABS(CHECKSUM(NEWID()))%10000;
                IF @Aleatoire < @TauxReussite*100 SELECT @Staging=1,@Entrepot=1;
                ELSE IF @Aleatoire < @TauxReussite*100+(10000-@TauxReussite*100)*0.60 SELECT @Staging=1,@Entrepot=0;
                ELSE SELECT @Staging=0,@Entrepot=0;

                IF NOT EXISTS(SELECT 1 FROM dbo.SuiviChargement WHERE IdConnexion=@IdConnexion AND DateHeureETL=@DateHeure AND EstDonneeTest=1)
                    INSERT dbo.SuiviChargement(DateHeureETL,Staging,Entrepot,IdConnexion,EstDonneeTest,DateCreation)
                    OUTPUT inserted.Id,inserted.DateHeureETL,inserted.Staging,inserted.Entrepot INTO @Nouveaux
                    VALUES(@DateHeure,@Staging,@Entrepot,@IdConnexion,1,SYSUTCDATETIME());
                SET @Execution+=1;
            END;
            SET @Jour+=1;
        END;

        INSERT dbo.Alertes(IdChargement,DateHeureAlerte,Niveau,Etape,Message,Statut,DateResolution,EstDonneeTest)
        SELECT Id,DATEADD(SECOND,5,DateHeureETL),
               CASE WHEN Staging=0 THEN 'CRITIQUE' ELSE 'IMPORTANT' END,
               CASE WHEN Staging=0 THEN 'STAGING' ELSE 'ENTREPOT' END,
               CASE WHEN Staging=0 THEN N'Échec du chargement vers le Staging.' ELSE N'Échec du chargement vers l''Entrepôt.' END,
               'NON_RESOLUE',NULL,1
        FROM @Nouveaux WHERE Staging=0 OR Entrepot=0;

        COMMIT TRANSACTION;
        SELECT @IdConnexion AS IdConnexion,COUNT(*) AS LignesCreees FROM @Nouveaux;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
