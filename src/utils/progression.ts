import type { Exercice, Serie } from '../db/types'

export type RegleProgression = 'premiere_fois' | 'augmentation' | 'plus_une_rep' | 'consolidation'

export interface Suggestion {
  poidsKg: number
  repsCible: number
  regle: RegleProgression
}

const POIDS_DEPART_PAR_TYPE: Record<Exercice['typeCharge'], number> = {
  barre: 20,
  'haltères': 10,
  machine: 20,
  poulie: 15,
  'poids du corps': 0,
  'lestée': 0,
}

export function calculerSuggestion(
  exercice: Pick<Exercice, 'repsCibleMin' | 'repsCibleMax' | 'incrementKg' | 'typeCharge'>,
  dernieresSeriesTravail: Pick<Serie, 'poidsKg' | 'reps'>[],
): Suggestion {
  if (dernieresSeriesTravail.length === 0) {
    return {
      poidsKg: POIDS_DEPART_PAR_TYPE[exercice.typeCharge],
      repsCible: exercice.repsCibleMin,
      regle: 'premiere_fois',
    }
  }

  const { repsCibleMin, repsCibleMax, incrementKg } = exercice
  const poidsBase = dernieresSeriesTravail[0].poidsKg
  const tousAuMax = dernieresSeriesTravail.every((s) => s.reps >= repsCibleMax)
  const unSousMin = dernieresSeriesTravail.some((s) => s.reps < repsCibleMin)

  if (tousAuMax) {
    return { poidsKg: poidsBase + incrementKg, repsCible: repsCibleMin, regle: 'augmentation' }
  }
  if (unSousMin) {
    return { poidsKg: poidsBase, repsCible: repsCibleMin, regle: 'consolidation' }
  }
  const repsNonMax = dernieresSeriesTravail.map((s) => s.reps).filter((r) => r < repsCibleMax)
  const repsCible = Math.min(...repsNonMax) + 1
  return { poidsKg: poidsBase, repsCible, regle: 'plus_une_rep' }
}

export function texteConsigne(suggestion: Suggestion): string {
  const poids = suggestion.poidsKg.toString().replace('.', ',')
  return `→ ${poids} kg x ${suggestion.repsCible}`
}

export function texteCommentaire(
  suggestion: Suggestion,
  dernieresSeriesTravail: Pick<Serie, 'poidsKg' | 'reps'>[],
): string {
  if (suggestion.regle === 'premiere_fois') return 'Première fois sur cet exercice.'

  const reps = dernieresSeriesTravail.map((s) => s.reps).join(', ')
  const poids = dernieresSeriesTravail[0].poidsKg.toString().replace('.', ',')

  if (suggestion.regle === 'augmentation') {
    return `La dernière fois : ${poids} kg x ${reps}. Tu as saturé le haut de la fourchette. On monte.`
  }
  if (suggestion.regle === 'consolidation') {
    return `La dernière fois : ${poids} kg x ${reps}. Une série était sous la fourchette. On consolide.`
  }
  return `La dernière fois : ${poids} kg x ${reps}. On vise une rep de plus.`
}
