import type { ComparaisonTonnage } from '../../utils/tonnageComparaison'
import { formatKg, formatPourcent } from '../../utils/nombres'

function ligneComparaison(label: string, valeur: number | null) {
  if (valeur === null) return null
  const couleur =
    valeur > 2 ? 'text-emerald-400' : valeur < -2 ? 'text-red-400' : 'text-slate-400'
  const fleche = valeur > 2 ? '▲' : valeur < -2 ? '▼' : '─'
  const signe = valeur > 0 ? '+' : ''
  return (
    <p key={label} className={`text-sm ${couleur}`}>
      {label} {signe}
      {formatPourcent(valeur)} % {fleche}
    </p>
  )
}

export function BlocTonnage({ comparaison }: { comparaison: ComparaisonTonnage }) {
  if (comparaison.nombreSeriesActuel === 0) return null

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
      <p className="text-lg font-semibold text-slate-50">
        Tonnage {formatKg(comparaison.tonnageActuel)} kg, par série {formatKg(comparaison.tonnageParSerie)} kg
      </p>
      {!comparaison.complet && (
        <p className="text-xs text-slate-500">comparaison partielle, séance en cours</p>
      )}
      {ligneComparaison('vs séance précédente', comparaison.vsPrecedente)}
      {ligneComparaison('vs moyenne 5 séances', comparaison.vsMoyenne5)}
      {comparaison.changementNombreSeries && (
        <p className="mt-1 text-xs text-amber-400">
          {comparaison.changementNombreSeries.actuel} séries vs {comparaison.changementNombreSeries.precedent}{' '}
          la dernière fois
        </p>
      )}
    </div>
  )
}
