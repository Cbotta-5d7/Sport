import type { Serie } from '../db/types'
import { estSerieDeTravail } from './calculs'

type SerieTravail = Pick<Serie, 'poidsKg' | 'reps' | 'type'>

// Le poids compte pour l'essentiel du score, les reps n'apportent qu'un petit bonus (1%/rep,
// à comparer aux ~3,3%/rep d'Epley) : monter la charge doit presque toujours l'emporter sur
// une légère baisse de reps, plutôt que de viser une pure équivalence de force théorique.
const BONUS_PAR_REP = 0.01

export interface ProgressionCharge {
  // Score du meilleur set de chacune des dernières séances (plus ancienne en premier), pour la courbe.
  historique: (number | null)[]
  // Score du meilleur set déjà fait aujourd'hui (null tant qu'aucune série n'est validée).
  actuel: number | null
  // Référence : moyenne du score sur les 3 dernières séances (pas seulement la précédente).
  reference: number | null
  // true si le score du jour ne dépasse pas la référence récente : il faut monter la charge.
  stagne: boolean | null
}

function meilleurScoreCharge(series: SerieTravail[]): number | null {
  let meilleur: number | null = null
  for (const s of series.filter(estSerieDeTravail)) {
    if (s.poidsKg <= 0 || s.reps <= 0) continue
    const score = s.poidsKg * (1 + s.reps * BONUS_PAR_REP)
    if (meilleur === null || score > meilleur) meilleur = score
  }
  return meilleur
}

/**
 * Score pondéré poids-dominant du meilleur set de chaque séance, plutôt que le tonnage total :
 * une charge plus lourde fait presque toujours progresser l'indicateur (même avec un peu moins
 * de reps), et faire une série de moins ne le pénalise pas puisque seul le meilleur set compte,
 * pas la somme.
 */
export function calculerProgressionCharge(
  seriesActuelles: SerieTravail[],
  historiqueRecentSessions: SerieTravail[][],
): ProgressionCharge {
  const historique = historiqueRecentSessions
    .slice()
    .reverse()
    .map((series) => meilleurScoreCharge(series))

  const actuel = meilleurScoreCharge(seriesActuelles)

  const referenceValeurs = historiqueRecentSessions
    .slice(0, 3)
    .map((series) => meilleurScoreCharge(series))
    .filter((v): v is number => v !== null)
  const reference =
    referenceValeurs.length > 0 ? referenceValeurs.reduce((a, b) => a + b, 0) / referenceValeurs.length : null

  const stagne = actuel !== null && reference !== null ? actuel <= reference : null

  return { historique, actuel, reference, stagne }
}
