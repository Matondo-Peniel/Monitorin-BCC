DECLARE @IdConnexion int=1,@Debut datetime2(0)='2026-08-18',@Fin datetime2(0)='2026-08-19';

-- Dernière exécution. Aucune ligne signifie NO_DATA, jamais un échec implicite.
SELECT TOP(1) Id,DateHeureETL,Staging,Entrepot,
 CASE WHEN Staging=1 AND Entrepot=1 THEN 'REUSSI' WHEN Staging=1 THEN 'PARTIEL' ELSE 'ECHEC' END Statut
FROM dbo.SuiviChargement WHERE IdConnexion=@IdConnexion ORDER BY DateHeureETL DESC;

-- Exécutions d'une journée avec une plage indexable.
SELECT * FROM dbo.SuiviChargement
WHERE IdConnexion=@IdConnexion AND DateHeureETL>=@Debut AND DateHeureETL<DATEADD(DAY,1,@Debut)
ORDER BY DateHeureETL DESC;

-- Historique paginé : renseigner @Page et @Taille depuis le backend.
DECLARE @Page int=1,@Taille int=20;
SELECT * FROM dbo.SuiviChargement
WHERE IdConnexion=@IdConnexion AND DateHeureETL>=@Debut AND DateHeureETL<@Fin
ORDER BY DateHeureETL DESC OFFSET (@Page-1)*@Taille ROWS FETCH NEXT @Taille ROWS ONLY;

-- Indicateurs de synthèse.
SELECT COUNT(*) TotalExecutions,
 SUM(CASE WHEN Staging=1 AND Entrepot=1 THEN 1 ELSE 0 END) ReussitesCompletes,
 SUM(CASE WHEN Staging=0 THEN 1 ELSE 0 END) EchecsStaging,
 SUM(CASE WHEN Staging=1 AND Entrepot=0 THEN 1 ELSE 0 END) EchecsEntrepot,
 CAST(100.0*AVG(CAST(Staging AS decimal(9,4))) AS decimal(5,2)) TauxStaging,
 CAST(100.0*AVG(CAST(Entrepot AS decimal(9,4))) AS decimal(5,2)) TauxEntrepot
FROM dbo.SuiviChargement WHERE IdConnexion=@IdConnexion AND DateHeureETL>=@Debut AND DateHeureETL<@Fin;

-- Statistiques journalières.
SELECT CAST(DateHeureETL AS date) Jour,COUNT(*) Total,SUM(CAST(Staging AS int)) ReussitesStaging,SUM(CAST(Entrepot AS int)) ReussitesEntrepot
FROM dbo.SuiviChargement WHERE IdConnexion=@IdConnexion AND DateHeureETL>=@Debut AND DateHeureETL<@Fin
GROUP BY CAST(DateHeureETL AS date) ORDER BY Jour;

-- Alertes ouvertes / critiques.
SELECT a.* FROM dbo.Alertes a INNER JOIN dbo.SuiviChargement s ON s.Id=a.IdChargement
WHERE s.IdConnexion=@IdConnexion AND a.Statut='NON_RESOLUE' ORDER BY a.DateHeureAlerte DESC;
SELECT * FROM dbo.Alertes WHERE Niveau='CRITIQUE' ORDER BY DateHeureAlerte DESC;
