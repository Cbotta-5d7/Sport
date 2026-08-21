import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
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
import {
  chargeEt1RMParSeance,
  tonnageParSeance,
  nuagePoidsReps,
  repartitionParFourchette,
  type PointChargeRM,
  type PointTonnageSeance,
  type PointNuage,
  type RepartitionReps,
} from '../../db/graphiques'
import { ModaleEditionExercice } from './ModaleEditionExercice'
import { ModaleNoteExercice } from './ModaleNoteExercice'

const AXE_STYLE = { fontSize: 11, fill: '#64748b' }
const TOOLTIP_STYLE = { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }

interface Props {
  exerciceId: number
  onRetour: () => void
}

export function ExerciceDetailScreen({ exerciceId, onRetour }: Props) {
  const exercice = useLiveQuery(async () => (await db.exercices.get(exerciceId)) ?? null, [exerciceId], null)
  const chargeRM = useLiveQuery(() => chargeEt1RMParSeance(exerciceId), [exerciceId], [] as PointChargeRM[])
  const tonnage = useLiveQuery(() => tonnageParSeance(exerciceId), [exerciceId], [] as PointTonnageSeance[])
  const nuage = useLiveQuery(() => nuagePoidsReps(exerciceId), [exerciceId], [] as PointNuage[])
  const repartition = useLiveQuery(() => repartitionParFourchette(exerciceId), [exerciceId], [] as RepartitionReps[])
  const [editionOuverte, setEditionOuverte] = useState(false)
  const [modaleNoteOuverte, setModaleNoteOuverte] = useState(false)

  async function basculerRepere() {
    if (!exercice) return
    await db.exercices.update(exercice.id, { estRepere: !exercice.estRepere })
  }

  async function archiver() {
    if (!exercice) return
    await db.exercices.update(exercice.id, { archive: true })
    onRetour()
  }

  if (!exercice) {
    return <div className="flex min-h-dvh items-center justify-center text-slate-400">Chargement…</div>
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
          className="min-h-11 min-w-11 rounded-xl border border-slate-300 text-slate-600"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-900">{exercice.nom}</h1>
          <p className="text-xs text-slate-400">{exercice.groupeMusculaire}</p>
        </div>
        <button
          type="button"
          onClick={() => setModaleNoteOuverte(true)}
          aria-label={`Note sur ${exercice.nom}`}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 text-slate-600"
        >
          ℹ️
        </button>
        <button
          type="button"
          onClick={() => setEditionOuverte(true)}
          className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-600"
        >
          Modifier
        </button>
        <button
          type="button"
          onClick={basculerRepere}
          className={`flex min-h-11 min-w-11 items-center justify-center rounded-xl border text-lg ${
            exercice.estRepere ? 'border-amber-400 text-amber-600' : 'border-slate-300 text-slate-400'
          }`}
        >
          ★
        </button>
      </header>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Charge de travail et 1RM estimé (par séance)</h2>
      <div className="mb-6 h-44 rounded-2xl border border-slate-200 bg-white p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chargeRM}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={AXE_STYLE}
              tickFormatter={(d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
            />
            <YAxis tick={AXE_STYLE} width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="chargeMax" name="Charge max" stroke="#f97316" dot={false} strokeWidth={2} connectNulls />
            <Line type="monotone" dataKey="rm1" name="1RM estimé" stroke="#0284c7" dot={false} strokeWidth={2} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Tonnage par séance</h2>
      <div className="mb-6 h-44 rounded-2xl border border-slate-200 bg-white p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={tonnage}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="date" tick={AXE_STYLE} tickFormatter={(d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} />
            <YAxis tick={AXE_STYLE} width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="tonnage" name="Tonnage" fill="#94a3b8" />
            <Line type="monotone" dataKey="moyenne5" name="Moyenne 5 séances" stroke="#f97316" dot={false} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Nuage poids / reps</h2>
      <div className="mb-6 h-44 rounded-2xl border border-slate-200 bg-white p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid stroke="#e2e8f0" />
            <XAxis dataKey="reps" name="Reps" tick={AXE_STYLE} type="number" />
            <YAxis dataKey="poidsKg" name="Poids" tick={AXE_STYLE} type="number" width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={nuage} fill="#f97316" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Répartition des séries par fourchette de reps</h2>
      <div className="mb-6 h-44 rounded-2xl border border-slate-200 bg-white p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={repartition}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
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
        className="mt-auto min-h-12 rounded-2xl border border-red-300 text-sm text-red-600"
      >
        Archiver cet exercice
      </button>

      {editionOuverte && (
        <ModaleEditionExercice
          exercice={exercice}
          onEnregistre={() => {
            setEditionOuverte(false)
          }}
          onFermer={() => setEditionOuverte(false)}
        />
      )}

      {modaleNoteOuverte && (
        <ModaleNoteExercice
          nomExercice={exercice.nom}
          noteInitiale={exercice.notes}
          onEnregistrer={async (note) => {
            await db.exercices.update(exercice.id, { notes: note })
            setModaleNoteOuverte(false)
          }}
          onFermer={() => setModaleNoteOuverte(false)}
        />
      )}
    </div>
  )
}
