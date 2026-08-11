import type { Serie } from '../db/types'
import { tonnageTotal, estSerieDeTravail, variationPourcent } from './calculs'

type SerieTravail = Pick<Serie, 'poidsKg' | 'reps' | 'type'>

export interface ComparaisonTonnage {
  tonnageActuel: number
  tonnageParSerie: number
  nombreSeriesActuel: number
  complet: boolean
  changementNombreSeries: { actuel: number; precedent: number } | null
  vsPrecedente: number | null
  vsMoyenne5: number | null
}

export function calculerComparaisonTonnage(
  seriesActuelles: SerieTravail[],
  dernieresSeries: SerieTravail[] | null,
  historiqueRecent: SerieTravail[][],
  prevision: number | null,
): ComparaisonTonnage {
  const travailActuel = seriesActuelles.filter(estSerieDeTravail)
  const n = travailActuel.length
  const tonnageActuel = tonnageTotal(travailActuel)
  const tonnageParSerie = n > 0 ? tonnageActuel / n : 0

  const cibleCount = prevision ?? dernieresSeries?.length ?? null
  const complet = cibleCount !== null && n >= cibleCount && n > 0

  let vsPrecedente: number | null = null
  let changementNombreSeries: { actuel: number; precedent: number } | null = null

  if (dernieresSeries && dernieresSeries.length > 0 && n > 0) {
    const travailPrecedent = dernieresSeries.filter(estSerieDeTravail)
    if (travailPrecedent.length > 0) {
      const tonnageParSeriePrecedent = tonnageTotal(travailPrecedent) / travailPrecedent.length
      vsPrecedente = variationPourcent(tonnageParSerie, tonnageParSeriePrecedent)
      if (n !== travailPrecedent.length) {
        changementNombreSeries = { actuel: n, precedent: travailPrecedent.length }
      }
    }
  }

  let vsMoyenne5: number | null = null
  if (historiqueRecent.length > 0 && n > 0) {
    const moyennesParSerie = historiqueRecent
      .map((session) => session.filter(estSerieDeTravail))
      .filter((travail) => travail.length > 0)
      .map((travail) => tonnageTotal(travail) / travail.length)
    if (moyennesParSerie.length > 0) {
      const moyenne = moyennesParSerie.reduce((a, b) => a + b, 0) / moyennesParSerie.length
      vsMoyenne5 = variationPourcent(tonnageParSerie, moyenne)
    }
  }

  return {
    tonnageActuel,
    tonnageParSerie,
    nombreSeriesActuel: n,
    complet,
    changementNombreSeries,
    vsPrecedente,
    vsMoyenne5,
  }
}
