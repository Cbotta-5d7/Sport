import type { Programme } from '../../db/types'

interface Props {
  programmes: Programme[]
  numeroSeanceSemaine: number
  onChoisir: (programme: Programme | null) => void
}

export function ModaleChoixProgramme({ programmes, numeroSeanceSemaine, onChoisir }: Props) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60">
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
      >
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Quel programme veux-tu faire ?</h2>
        <p className="mb-4 text-sm text-slate-500">
          Ce serait ta {numeroSeanceSemaine}
          {numeroSeanceSemaine === 1 ? 're' : 'e'} séance de la semaine.
        </p>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {programmes.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChoisir(p)}
              className="min-h-16 rounded-2xl border border-slate-300 text-xl font-semibold text-slate-900 active:border-accent active:bg-orange-50"
            >
              {p.nom}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChoisir(null)}
          className="min-h-12 w-full rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500"
        >
          Aucun programme (séance libre)
        </button>
      </div>
    </div>
  )
}
