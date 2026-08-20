import type { Serie } from '../db/types'
import { estimation1RM, estSerieDeTravail } from './calculs'

type SerieTravail = Pick<Serie, 'poidsKg' | 'reps' | 'type'>

export interface ProgressionCharge {
  // 1RM estimé du meilleur set de chacune des dernières séances (plus ancienne en premier), pour la courbe.
  historique: (number | null)[]
  // 1RM estimé du meilleur set déjà fait aujourd'hui (null tant qu'aucune série n'est validée).
  actuel: number | null
  // Référence : moyenne du 1RM sur les 3 dernières séances (pas seulement la précédente).
  reference: number | null
  // true si le 1RM du jour ne dépasse pas la référence récente : il faut monter la charge.
  stagne: boolean | null
}

function meilleur1RM(series: SerieTravail[]): number | null {
  let meilleur: number | null = null
  for (const s of series.filter(estSerieDeTravail)) {
    const rm = estimation1RM(s.poidsKg, s.reps)
    if (rm && (meilleur === null || rm.valeur > meilleur)) meilleur = rm.valeur
  }
  return meilleur
}

/**
 * Se base sur le 1RM estimé (Epley/Brzycki) du meilleur set de chaque séance plutôt que sur le tonnage total :
 * une charge plus lourde fait toujours progresser l'indicateur, et faire une série de moins ne le pénalise pas
 * puisque seul le meilleur set compte, pas la somme.
 */
export function calculerProgressionCharge(
  seriesActuelles: SerieTravail[],
  historiqueRecentSessions: SerieTravail[][],
): ProgressionCharge {
  const historique = historiqueRecentSessions
    .slice()
    .reverse()
    .map((series) => meilleur1RM(series))

  const actuel = meilleur1RM(seriesActuelles)

  const referenceValeurs = historiqueRecentSessions
    .slice(0, 3)
    .map((series) => meilleur1RM(series))
    .filter((v): v is number => v !== null)
  const reference =
    referenceValeurs.length > 0 ? referenceValeurs.reduce((a, b) => a + b, 0) / referenceValeurs.length : null

  const stagne = actuel !== null && reference !== null ? actuel <= reference : null

  return { historique, actuel, reference, stagne }
}
