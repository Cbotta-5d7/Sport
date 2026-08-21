import { db } from './schema'
import { scoreCharge, volumeSerie } from '../utils/calculs'

export interface ResultatRecord {
  poids: boolean
  rm: boolean
  volume: boolean
}

async function seriesTravailExercice(exerciceId: number): Promise<{ poidsKg: number; reps: number }[]> {
  const seanceExercices = await db.seanceExercices.where('exerciceId').equals(exerciceId).toArray()
  const ids = seanceExercices.map((se) => se.id)
  if (ids.length === 0) return []
  const series = await db.series.where('seanceExerciceId').anyOf(ids).toArray()
  return series.filter((s) => s.validee && s.type !== 'échauffement')
}

export async function detecterRecord(
  exerciceId: number,
  poidsKg: number,
  reps: number,
): Promise<ResultatRecord> {
  const existantes = await seriesTravailExercice(exerciceId)

  if (existantes.length === 0) {
    return { poids: poidsKg > 0, rm: poidsKg > 0, volume: poidsKg > 0 && reps > 0 }
  }

  const meilleurPoids = Math.max(...existantes.map((s) => s.poidsKg))
  const meilleurVolume = Math.max(...existantes.map((s) => volumeSerie(s.poidsKg, s.reps)))
  const scoreActuel = scoreCharge(poidsKg, reps)
  const meilleurScore = Math.max(...existantes.map((s) => scoreCharge(s.poidsKg, s.reps)))

  return {
    poids: poidsKg > meilleurPoids,
    rm: scoreActuel > meilleurScore,
    volume: volumeSerie(poidsKg, reps) > meilleurVolume,
  }
}
