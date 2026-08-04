import { db } from '../db/schema'
import { construireSnapshot, appliquerSnapshot } from './snapshot'
import { lireFichierDistant, ecrireFichierDistant, type ConfigGitHub } from './github'

export type StatutSync = 'non_configure' | 'ok' | 'erreur'

export interface ResultatSync {
  statut: StatutSync
  message?: string
}

export async function lireConfigGitHub(): Promise<ConfigGitHub | null> {
  const [proprietaire, depot, jeton] = await Promise.all([
    db.reglages.get('githubProprietaire'),
    db.reglages.get('githubDepot'),
    db.reglages.get('githubJeton'),
  ])
  if (!proprietaire?.valeur || !depot?.valeur || !jeton?.valeur) return null
  return { owner: proprietaire.valeur, repo: depot.valeur, token: jeton.valeur }
}

async function enregistrerResultat(statut: StatutSync, horodatage?: string, message?: string) {
  const maintenant = new Date().toISOString()
  const ecritures: Promise<unknown>[] = [db.reglages.put({ cle: 'dernierSyncStatut', valeur: statut })]
  if (horodatage) {
    ecritures.push(db.reglages.put({ cle: 'dernierSyncHorodatage', valeur: horodatage }))
  }
  ecritures.push(db.reglages.put({ cle: 'dernierSyncMessage', valeur: message ?? '' }))
  ecritures.push(db.reglages.put({ cle: 'dernierSyncTentative', valeur: maintenant }))
  await Promise.all(ecritures)
}

export async function synchroniserMaintenant(): Promise<ResultatSync> {
  const config = await lireConfigGitHub()
  if (!config) return { statut: 'non_configure' }

  try {
    const distant = await lireFichierDistant(config)

    if (!distant) {
      const snapshot = await construireSnapshot()
      await ecrireFichierDistant(config, snapshot, undefined, 'Sauvegarde initiale depuis l\'application')
      await enregistrerResultat('ok', snapshot.exportedAt)
      return { statut: 'ok' }
    }

    const dernierSyncLocal = await db.reglages.get('dernierSyncHorodatage')
    const distantPlusRecent =
      !dernierSyncLocal || new Date(distant.contenu.exportedAt).getTime() > new Date(dernierSyncLocal.valeur).getTime()

    if (distantPlusRecent) {
      await appliquerSnapshot(distant.contenu)
      await enregistrerResultat('ok', distant.contenu.exportedAt)
      return { statut: 'ok', message: 'Version distante plus récente récupérée' }
    }

    const snapshot = await construireSnapshot()
    await ecrireFichierDistant(config, snapshot, distant.sha, `Mise à jour du ${new Date().toLocaleString('fr-FR')}`)
    await enregistrerResultat('ok', snapshot.exportedAt)
    return { statut: 'ok' }
  } catch (e) {
    await enregistrerResultat('erreur', undefined, e instanceof Error ? e.message : String(e))
    return { statut: 'erreur', message: e instanceof Error ? e.message : String(e) }
  }
}
