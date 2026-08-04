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
import type { Exercice, GroupeMusculaire } from '../../db/types'
import { exercicesActifsParGroupes } from '../../db/queries'
import {
  seriesEfficacesParSemaineGroupe,
  indiceChargeGroupe,
  frequenceHebdoGroupe,
  ecartCumuleGroupe,
  chargeEt1RMParSemaine,
  type PointSeriesSemaineGroupe,
  type PointIndiceCharge,
  type PointFrequence,
  type PointEcartCumule,
  type PointChargeRM,
} from '../../db/graphiques'

const AXE_STYLE = { fontSize: 11, fill: '#64748b' }
const TOOLTIP_STYLE = { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }

interface Props {
  groupe: GroupeMusculaire
  onRetour: () => void
}

export function GroupeDetailScreen({ groupe, onRetour }: Props) {
  const [series, setSeries] = useState<PointSeriesSemaineGroupe[]>([])
  const [indice, setIndice] = useState<PointIndiceCharge[]>([])
  const [frequence, setFrequence] = useState<PointFrequence[]>([])
  const [ecart, setEcart] = useState<PointEcartCumule[]>([])
  const [courbesExercices, setCourbesExercices] = useState<{ exercice: Exercice; points: PointChargeRM[] }[]>([])

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

  useEffect(() => {
    let annule = false
    async function charger() {
      const exercices = await exercicesActifsParGroupes([groupe])
      const points = await Promise.all(exercices.map((ex) => chargeEt1RMParSemaine(ex.id)))
      if (annule) return
      const avecDonnees = exercices
        .map((exercice, i) => ({ exercice, points: points[i] }))
        .filter((c) => c.points.some((p) => p.rm1 !== null))
      setCourbesExercices(avecDonnees)
    }
    charger()
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
          className="min-h-11 min-w-11 rounded-xl border border-slate-300 text-slate-600"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold">{groupe}</h1>
      </header>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Séries efficaces par semaine</h2>
      <div className="mb-6 h-44 rounded-2xl border border-slate-200 bg-white p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="semaine" tick={AXE_STYLE} />
            <YAxis tick={AXE_STYLE} width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="stepAfter" dataKey="cible" name="Cible" fill="#f1f5f9" stroke="none" />
            <Bar dataKey="efficaces" name="Séries efficaces" fill="#f97316" radius={[4, 4, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Indice de charge des exercices repères (base 100)</h2>
      <div className="mb-6 h-44 rounded-2xl border border-slate-200 bg-white p-2">
        {indice.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-400">Aucun repère dans ce groupe.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={indice}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="semaine" tick={AXE_STYLE} />
              <YAxis tick={AXE_STYLE} width={30} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="indice" name="Indice" stroke="#f97316" dot={false} strokeWidth={2} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Fréquence hebdomadaire</h2>
      <div className="mb-6 h-44 rounded-2xl border border-slate-200 bg-white p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={frequence}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="semaine" tick={AXE_STYLE} />
            <YAxis tick={AXE_STYLE} width={30} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="seances" name="Séances" fill="#0284c7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Écart cible/réalisé cumulé (12 semaines)</h2>
      <div className="mb-6 h-44 rounded-2xl border border-slate-200 bg-white p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={ecart}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="semaine" tick={AXE_STYLE} />
            <YAxis tick={AXE_STYLE} width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="ecartCumule" name="Écart cumulé" stroke="#f97316" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {courbesExercices.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-medium text-slate-500">Évolution par exercice (1RM estimé)</h2>
          <div className="mb-6 flex flex-col gap-3">
            {courbesExercices.map(({ exercice, points }) => (
              <div key={exercice.id} className="rounded-2xl border border-slate-200 bg-white p-2">
                <p className="px-2 pt-1 text-sm font-medium text-slate-700">{exercice.nom}</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={points}>
                      <CartesianGrid stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="semaine" tick={AXE_STYLE} />
                      <YAxis tick={AXE_STYLE} width={30} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Line
                        type="monotone"
                        dataKey="rm1"
                        name="1RM estimé"
                        stroke="#0284c7"
                        dot={false}
                        strokeWidth={2}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
