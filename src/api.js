const suspiciousEncoding = /(?:Ã.|Â.|â.|�)/;

const windows1252Bytes = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
  'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91,
  '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98,
  '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
};

function repairMojibake(value) {
  if (typeof value !== 'string' || !suspiciousEncoding.test(value)) return value;
  try {
    const bytes = Uint8Array.from([...value], character => {
      const code = character.codePointAt(0);
      if (code <= 0xff) return code;
      if (windows1252Bytes[character] !== undefined) return windows1252Bytes[character];
      throw new Error('Caractère non compatible avec Windows-1252');
    });
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return value;
  }
}

function normalizePayload(value) {
  if (typeof value === 'string') return repairMojibake(value);
  if (Array.isArray(value)) return value.map(normalizePayload);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, normalizePayload(nestedValue)]));
  }
  return value;
}

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (response.status === 204) return null;
  const body = normalizePayload(await response.json().catch(() => ({})));
  if (!response.ok) {
    const message = body.message || body.title || Object.values(body.errors || {}).flat().join(' ') || 'Une erreur est survenue.';
    throw new Error(message);
  }
  return body;
}

async function download(path) {
  const response = await fetch(`/api${path}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Impossible de générer le rapport.');
  return response.blob();
}

async function upload(path, formData) {
  const response = await fetch(`/api${path}`, { method: 'POST', credentials: 'include', body: formData });
  const body = normalizePayload(await response.json().catch(() => ({})));
  if (!response.ok) {
    const message = body.message || body.title || Object.values(body.errors || {}).flat().join(' ') || 'Une erreur est survenue.';
    throw new Error(message);
  }
  return body;
}

export const api = {
  validationTables: () => request('/validation/tables'),
  validationConfiguration: () => request('/validation/configuration'),
  configureValidation: data => request('/validation/configuration', { method: 'POST', body: JSON.stringify(data) }),
  validationRows: table => request(`/validation/${encodeURIComponent(table)}`),
  validationLog: () => request('/validation/journal'),
  undoValidation: id => request(`/validation/journal/${id}/annuler`, { method: 'POST' }),
  addValidationValue: (table, data) => request(`/validation/${encodeURIComponent(table)}/corrections-v2`, { method: 'POST', body: JSON.stringify(data) }),
  health: () => request('/health'),
  me: () => request('/auth/moi'),
  profile: () => request('/profil'),
  uploadProfilePhoto: file => { const formData = new FormData(); formData.append('photo', file); return upload('/profil/photo', formData); },
  initialization: () => request('/initialisation/statut'),
  login: data => request('/auth/connexion', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/deconnexion', { method: 'POST' }),
  setup: data => request('/initialisation/premier-administrateur', { method: 'POST', body: JSON.stringify(data) }),
  forgot: email => request('/auth/mot-de-passe-oublie', { method: 'POST', body: JSON.stringify({ email }) }),
  reset: data => request('/auth/reinitialiser-mot-de-passe', { method: 'POST', body: JSON.stringify(data) }),
  activateInvitation: data => request('/auth/activer-invitation', { method: 'POST', body: JSON.stringify(data) }),
  sources: () => request('/sources'),
  sourceServer: () => request('/sources/configuration/serveur'),
  sourceDatabases: () => request('/sources/configuration/bases'),
  sourceTables: database => request(`/sources/configuration/tables?baseDonnees=${encodeURIComponent(database)}`),
  configureSource: data => request('/sources/configuration', { method: 'POST', body: JSON.stringify(data) }),
  latest: id => request(`/monitoring/latest?sourceId=${id}`),
  dashboard: (date, jours = '7', sourceId = '') => request(`/dashboard?jours=${encodeURIComponent(jours)}${date ? `&date=${encodeURIComponent(date)}` : ''}${sourceId ? `&sourceId=${encodeURIComponent(sourceId)}` : ''}`),
  summary: (id, debut, fin) => request(`/monitoring/summary?sourceId=${id}&debut=${debut}&fin=${fin}`),
  history: (id, debut, fin, page = 1, taille = 20) => request(`/monitoring?sourceId=${id}&debut=${debut}&fin=${fin}&page=${page}&taille=${taille}`),
  alerts: () => request('/alertes'),
  resolveAlert: id => request(`/alertes/${id}/resoudre`, { method: 'PATCH' }),
  users: () => request('/utilisateurs'),
  invite: data => request('/utilisateurs/inviter', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/utilisateurs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setUserActive: (id, actif) => request(`/utilisateurs/${id}/actif`, { method: 'PATCH', body: JSON.stringify(actif) }),
  deleteUser: id => request(`/utilisateurs/${id}`, { method: 'DELETE' }),
  preferences: () => request('/preferences'),
  savePreferences: data => request('/preferences', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: data => request('/auth/changer-mot-de-passe', { method: 'POST', body: JSON.stringify(data) }),
  currentSession: () => request('/securite/session-courante'),
  audit: (limite = 100) => request(`/securite/audit?limite=${limite}`),
  backups: () => request('/sauvegardes'),
  createBackup: scope => request(`/sauvegardes/${encodeURIComponent(scope)}`, { method: 'POST' }),
  downloadExecutionsReport: date => download(`/rapports/executions.csv?date=${encodeURIComponent(date)}`),
  downloadHistoryReport: (sourceId, debut, fin) => download(`/rapports/historique.csv?sourceId=${encodeURIComponent(sourceId)}&debut=${encodeURIComponent(debut)}&fin=${encodeURIComponent(fin)}`),
};
