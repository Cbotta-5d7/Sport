import { db } from './schema'
import type { Seance } from './types'
import { tonnageTotal, estSerieDeTravail } from '../utils/calculs'
import { seanceExercicesAvecDetails } from './queries'

export interface SeanceHistorique {
  seance: Seance
  groupes: string[]
  tonnage: number
  nombreSeries: number
}

export async function listerHistoriqueSeances(limite = 200): Promise<SeanceHistorique[]> {
  const seances = (await db.seances.where('statut').equals('terminee').toArray()).sort((a, b) =>
    b.date.localeCompare(a.date),
  )

  const resultats: SeanceHistorique[] = []
  for (const seance of seances.slice(0, limite)) {
    const seanceExercices = await seanceExercicesAvecDetails(seance.id)
    const idsSE = seanceExercices.map((se) => se.id)
    const series = idsSE.length ? await db.series.where('seanceExerciceId').anyOf(idsSE).toArray() : []
    const groupes = Array.from(new Set(seanceExercices.map((se) => se.exercice.groupeMusculaire)))
    resultats.push({
      seance,
      groupes,
      tonnage: tonnageTotal(series.filter(estSerieDeTravail)),
      nombreSeries: series.filter(estSerieDeTravail).length,
    })
  }
  return resultats
}

export async function supprimerSeance(seanceId: number): Promise<void> {
  const seanceExercices = await db.seanceExercices.where('seanceId').equals(seanceId).toArray()
  const idsSE = seanceExercices.map((se) => se.id)
  await db.transaction('rw', db.seances, db.seanceExercices, db.series, db.reglages, async () => {
    if (idsSE.length) {
      await db.series.where('seanceExerciceId').anyOf(idsSE).delete()
      await db.seanceExercices.where('seanceId').equals(seanceId).delete()
      for (const id of idsSE) {
        await db.reglages.delete(`previsionSeries:${id}`)
      }
    }
    await db.seances.delete(seanceId)
  })
}
