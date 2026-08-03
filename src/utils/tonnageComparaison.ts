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

  if (dernieresSeries && dernieresSeries.length > 0) {
    const travailPrecedent = dernieresSeries.filter(estSerieDeTravail)
    if (complet) {
      vsPrecedente = variationPourcent(tonnageActuel, tonnageTotal(travailPrecedent))
      if (n !== travailPrecedent.length) {
        changementNombreSeries = { actuel: n, precedent: travailPrecedent.length }
      }
    } else if (n > 0) {
      const tranche = travailPrecedent.slice(0, n)
      vsPrecedente = variationPourcent(tonnageActuel, tonnageTotal(tranche))
    }
  }

  let vsMoyenne5: number | null = null
  if (historiqueRecent.length > 0 && n > 0) {
    const valeurs = historiqueRecent.map((session) => {
      const travail = session.filter(estSerieDeTravail)
      const tranche = complet ? travail : travail.slice(0, n)
      return tonnageTotal(tranche)
    })
    const moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length
    vsMoyenne5 = variationPourcent(tonnageActuel, moyenne)
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
