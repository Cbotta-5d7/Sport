import { db } from './schema'
import type { Seance } from './types'
import { tonnageTotal, estSerieDeTravail } from '../utils/calculs'
import { seanceExercicesAvecDetails, seanceEnCours } from './queries'

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

export async function reprendreSeance(seanceId: number): Promise<void> {
  const enCours = await seanceEnCours()
  if (enCours && enCours.id !== seanceId) {
    throw new Error('Une autre séance est déjà en cours. Termine-la ou annule-la avant de reprendre celle-ci.')
  }
  const seance = await db.seances.get(seanceId)
  if (!seance) throw new Error('Séance introuvable.')
  await db.seances.update(seanceId, {
    statut: 'en_cours',
    dateFin: null,
    dateDebut: new Date(Date.now() - seance.dureeSec * 1000).toISOString(),
    dejaTerminee: true,
  })
}

export async function supprimerSeanceExercice(seanceExerciceId: number): Promise<void> {
  await db.transaction('rw', db.seanceExercices, db.series, db.reglages, async () => {
    await db.series.where('seanceExerciceId').equals(seanceExerciceId).delete()
    await db.seanceExercices.delete(seanceExerciceId)
    await db.reglages.delete(`previsionSeries:${seanceExerciceId}`)
  })
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
