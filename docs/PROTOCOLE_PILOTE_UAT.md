# Protocole pilote UAT — Validation des données

## Périmètre

- Base : `MonitoringETL_BCC_UAT`.
- Tables ouvertes : `stg.FaitValidation01` et `stg.FaitValidation02`.
- Les autres tables de faits restent indisponibles dans l’interface pendant le pilote.

## Personnes autorisées

- Administrateur : gère les comptes, les rôles, les paramètres et toutes les actions métier.
- Analyste : consulte et traite les données, réalise les corrections, annulations, alertes et sauvegardes UAT.
- Consultant : consultation seulement.

## Règles de correction

1. Une sauvegarde UAT est effectuée avant la campagne de test.
2. La correction concerne uniquement un indicateur numérique affiché par l’application.
3. Le motif est obligatoire et doit décrire la cause métier de l’ajustement.
4. Toute correction est journalisée avec la valeur avant/après, l’utilisateur, la date et la table concernée.
5. L’annulation est autorisée uniquement lorsque la correction possède une ligne source identifiée et qu’elle n’a pas déjà été annulée.

## Scénario de test par correction

1. Sélectionner une ligne connue dans `FaitValidation01` ou `FaitValidation02`.
2. Noter la valeur initiale dans SSMS.
3. Créer une correction avec un motif explicite.
4. Vérifier la nouvelle valeur dans l’application et directement dans `MonitoringETL_BCC_UAT`.
5. Vérifier l’entrée correspondante dans `dbo.ValidationJournal`.
6. Annuler la correction et vérifier le retour de la valeur initiale ainsi que le statut `ANNULE` dans le journal.

## Critères de sortie du pilote

- Les corrections et annulations sont conformes aux contrôles SSMS.
- Les journaux sont complets et attribués au bon utilisateur.
- La sauvegarde et une restauration de test sont validées par la DSI.
- L’équipe métier autorise l’ouverture progressive des autres tables.
