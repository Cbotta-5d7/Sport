import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'

export type CouleurSync = 'gris' | 'vert' | 'orange' | 'rouge'

export interface EtatSync {
  horodatage: string | null
  statut: string | null
  configure: boolean
  couleur: CouleurSync
}

export function useEtatSync(): EtatSync {
  const reglages = useLiveQuery(
    () => db.reglages.bulkGet(['dernierSyncHorodatage', 'dernierSyncStatut', 'githubProprietaire', 'githubDepot', 'githubJeton']),
    [],
    undefined,
  )

  if (!reglages) {
    return { horodatage: null, statut: null, configure: false, couleur: 'gris' }
  }

  const [horo, statut, proprietaire, depot, jeton] = reglages
  const configure = Boolean(proprietaire?.valeur && depot?.valeur && jeton?.valeur)

  if (!horo?.valeur) {
    return { horodatage: null, statut: statut?.valeur ?? null, configure, couleur: 'gris' }
  }

  const heures = (Date.now() - new Date(horo.valeur).getTime()) / (1000 * 60 * 60)
  let couleur: CouleurSync = 'vert'
  if (heures >= 72) couleur = 'rouge'
  else if (heures >= 24) couleur = 'orange'

  return { horodatage: horo.valeur, statut: statut?.valeur ?? null, configure, couleur }
}
