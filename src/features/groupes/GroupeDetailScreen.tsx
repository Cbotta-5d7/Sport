import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  LineChart,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { GroupeMusculaire } from '../../db/types'
import {
  seriesEfficacesParSemaineGroupe,
  indiceChargeGroupe,
  frequenceHebdoGroupe,
  ecartCumuleGroupe,
  type PointSeriesSemaineGroupe,
  type PointIndiceCharge,
  type PointFrequence,
  type PointEcartCumule,
} from '../../db/graphiques'

const AXE_STYLE = { fontSize: 11, fill: '#64748b' }
const TOOLTIP_STYLE = { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }

interface Props {
  groupe: GroupeMusculaire
  onRetour: () => void
}

export function GroupeDetailScreen({ groupe, onRetour }: Props) {
  const [series, setSeries] = useState<PointSeriesSemaineGroupe[]>([])
  const [indice, setIndice] = useState<PointIndiceCharge[]>([])
  const [frequence, setFrequence] = useState<PointFrequence[]>([])
  const [ecart, setEcart] = useState<PointEcartCumule[]>([])

  useEffect(() => {
    let annule = false
    Promise.all([
      seriesEfficacesParSemaineGroupe(groupe),
      indiceChargeGroupe(groupe),
      frequenceHebdoGroupe(groupe),
      ecartCumuleGroupe(groupe),
    ]).then(([s, i, f, e]) => {
      if (annule) return
      setSeries(s)
      setIndice(i)
      setFrequence(f)
      setEcart(e)
    })
    return () => {
      annule = true
    }
  }, [groupe])

  return (
    <div
      className="flex min-h-dvh flex-col px-4 pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onRetour}
          className="min-h-11 min-w-11 rounded-lg border border-slate-700 text-slate-300"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold">{groupe}</h1>
      </header>

      <h2 className="mb-2 text-sm font-medium text-slate-400">Séries efficaces par semaine</h2>
      <div className="mb-6 h-44 rounded-xl border border-slate-800 bg-slate-900 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="semaine" tick={AXE_STYLE} />
            <YAxis tick={AXE_STYLE} width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="stepAfter" dataKey="cible" name="Cible" fill="#1e293b" stroke="none" />
            <Bar dataKey="efficaces" name="Séries efficaces" fill="#f97316" radius={[4, 4, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-400">Indice de charge des exercices repères (base 100)</h2>
      <div className="mb-6 h-44 rounded-xl border border-slate-800 bg-slate-900 p-2">
        {indice.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-500">Aucun repère dans ce groupe.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={indice}>
              <CartesianGrid stroke="#1e293b" vertical={false} />
              <XAxis dataKey="semaine" tick={AXE_STYLE} />
              <YAxis tick={AXE_STYLE} width={30} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="indice" name="Indice" stroke="#f97316" dot={false} strokeWidth={2} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-400">Fréquence hebdomadaire</h2>
      <div className="mb-6 h-44 rounded-xl border border-slate-800 bg-slate-900 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={frequence}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="semaine" tick={AXE_STYLE} />
            <YAxis tick={AXE_STYLE} width={30} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="seances" name="Séances" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-400">Écart cible/réalisé cumulé (12 semaines)</h2>
      <div className="mb-6 h-44 rounded-xl border border-slate-800 bg-slate-900 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={ecart}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="semaine" tick={AXE_STYLE} />
            <YAxis tick={AXE_STYLE} width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="ecartCumule" name="Écart cumulé" stroke="#f97316" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
