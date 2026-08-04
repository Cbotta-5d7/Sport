import { useEffect, useState } from 'react'
import { recapitulatifQuatreSemaines, type RecapSemaine } from '../../db/dashboard'
import { formatPlageSemaineFR } from '../../utils/dates'

export function RecapClotureSemaine() {
  const [semaines, setSemaines] = useState<RecapSemaine[] | null>(null)

  useEffect(() => {
    let annule = false
    recapitulatifQuatreSemaines().then((r) => {
      if (!annule) setSemaines(r)
    })
    return () => {
      annule = true
    }
  }, [])

  if (!semaines) return null
  const max = Math.max(1, ...semaines.map((s) => s.totalEfficaces))

  return (
    <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
      <p className="mb-2 text-sm font-medium text-slate-300">Récapitulatif de clôture · 4 dernières semaines</p>
      <div className="flex flex-col gap-2">
        {semaines.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-slate-500">
              {i === 0 ? 'Cette semaine' : formatPlageSemaineFR(s.debut).replace('Semaine du ', '')}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-accent"
                style={{ width: `${(s.totalEfficaces / max) * 100}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-xs text-slate-400">
              {s.totalEfficaces}/{s.totalCible}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
