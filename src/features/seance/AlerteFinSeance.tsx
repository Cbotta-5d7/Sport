import { useState } from 'react'
import type { GroupeMusculaire } from '../../db/types'

export interface AlerteGroupe {
  groupe: GroupeMusculaire
  exercicesIncomplets: { nom: string; fait: number; prevu: number }[]
  seriesManquantesSemaine: number
}

interface Props {
  alertes: AlerteGroupe[]
  onRetourSeance: () => void
  onTerminer: () => void
}

export function AlerteFinSeance({ alertes, onRetourSeance, onTerminer }: Props) {
  const [ignorees, setIgnorees] = useState<Set<GroupeMusculaire>>(new Set())

  const restantes = alertes.filter((a) => !ignorees.has(a.groupe))

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70">
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-slate-900 p-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        <h2 className="mb-3 text-lg font-semibold text-slate-50">Séries non validées</h2>
        <div className="flex-1 overflow-y-auto">
          {restantes.map((a) => (
            <div key={a.groupe} className="mb-3 rounded-xl border border-amber-800 bg-amber-950/40 p-3">
              <p className="font-medium text-amber-300">
                ⚠ {a.groupe} :{' '}
                {a.exercicesIncomplets.reduce((n, e) => n + e.fait, 0)} séries validées sur{' '}
                {a.exercicesIncomplets.reduce((n, e) => n + e.prevu, 0)}
              </p>
              <p className="mt-1 text-sm text-amber-200">
                {a.exercicesIncomplets.map((e) => `${e.nom} ${e.fait}/${e.prevu}`).join(', ')}
              </p>
              {a.seriesManquantesSemaine > 0 && (
                <p className="mt-1 text-sm text-amber-200">
                  Il te manque {a.seriesManquantesSemaine} séries pour ta cible de la semaine
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onRetourSeance}
                  className="min-h-11 flex-1 rounded-lg border border-amber-700 text-sm text-amber-200"
                >
                  Ajouter une série
                </button>
                <button
                  type="button"
                  onClick={() => setIgnorees((s) => new Set(s).add(a.groupe))}
                  className="min-h-11 flex-1 rounded-lg bg-amber-800 text-sm text-slate-100"
                >
                  C'est voulu
                </button>
              </div>
            </div>
          ))}
          {restantes.length === 0 && (
            <p className="text-sm text-slate-400">Tout est pris en compte, tu peux terminer.</p>
          )}
        </div>
        <button
          type="button"
          onClick={onTerminer}
          disabled={restantes.length > 0}
          className="mt-3 min-h-14 rounded-xl bg-accent font-semibold text-slate-950 disabled:opacity-40"
        >
          Terminer la séance
        </button>
      </div>
    </div>
  )
}
