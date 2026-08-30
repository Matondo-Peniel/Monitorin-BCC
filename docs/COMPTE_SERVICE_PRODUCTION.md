# Compte de service SQL — Production

Le compte de l'application n'est pas un utilisateur métier. Il permet à l'API de se connecter à SQL Server avec un périmètre strictement nécessaire.

## Compte recommandé

Utiliser un compte Active Directory de service, par exemple `DOMAINE\svc_monitoring_etl_prod`, créé et géré par l'équipe IAM/DSI. L'application utilise alors l'authentification intégrée ; aucun mot de passe SQL n'est stocké dans le code.

## Droits attribués

- `role_prod_suivi_etl` : lecture/écriture uniquement pour le suivi ETL, les utilisateurs applicatifs, l'audit et le journal de sauvegarde.
- `role_prod_validation` : lecture/mise à jour des tables de faits autorisées et écriture dans `dbo.ValidationJournal`.
- Aucun droit `db_owner`, `sysadmin`, `DELETE` général ou accès à des bases non prévues.

## Exécution DBA

1. Créer la base Production et les rôles minimaux.
2. Créer le compte AD avec l'équipe IAM.
3. Renseigner `TargetDatabase` et `ServiceAccount` dans `007_compte_service_production.sql`.
4. Exécuter le script avec un compte DBA.
5. Vérifier la requête finale : seulement les deux rôles attendus doivent être listés.
6. Configurer la chaîne de connexion de l'API Production avec l'authentification intégrée, hors du dépôt Git.
