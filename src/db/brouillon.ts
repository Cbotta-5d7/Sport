import { db } from './schema'

export function cleBrouillonSerie(seanceExerciceId: number): string {
  return `brouillonSerie:${seanceExerciceId}`
}

export async function definirBrouillonSerie(seanceExerciceId: number, poidsKg: number, reps: number): Promise<void> {
  await db.reglages.put({ cle: cleBrouillonSerie(seanceExerciceId), valeur: JSON.stringify({ poidsKg, reps }) })
}

export async function lireBrouillonSerie(seanceExerciceId: number): Promise<{ poidsKg: number; reps: number } | null> {
  const r = await db.reglages.get(cleBrouillonSerie(seanceExerciceId))
  if (!r) return null
  try {
    return JSON.parse(r.valeur) as { poidsKg: number; reps: number }
  } catch {
    return null
  }
}

export async function effacerBrouillonSerie(seanceExerciceId: number): Promise<void> {
  await db.reglages.delete(cleBrouillonSerie(seanceExerciceId))
}
