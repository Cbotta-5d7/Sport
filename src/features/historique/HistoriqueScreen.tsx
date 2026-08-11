import { useLiveQuery } from 'dexie-react-hooks'
import { listerHistoriqueSeances } from '../../db/historique'
import { formatDateLongueFR } from '../../utils/dates'
import { formatDuree } from '../../hooks/useChronometre'
import { formatKg } from '../../utils/nombres'

interface Props {
  onRetour: () => void
  onOuvrirSeance: (seanceId: number) => void
}

export function HistoriqueScreen({ onRetour, onOuvrirSeance }: Props) {
  const seances = useLiveQuery(() => listerHistoriqueSeances(), [], undefined)

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
        <h1 className="text-xl font-semibold">Historique</h1>
      </header>

      {!seances && <p className="text-slate-400">Chargement…</p>}
      {seances && seances.length === 0 && <p className="text-sm text-slate-400">Aucune séance terminée.</p>}

      <div className="flex flex-col gap-2">
        {seances?.map((s) => (
          <button
            key={s.seance.id}
            type="button"
            onClick={() => onOuvrirSeance(s.seance.id)}
            className="flex flex-col items-start rounded-2xl border border-slate-200 px-4 py-3 text-left"
          >
            <span className="text-slate-800">{formatDateLongueFR(new Date(s.seance.date))}</span>
            <span className="text-xs text-slate-400">{s.groupes.join(', ')}</span>
            <span className="mt-1 text-xs text-slate-500">
              {formatDuree(s.seance.dureeSec)} · {s.nombreSeries} séries · {formatKg(s.tonnage)} kg
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
