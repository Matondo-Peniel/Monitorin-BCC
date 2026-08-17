export const navItems=['Tableau de bord','Suivi des chargements','Flux ETL','Sources','Historique','Alertes','Rapports','Paramètres','Utilisateurs','À propos'];
export const evolution={labels:['08/05','09/05','10/05','11/05','12/05','13/05','14/05'],staging:[75,74,77,66,77,74,82],warehouse:[40,39,44,34,43,52,48]};
export const loadings=[
  ['Core Banking','07:15:22','Réussi','Réussi','00:04:32','Réussi'],
  ['Change','07:18:43','Réussi','Réussi','00:03:58','Réussi'],
  ['Paiements','07:21:11','Réussi','Échoué','00:02:10','Échoué'],
  ['Trésorerie','07:22:05','Réussi','Réussi','00:03:45','Réussi'],
  ['Comptabilité','07:23:50','Réussi','Réussi','00:04:01','Réussi']
];
export const alerts=[
  {title:'Échec Staging → Entrepôt',sub:'Source : Paiements',time:'07:21',danger:true},
  {title:'Chargement non exécuté',sub:'Source : RH',time:'—'},
  {title:'Maintenance planifiée',sub:'Data Warehouse',time:'15/05/2025\n22:00'}
];
