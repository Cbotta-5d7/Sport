import { db } from './schema'

const CLE_FIN = 'minuteurFinHorodatage'
const CLE_DUREE = 'minuteurDureeSec'
const CLE_SERIE_ID = 'minuteurSerieId'

export interface EtatMinuteurStocke {
  finHorodatage: string
  dureeSec: number
  serieId: number
}

export async function demarrerMinuteur(dureeSec: number, serieId: number): Promise<void> {
  const fin = new Date(Date.now() + dureeSec * 1000).toISOString()
  await db.reglages.bulkPut([
    { cle: CLE_FIN, valeur: fin },
    { cle: CLE_DUREE, valeur: String(dureeSec) },
    { cle: CLE_SERIE_ID, valeur: String(serieId) },
  ])
}

export async function ajusterMinuteur(deltaSec: number): Promise<void> {
  const etat = await lireMinuteur()
  if (!etat) return
  const nouvelleFin = new Date(new Date(etat.finHorodatage).getTime() + deltaSec * 1000).toISOString()
  await db.reglages.put({ cle: CLE_FIN, valeur: nouvelleFin })
}

export async function lireMinuteur(): Promise<EtatMinuteurStocke | null> {
  const [fin, duree, serieId] = await Promise.all([
    db.reglages.get(CLE_FIN),
    db.reglages.get(CLE_DUREE),
    db.reglages.get(CLE_SERIE_ID),
  ])
  if (!fin || !duree || !serieId) return null
  return {
    finHorodatage: fin.valeur,
    dureeSec: Number(duree.valeur),
    serieId: Number(serieId.valeur),
  }
}
