import type { Snapshot } from './snapshot'

export interface ConfigGitHub {
  owner: string
  repo: string
  token: string
}

export interface CommitInfo {
  sha: string
  date: string
  message: string
}

const API = 'https://api.github.com'
const CHEMIN_FICHIER = 'donnees.json'

function utf8VersBase64(texte: string): string {
  const octets = new TextEncoder().encode(texte)
  let binaire = ''
  for (const o of octets) binaire += String.fromCharCode(o)
  return btoa(binaire)
}

function base64VersUtf8(b64: string): string {
  const binaire = atob(b64.replace(/\n/g, ''))
  const octets = Uint8Array.from(binaire, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(octets)
}

async function requeteGitHub(config: ConfigGitHub, chemin: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API}${chemin}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  })
}

export async function lireFichierDistant(
  config: ConfigGitHub,
): Promise<{ sha: string; contenu: Snapshot } | null> {
  const res = await requeteGitHub(config, `/repos/${config.owner}/${config.repo}/contents/${CHEMIN_FICHIER}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Erreur GitHub (${res.status})`)
  const data = await res.json()
  const contenu = JSON.parse(base64VersUtf8(data.content)) as Snapshot
  return { sha: data.sha as string, contenu }
}

export async function ecrireFichierDistant(
  config: ConfigGitHub,
  snapshot: Snapshot,
  shaExistant: string | undefined,
  message: string,
): Promise<void> {
  const res = await requeteGitHub(config, `/repos/${config.owner}/${config.repo}/contents/${CHEMIN_FICHIER}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: utf8VersBase64(JSON.stringify(snapshot, null, 2)),
      sha: shaExistant,
    }),
  })
  if (!res.ok) throw new Error(`Échec de l'écriture sur GitHub (${res.status})`)
}

export async function listerCommits(config: ConfigGitHub, limite = 20): Promise<CommitInfo[]> {
  const res = await requeteGitHub(
    config,
    `/repos/${config.owner}/${config.repo}/commits?path=${CHEMIN_FICHIER}&per_page=${limite}`,
  )
  if (!res.ok) throw new Error(`Erreur GitHub (${res.status})`)
  const data = (await res.json()) as { sha: string; commit: { author: { date: string }; message: string } }[]
  return data.map((c) => ({ sha: c.sha, date: c.commit.author.date, message: c.commit.message }))
}

export async function lireFichierAVersion(config: ConfigGitHub, sha: string): Promise<Snapshot> {
  const res = await requeteGitHub(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${CHEMIN_FICHIER}?ref=${sha}`,
  )
  if (!res.ok) throw new Error(`Erreur GitHub (${res.status})`)
  const data = await res.json()
  return JSON.parse(base64VersUtf8(data.content)) as Snapshot
}

export async function verifierAcces(config: ConfigGitHub): Promise<{ ok: boolean; erreur?: string }> {
  try {
    const res = await requeteGitHub(config, `/repos/${config.owner}/${config.repo}`)
    if (res.status === 404) return { ok: false, erreur: 'Dépôt introuvable ou inaccessible avec ce jeton.' }
    if (res.status === 401 || res.status === 403) return { ok: false, erreur: 'Jeton invalide ou droits insuffisants.' }
    if (!res.ok) return { ok: false, erreur: `Erreur GitHub (${res.status}).` }
    return { ok: true }
  } catch {
    return { ok: false, erreur: 'Réseau indisponible.' }
  }
}
