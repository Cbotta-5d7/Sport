import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Bar,
  ScatterChart,
  Scatter,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { db } from '../../db/schema'
import type { Exercice } from '../../db/types'
import {
  chargeEt1RMParSemaine,
  tonnageParSeance,
  nuagePoidsReps,
  repartitionParFourchette,
  type PointChargeRM,
  type PointTonnageSeance,
  type PointNuage,
  type RepartitionReps,
} from '../../db/graphiques'

const AXE_STYLE = { fontSize: 11, fill: '#64748b' }
const TOOLTIP_STYLE = { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }

interface Props {
  exerciceId: number
  onRetour: () => void
}

export function ExerciceDetailScreen({ exerciceId, onRetour }: Props) {
  const [exercice, setExercice] = useState<Exercice | null>(null)
  const [chargeRM, setChargeRM] = useState<PointChargeRM[]>([])
  const [tonnage, setTonnage] = useState<PointTonnageSeance[]>([])
  const [nuage, setNuage] = useState<PointNuage[]>([])
  const [repartition, setRepartition] = useState<RepartitionReps[]>([])

  useEffect(() => {
    let annule = false
    async function charger() {
      const [exo, cr, tn, nu, rep] = await Promise.all([
        db.exercices.get(exerciceId),
        chargeEt1RMParSemaine(exerciceId),
        tonnageParSeance(exerciceId),
        nuagePoidsReps(exerciceId),
        repartitionParFourchette(exerciceId),
      ])
      if (annule) return
      setExercice(exo ?? null)
      setChargeRM(cr)
      setTonnage(tn)
      setNuage(nu)
      setRepartition(rep)
    }
    charger()
    return () => {
      annule = true
    }
  }, [exerciceId])

  async function basculerRepere() {
    if (!exercice) return
    await db.exercices.update(exercice.id, { estRepere: !exercice.estRepere })
    setExercice({ ...exercice, estRepere: !exercice.estRepere })
  }

  async function archiver() {
    if (!exercice) return
    await db.exercices.update(exercice.id, { archive: true })
    onRetour()
  }

  if (!exercice) {
    return <div className="flex min-h-dvh items-center justify-center text-slate-500">Chargement…</div>
  }

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
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-50">{exercice.nom}</h1>
          <p className="text-xs text-slate-500">{exercice.groupeMusculaire}</p>
        </div>
        <button
          type="button"
          onClick={basculerRepere}
          className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg border text-lg ${
            exercice.estRepere ? 'border-amber-500 text-amber-400' : 'border-slate-700 text-slate-500'
          }`}
        >
          ★
        </button>
      </header>

      <h2 className="mb-2 text-sm font-medium text-slate-400">Charge de travail et 1RM estimé (12 semaines)</h2>
      <div className="mb-6 h-44 rounded-xl border border-slate-800 bg-slate-900 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chargeRM}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="semaine" tick={AXE_STYLE} />
            <YAxis tick={AXE_STYLE} width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="chargeMax" name="Charge max" stroke="#f97316" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="rm1" name="1RM estimé" stroke="#38bdf8" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-400">Tonnage par séance</h2>
      <div className="mb-6 h-44 rounded-xl border border-slate-800 bg-slate-900 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={tonnage}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" tick={AXE_STYLE} tickFormatter={(d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} />
            <YAxis tick={AXE_STYLE} width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="tonnage" name="Tonnage" fill="#334155" />
            <Line type="monotone" dataKey="moyenne5" name="Moyenne 5 séances" stroke="#f97316" dot={false} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-400">Nuage poids / reps</h2>
      <div className="mb-6 h-44 rounded-xl border border-slate-800 bg-slate-900 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid stroke="#1e293b" />
            <XAxis dataKey="reps" name="Reps" tick={AXE_STYLE} type="number" />
            <YAxis dataKey="poidsKg" name="Poids" tick={AXE_STYLE} type="number" width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={nuage} fill="#f97316" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-400">Répartition des séries par fourchette de reps</h2>
      <div className="mb-6 h-44 rounded-xl border border-slate-800 bg-slate-900 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={repartition}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="plage" tick={AXE_STYLE} />
            <YAxis tick={AXE_STYLE} width={30} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" name="Séries" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <button
        type="button"
        onClick={archiver}
        className="mt-auto min-h-12 rounded-xl border border-red-800 text-sm text-red-400"
      >
        Archiver cet exercice
      </button>
    </div>
  )
}
