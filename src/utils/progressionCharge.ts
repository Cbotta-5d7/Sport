import type { Serie } from '../db/types'
import { estSerieDeTravail, scoreCharge } from './calculs'

type SerieTravail = Pick<Serie, 'poidsKg' | 'reps' | 'type'>

export interface ProgressionCharge {
  // Score moyen de chacune des dernières séances (plus ancienne en premier), pour la courbe.
  historique: (number | null)[]
  // Score moyen de l'ensemble des séries déjà validées aujourd'hui (null tant qu'aucune n'est validée).
  actuel: number | null
  // Référence : moyenne du score sur les 3 dernières séances (pas seulement la précédente).
  reference: number | null
  // true si le score du jour ne dépasse pas la référence récente : il faut monter la charge.
  stagne: boolean | null
}

// Moyenne (pas le meilleur set) : avec le meilleur set seul, l'indicateur restait figé sur la 1ère
// série dès qu'elle était la plus lourde (cas courant, le poids/reps ne fait ensuite que baisser
// avec la fatigue) et ne bougeait plus quoi qu'on valide ensuite. La moyenne évolue à chaque série.
function scoreMoyenSeance(series: SerieTravail[]): number | null {
  const valides = series.filter(estSerieDeTravail).filter((s) => s.poidsKg > 0 && s.reps > 0)
  if (valides.length === 0) return null
  const total = valides.reduce((acc, s) => acc + scoreCharge(s.poidsKg, s.reps), 0)
  return total / valides.length
}

/**
 * Score pondéré poids-dominant (voir scoreCharge), moyenné sur les séries de travail de chaque
 * séance plutôt que le tonnage total : une charge plus lourde fait presque toujours progresser
 * l'indicateur (même avec un peu moins de reps).
 */
export function calculerProgressionCharge(
  seriesActuelles: SerieTravail[],
  historiqueRecentSessions: SerieTravail[][],
): ProgressionCharge {
  const historique = historiqueRecentSessions
    .slice()
    .reverse()
    .map((series) => scoreMoyenSeance(series))

  const actuel = scoreMoyenSeance(seriesActuelles)

  const referenceValeurs = historiqueRecentSessions
    .slice(0, 3)
    .map((series) => scoreMoyenSeance(series))
    .filter((v): v is number => v !== null)
  const reference =
    referenceValeurs.length > 0 ? referenceValeurs.reduce((a, b) => a + b, 0) / referenceValeurs.length : null

  const stagne = actuel !== null && reference !== null ? actuel <= reference : null

  return { historique, actuel, reference, stagne }
}
