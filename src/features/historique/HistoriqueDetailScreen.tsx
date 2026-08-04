import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import type { Serie, TypeSerie } from '../../db/types'
import { seanceExercicesAvecDetails, type SeanceExerciceAvecExercice } from '../../db/queries'
import { supprimerSeance } from '../../db/historique'
import { formatDateLongueFR } from '../../utils/dates'
import { formatKg } from '../../utils/nombres'
import { OPTIONS_RIR } from '../../db/rir'
import { ClavierNumerique } from '../seance/ClavierNumerique'

const TYPES: TypeSerie[] = ['normale', 'échauffement', 'dégressive', 'échec']

interface Props {
  seanceId: number
  onRetour: () => void
  onSupprimee: () => void
}

interface ClavierCible {
  serieId: number
  champ: 'poidsKg' | 'reps'
}

export function HistoriqueDetailScreen({ seanceId, onRetour, onSupprimee }: Props) {
  const [seanceExercices, setSeanceExercices] = useState<SeanceExerciceAvecExercice[]>([])
  const [confirmationSuppression, setConfirmationSuppression] = useState(false)
  const [clavier, setClavier] = useState<ClavierCible | null>(null)

  const seance = useLiveQuery(() => db.seances.get(seanceId), [seanceId])
  const seriesToutes = useLiveQuery(
    () =>
      seanceExercices.length
        ? db.series.where('seanceExerciceId').anyOf(seanceExercices.map((se) => se.id)).toArray()
        : Promise.resolve([] as Serie[]),
    [seanceExercices.map((se) => se.id).join(',')],
    [] as Serie[],
  )

  useEffect(() => {
    let annule = false
    seanceExercicesAvecDetails(seanceId).then((liste) => {
      if (!annule) setSeanceExercices(liste)
    })
    return () => {
      annule = true
    }
  }, [seanceId])

  async function supprimerSerie(id: number) {
    await db.series.delete(id)
  }

  async function changerChamp(serie: Serie, champ: 'poidsKg' | 'reps', valeur: number) {
    await db.series.update(serie.id, { [champ]: valeur })
  }

  async function changerType(serie: Serie, type: TypeSerie) {
    await db.series.update(serie.id, { type })
  }

  async function changerRir(serie: Serie, rir: number) {
    await db.series.update(serie.id, { rir })
  }

  async function confirmerSuppressionSeance() {
    await supprimerSeance(seanceId)
    onSupprimee()
  }

  if (!seance) {
    return <div className="flex min-h-dvh items-center justify-center text-slate-400">Chargement…</div>
  }

  const serieCliquee = clavier ? seriesToutes.find((s) => s.id === clavier.serieId) : null

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
          <h1 className="text-lg font-semibold text-slate-900">{formatDateLongueFR(new Date(seance.date))}</h1>
        </div>
        <button
          type="button"
          onClick={() => setConfirmationSuppression(true)}
          className="min-h-10 rounded-xl border border-red-300 px-3 text-sm text-red-600"
        >
          Supprimer
        </button>
      </header>

      {seanceExercices.map((se) => {
        const series = seriesToutes.filter((s) => s.seanceExerciceId === se.id).sort((a, b) => a.numeroSerie - b.numeroSerie)
        if (series.length === 0) return null
        return (
          <div key={se.id} className="mb-5">
            <h2 className="mb-2 text-sm font-medium text-slate-600">{se.exercice.nom}</h2>
            <div className="flex flex-col gap-2">
              {series.map((s) => (
                <div key={s.id} className="rounded-2xl border border-slate-200 px-3 py-2">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs text-slate-400">Série {s.numeroSerie}</span>
                    <button
                      type="button"
                      onClick={() => setClavier({ serieId: s.id, champ: 'poidsKg' })}
                      className="min-h-9 flex-1 rounded-xl border border-slate-300 text-sm text-slate-800"
                    >
                      {formatKg(s.poidsKg)} kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setClavier({ serieId: s.id, champ: 'reps' })}
                      className="min-h-9 flex-1 rounded-xl border border-slate-300 text-sm text-slate-800"
                    >
                      {s.reps} reps
                    </button>
                    <button
                      type="button"
                      onClick={() => supprimerSerie(s.id)}
                      className="min-h-9 min-w-9 text-slate-400"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mb-1 flex gap-1 overflow-x-auto">
                    {TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => changerType(s, t)}
                        className={`min-h-7 shrink-0 rounded-lg border px-2 text-xs ${
                          s.type === t ? 'border-accent text-accent' : 'border-slate-300 text-slate-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {OPTIONS_RIR.map((o) => (
                      <button
                        key={o.valeur}
                        type="button"
                        onClick={() => changerRir(s, o.valeur)}
                        className={`min-h-7 flex-1 rounded-lg border text-xs ${
                          s.rir === o.valeur ? 'border-accent text-accent' : 'border-slate-300 text-slate-400'
                        }`}
                      >
                        {o.libelle}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {confirmationSuppression && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60" onClick={() => setConfirmationSuppression(false)}>
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-5"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Supprimer cette séance ?</h2>
            <p className="mb-4 text-sm text-slate-500">
              Toutes ses séries seront supprimées. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmationSuppression(false)}
                className="min-h-14 flex-1 rounded-2xl border border-slate-300 text-slate-600"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmerSuppressionSeance}
                className="min-h-14 flex-1 rounded-2xl bg-red-700 font-semibold text-slate-900"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {clavier && serieCliquee && (
        <ClavierNumerique
          titre={clavier.champ === 'poidsKg' ? 'Poids (kg)' : 'Répétitions'}
          valeurInitiale={clavier.champ === 'poidsKg' ? serieCliquee.poidsKg : serieCliquee.reps}
          autoriserDecimales={clavier.champ === 'poidsKg'}
          onValider={(valeur) => {
            changerChamp(serieCliquee, clavier.champ, clavier.champ === 'reps' ? Math.round(valeur) : valeur)
            setClavier(null)
          }}
          onFermer={() => setClavier(null)}
        />
      )}
    </div>
  )
}
