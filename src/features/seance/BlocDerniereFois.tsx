import { useLiveQuery } from 'dexie-react-hooks'
import { derniereSeanceExercicePourExercice, historiqueExercice } from '../../db/queries'
import { formatKg } from '../../utils/nombres'
import { formatDateLongueFR } from '../../utils/dates'

interface Props {
  exerciceId: number
  exerciceRemplaceId?: number | null
}

interface InfoDerniereFois {
  aHistorique: boolean
  estReference: boolean
  idPourHistorique: number | null
}

async function chargerInfo(exerciceId: number, exerciceRemplaceId?: number | null): Promise<InfoDerniereFois> {
  const propre = await derniereSeanceExercicePourExercice(exerciceId)
  if (propre) {
    return { aHistorique: true, estReference: false, idPourHistorique: exerciceId }
  }
  if (exerciceRemplaceId) {
    const reference = await derniereSeanceExercicePourExercice(exerciceRemplaceId)
    if (reference) {
      return { aHistorique: true, estReference: true, idPourHistorique: exerciceRemplaceId }
    }
  }
  return { aHistorique: false, estReference: false, idPourHistorique: null }
}

export function BlocDerniereFois({ exerciceId, exerciceRemplaceId }: Props) {
  const info = useLiveQuery(() => chargerInfo(exerciceId, exerciceRemplaceId), [exerciceId, exerciceRemplaceId], null)
  const idPourHistorique = info?.idPourHistorique ?? null
  const historique = useLiveQuery(
    () => (idPourHistorique !== null ? historiqueExercice(idPourHistorique, 3) : Promise.resolve(null)),
    [idPourHistorique],
    null,
  )

  if (info === null) return null
  const { aHistorique, estReference } = info

  if (!aHistorique) {
    return <p className="text-sm text-slate-400">Première fois sur cet exercice.</p>
  }

  return (
    <div className={estReference ? 'opacity-60' : ''}>
      {estReference && <p className="mb-1 text-xs text-slate-400">Référence (ancien exercice)</p>}
      {historique && (
        <div className="flex flex-col gap-2">
          {historique.map((h, i) => (
            <div key={i} className="truncate rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <span className="text-slate-400">{formatDateLongueFR(new Date(h.seance.date))} :</span>{' '}
              <span className="text-slate-800">
                {h.series.map((s) => `${formatKg(s.poidsKg)}x${s.reps}`).join(', ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
