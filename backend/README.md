# Backend Monitoring ETL BCC

API ASP.NET Core 10, Entity Framework Core, Identity et SQL Server. Le frontend ne doit jamais recevoir une chaîne de connexion SQL ni un secret.

## Configuration locale

La configuration versionnée utilise l’authentification Windows et ne contient aucun mot de passe. Pour une autre instance, définir localement la variable suivante sans la placer dans Git :

```powershell
$env:ConnectionStrings__MonitoringDatabase='Server=NOM_INSTANCE;Database=MonitoringETL_BCC;Integrated Security=True;Encrypt=False'
```

Avec un compte SQL applicatif, stocker la valeur avec `dotnet user-secrets`, jamais dans `appsettings.json` ni dans le frontend.

## Création et mise à jour

```powershell
dotnet ef database update --project MonitoringETL.Api/MonitoringETL.Api.csproj --startup-project MonitoringETL.Api/MonitoringETL.Api.csproj
```

Puis exécuter `sql/usp_GenererDonneesTestMonitoring.sql` sur `MonitoringETL_BCC` et générer un petit jeu de données :

```sql
EXEC dbo.usp_GenererDonneesTestMonitoring
 @DateDebut='2026-07-20',@NombreJours=30,@ExecutionsParJour=4,
 @TauxReussite=85,@SupprimerAnciennesDonnees=0;
```

Le nettoyage avec `@SupprimerAnciennesDonnees=1` cible exclusivement les lignes `EstDonneeTest=1`.
