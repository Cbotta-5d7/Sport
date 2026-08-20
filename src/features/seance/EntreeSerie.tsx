import { useState } from 'react'
import { useAppuiRepete } from '../../hooks/useAppuiRepete'
import { ClavierNumerique } from './ClavierNumerique'
import { CourbeCharge } from './CourbeCharge'
import type { ProgressionCharge } from '../../utils/progressionCharge'
import { formatKg } from '../../utils/nombres'

interface Props {
  numeroSerie: number
  totalSeries: number
  poidsKg: number
  reps: number
  incrementKg: number
  progressionCharge: ProgressionCharge
  onChangerPoids: (poids: number) => void
  onChangerReps: (reps: number) => void
  onValider: () => void
}

export function EntreeSerie({
  numeroSerie,
  totalSeries,
  poidsKg,
  reps,
  incrementKg,
  progressionCharge,
  onChangerPoids,
  onChangerReps,
  onValider,
}: Props) {
  const [clavier, setClavier] = useState<'poids' | 'reps' | null>(null)

  const appuiMoinsPoids = useAppuiRepete(() => onChangerPoids(Math.max(0, poidsKg - incrementKg)))
  const appuiPlusPoids = useAppuiRepete(() => onChangerPoids(poidsKg + incrementKg))
  const appuiMoinsReps = useAppuiRepete(() => onChangerReps(Math.max(0, reps - 1)))
  const appuiPlusReps = useAppuiRepete(() => onChangerReps(reps + 1))

  return (
    <div
      className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 pt-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
    >
      <p className="text-center text-sm text-slate-400">
        Série {numeroSerie}/{totalSeries}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          {...appuiMoinsPoids}
          className="flex min-h-14 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-800 select-none"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setClavier('poids')}
          className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border border-slate-300 px-1"
        >
          <span className="text-lg font-semibold text-slate-900">{formatKg(poidsKg)} kg</span>
        </button>
        <button
          type="button"
          {...appuiPlusPoids}
          className="flex min-h-14 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-800 select-none"
        >
          +
        </button>
        <button
          type="button"
          {...appuiMoinsReps}
          className="flex min-h-14 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-800 select-none"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setClavier('reps')}
          className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border border-slate-300 px-1"
        >
          <span className="text-lg font-semibold text-slate-900">{reps} reps</span>
        </button>
        <button
          type="button"
          {...appuiPlusReps}
          className="flex min-h-14 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-800 select-none"
        >
          +
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <CourbeCharge progression={progressionCharge} />
        </div>
        <button
          type="button"
          onClick={onValider}
          className="min-h-14 shrink-0 rounded-2xl bg-accent px-8 text-lg font-semibold text-slate-950"
        >
          Valider
        </button>
      </div>

      {clavier && (
        <ClavierNumerique
          titre={clavier === 'poids' ? 'Poids (kg)' : 'Répétitions'}
          valeurInitiale={clavier === 'poids' ? poidsKg : reps}
          autoriserDecimales={clavier === 'poids'}
          onValider={(valeur) => {
            if (clavier === 'poids') onChangerPoids(valeur)
            else onChangerReps(Math.round(valeur))
            setClavier(null)
          }}
          onFermer={() => setClavier(null)}
        />
      )}
    </div>
  )
}
