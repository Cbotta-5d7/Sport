import { db } from './schema'

function cle(seanceExerciceId: number): string {
  return `previsionSeries:${seanceExerciceId}`
}

export async function definirPrevisionSeries(seanceExerciceId: number, nombre: number): Promise<void> {
  await db.reglages.put({ cle: cle(seanceExerciceId), valeur: String(nombre) })
}

export async function lirePrevisionSeries(seanceExerciceId: number): Promise<number | null> {
  const r = await db.reglages.get(cle(seanceExerciceId))
  return r ? Number(r.valeur) : null
}
