import { useLiveQuery } from 'dexie-react-hooks'
import { recapitulatifQuatreSemaines } from '../../db/dashboard'
import { formatPlageSemaineFR } from '../../utils/dates'

export function RecapClotureSemaine() {
  const semaines = useLiveQuery(() => recapitulatifQuatreSemaines(), [], null)

  if (!semaines) return null
  const max = Math.max(1, ...semaines.map((s) => s.totalEfficaces))

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white shadow-sm px-4 py-3">
      <p className="mb-2 text-sm font-medium text-slate-600">Récapitulatif de clôture · 4 dernières semaines</p>
      <div className="flex flex-col gap-2">
        {semaines.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-slate-400">
              {i === 0 ? 'Cette semaine' : formatPlageSemaineFR(s.debut).replace('Semaine du ', '')}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-accent"
                style={{ width: `${(s.totalEfficaces / max) * 100}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-xs text-slate-500">
              {s.totalEfficaces}/{s.totalCible}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
