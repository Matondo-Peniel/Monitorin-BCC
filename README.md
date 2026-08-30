# Monitoring BCC

Application React/Vite et API ASP.NET Core 10 pour le suivi des traitements ETL.

## Installation sur Windows

Prérequis : Node.js avec npm et un accès Internet lors de la première installation.
Le script installe le SDK .NET 10 localement dans le projet, restaure les dépendances
npm et NuGet, puis compile le frontend et le backend :

```powershell
.\setup.ps1
```

Les dépendances et caches locaux ne sont pas enregistrés dans Git.

## Configuration SQL Server

Aucune chaîne contenant un mot de passe ne doit être enregistrée dans le dépôt.
Après autorisation d’accès à SQL Server, copier :

```powershell
Copy-Item .\backend\MonitoringETL.Api\appsettings.Local.json.example `
  .\backend\MonitoringETL.Api\appsettings.Local.json
```

Adapter uniquement `appsettings.Local.json` à l’instance autorisée. Ce fichier est
ignoré par Git. La base attendue est `MonitoringETL_BCC`; les migrations EF et les
scripts existants se trouvent sous `backend`.

## Démarrage

Dans deux terminaux :

```powershell
.\start-backend.ps1
```

```powershell
npm run dev
```

Le frontend écoute normalement sur `http://localhost:5173` et transmet `/api` et
`/uploads` à l’API sur `http://127.0.0.1:5202`.

La route `GET /api/health` vérifie réellement SQL Server. Ne l’appeler qu’après
configuration et autorisation de la base.
