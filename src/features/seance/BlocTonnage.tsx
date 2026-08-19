import type { ComparaisonTonnage } from '../../utils/tonnageComparaison'
import { formatPourcent } from '../../utils/nombres'

export function BlocTonnage({ comparaison }: { comparaison: ComparaisonTonnage }) {
  if (comparaison.nombreSeriesActuel === 0 || comparaison.vsPrecedente === null) return null

  const valeur = comparaison.vsPrecedente
  const positif = valeur > 2
  const negatif = valeur < -2
  const fleche = positif ? '▲' : negatif ? '▼' : '─'
  const signe = valeur > 0 ? '+' : ''
  const couleur = positif
    ? 'bg-emerald-50 text-emerald-600'
    : negatif
      ? 'bg-red-50 text-red-600'
      : 'bg-slate-100 text-slate-500'

  return (
    <span className={`inline-flex min-h-8 items-center gap-1 rounded-full px-2.5 text-sm font-bold ${couleur}`}>
      {fleche} {signe}
      {formatPourcent(valeur)}%
    </span>
  )
}
