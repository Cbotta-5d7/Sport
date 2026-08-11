import { useLiveQuery } from 'dexie-react-hooks'
import { seanceEnCours } from '../../db/queries'
import { useChronometre, formatDuree } from '../../hooks/useChronometre'

interface Props {
  onReprendre: (seanceId: number) => void
}

export function BanniereSeanceEnCours({ onReprendre }: Props) {
  const seance = useLiveQuery(() => seanceEnCours(), [], undefined)
  const dureeSec = useChronometre(seance?.dateDebut)

  if (!seance) return null

  return (
    <button
      type="button"
      onClick={() => onReprendre(seance.id)}
      className="fixed inset-x-0 top-0 z-30 flex items-center justify-center gap-1.5 py-1 text-sm font-semibold text-slate-900/30"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      ⏱ Séance en cours · {formatDuree(dureeSec)} · reprendre
    </button>
  )
}
