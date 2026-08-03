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

export function epley(poidsKg: number, reps: number): number {
  return poidsKg * (1 + reps / 30)
}

export function brzycki(poidsKg: number, reps: number): number {
  return (poidsKg * 36) / (37 - reps)
}

export function estimation1RM(poidsKg: number, reps: number): { valeur: number; fiable: boolean } | null {
  if (reps >= 37) return null
  const moyenne = (epley(poidsKg, reps) + brzycki(poidsKg, reps)) / 2
  return {
    valeur: Math.round(moyenne * 2) / 2,
    fiable: reps <= 10,
  }
}

export function variationPourcent(valeur: number, reference: number): number | null {
  if (reference === 0) return null
  return ((valeur - reference) / reference) * 100
}
