import type { Serie } from '../db/types'

export function volumeSerie(poidsKg: number, reps: number): number {
  return poidsKg * reps
}

export function estSerieDeTravail(serie: Pick<Serie, 'type'>): boolean {
  return serie.type !== 'échauffement'
}

export function tonnageTotal(series: Pick<Serie, 'poidsKg' | 'reps' | 'type'>[]): number {
  return series.filter(estSerieDeTravail).reduce((acc, s) => acc + volumeSerie(s.poidsKg, s.reps), 0)
}

export function tonnageParSerie(series: Pick<Serie, 'poidsKg' | 'reps' | 'type'>[]): number {
  const travail = series.filter(estSerieDeTravail)
  if (travail.length === 0) return 0
  return tonnageTotal(travail) / travail.length
}

// Le poids compte pour l'essentiel du score, les reps n'apportent qu'un petit bonus (1%/rep,
// à comparer aux ~3,3%/rep d'une estimation de 1RM classique type Epley) : monter la charge doit
// presque toujours l'emporter sur une légère baisse de reps, plutôt que de viser une pure
// équivalence de force théorique (ex : 100kg x12 -> 105kg x10 doit se lire comme une progression).
export function scoreCharge(poidsKg: number, reps: number): number {
  return poidsKg * (1 + reps * 0.01)
}

export function variationPourcent(valeur: number, reference: number): number | null {
  if (reference === 0) return null
  return ((valeur - reference) / reference) * 100
}
