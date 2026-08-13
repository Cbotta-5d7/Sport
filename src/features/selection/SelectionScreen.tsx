import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Exercice, GroupeMusculaire } from '../../db/types'
import {
  exercicesActifsParGroupes,
  idsExercicesDerniereSeance,
  seriesSemaineGroupe,
} from '../../db/queries'
import { db } from '../../db/schema'
import { ModaleCreationExercice } from '../exercices/ModaleCreationExercice'
import { nowIso } from '../../utils/dates'
import { definirPrevisionSeries } from '../../db/prevision'

interface Props {
  groupes: GroupeMusculaire[]
  onRetour: () => void
  onDemarrer: (seanceId: number) => void
}

interface SelectionExercice {
  coche: boolean
  seriesPrevues: number
}

function distribuerSeries(restant: number, nbExercices: number): number {
  if (nbExercices === 0) return 3
  if (restant <= 0) return 3
  return Math.min(6, Math.max(1, Math.round(restant / nbExercices)))
}

export function SelectionScreen({ groupes, onRetour, onDemarrer }: Props) {
  const [selections, setSelections] = useState<Record<number, SelectionExercice>>({})
  const [groupePourCreation, setGroupePourCreation] = useState<GroupeMusculaire | null>(null)
  const [demarrageEnCours, setDemarrageEnCours] = useState(false)
  const cleInitialisee = useRef<string | null>(null)

  const donnees = useLiveQuery(
    async () => {
      const [liste, dejaCochesSet, restants] = await Promise.all([
        exercicesActifsParGroupes(groupes),
        idsExercicesDerniereSeance(groupes),
        Promise.all(
          groupes.map(async (g) => {
            const cible = await db.ciblesVolume.get(g)
            const faites = await seriesSemaineGroupe(g)
            return [g, Math.max(0, (cible?.seriesCibleSemaine ?? 0) - faites)] as const
          }),
        ),
      ])
      return { liste, dejaCochesSet, restantMap: Object.fromEntries(restants) as Record<string, number> }
    },
    [groupes],
    null,
  )

  const exercices = donnees?.liste ?? []
  const restantParGroupe = donnees?.restantMap ?? {}

  useEffect(() => {
    if (!donnees) return
    const cle = groupes.join(',')
    if (cleInitialisee.current === cle) return
    cleInitialisee.current = cle

    const nbCochesParGroupe: Record<string, number> = {}
    for (const e of donnees.liste) {
      if (donnees.dejaCochesSet.has(e.id!)) {
        nbCochesParGroupe[e.groupeMusculaire] = (nbCochesParGroupe[e.groupeMusculaire] ?? 0) + 1
      }
    }

    const initSelections: Record<number, SelectionExercice> = {}
    for (const e of donnees.liste) {
      const coche = donnees.dejaCochesSet.has(e.id!)
      initSelections[e.id!] = {
        coche,
        seriesPrevues: distribuerSeries(
          donnees.restantMap[e.groupeMusculaire] ?? 0,
          nbCochesParGroupe[e.groupeMusculaire] ?? 1,
        ),
      }
    }
    setSelections(initSelections)
  }, [donnees, groupes])

  function basculerExercice(id: number) {
    setSelections((s) => ({ ...s, [id]: { ...s[id], coche: !s[id]?.coche } }))
  }

  function changerSeries(id: number, delta: number) {
    setSelections((s) => ({
      ...s,
      [id]: { ...s[id], seriesPrevues: Math.max(1, (s[id]?.seriesPrevues ?? 3) + delta) },
    }))
  }

  function ajouterExerciceCree(exercice: Exercice) {
    setSelections((s) => ({ ...s, [exercice.id!]: { coche: true, seriesPrevues: 3 } }))
    setGroupePourCreation(null)
  }

  const exercicesCoches = exercices.filter((e) => selections[e.id!]?.coche)
  const totalSeriesParGroupe: Record<string, number> = {}
  for (const e of exercicesCoches) {
    totalSeriesParGroupe[e.groupeMusculaire] =
      (totalSeriesParGroupe[e.groupeMusculaire] ?? 0) + (selections[e.id!]?.seriesPrevues ?? 0)
  }

  async function demarrer() {
    if (exercicesCoches.length === 0 || demarrageEnCours) return
    setDemarrageEnCours(true)
    const maintenant = nowIso()
    const seanceId = await db.seances.add({
      date: maintenant,
      dateDebut: maintenant,
      dateFin: null,
      dureeSec: 0,
      statut: 'en_cours',
      notes: '',
      dejaTerminee: false,
    })
    for (const [index, e] of exercicesCoches.entries()) {
      const seanceExerciceId = await db.seanceExercices.add({
        seanceId,
        exerciceId: e.id,
        ordre: index,
        statut: 'a_faire',
        remplaceExerciceId: null,
      })
      await definirPrevisionSeries(seanceExerciceId, selections[e.id]?.seriesPrevues ?? 3)
    }
    onDemarrer(seanceId)
  }

  return (
    <div
      className="flex min-h-dvh flex-col px-4 pb-32"
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
        <h1 className="text-xl font-semibold">Choix des exercices</h1>
      </header>

      {groupes.map((groupe) => {
        const restant = restantParGroupe[groupe] ?? 0
        const exosGroupe = exercices.filter((e) => e.groupeMusculaire === groupe)
        const totalGroupe = totalSeriesParGroupe[groupe] ?? 0
        const depasseVingt = totalGroupe > 20

        return (
          <section key={groupe} className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-800">{groupe}</h2>
              <button
                type="button"
                onClick={() => setGroupePourCreation(groupe)}
                className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm text-accent"
              >
                + Nouvel exercice
              </button>
            </div>

            <p className="mb-2 text-sm text-slate-500">
              {restant > 0
                ? `Il te reste ${restant} séries de ${groupe.toLowerCase()} cette semaine`
                : `Cible ${groupe.toLowerCase()} déjà atteinte cette semaine`}
            </p>

            {depasseVingt && (
              <p className="mb-2 rounded-xl border border-violet-300 bg-violet-50 px-3 py-2 text-sm text-violet-700">
                Attention, le total de la semaine sur {groupe.toLowerCase()} dépasserait 20 séries.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {exosGroupe.map((e) => {
                const sel = selections[e.id!]
                return (
                  <div
                    key={e.id}
                    className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-2 ${
                      sel?.coche ? 'border-accent bg-white' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => basculerExercice(e.id!)}
                      className="flex min-h-10 flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${
                          sel?.coche ? 'border-accent bg-accent text-slate-950' : 'border-slate-300'
                        }`}
                      >
                        {sel?.coche ? '✓' : ''}
                      </span>
                      <span className="text-slate-800">{e.nom}</span>
                    </button>

                    {sel?.coche && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changerSeries(e.id!, -1)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-lg text-slate-600"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-slate-800">{sel.seriesPrevues}</span>
                        <button
                          type="button"
                          onClick={() => changerSeries(e.id!, 1)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-lg text-slate-600"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {groupePourCreation && (
        <ModaleCreationExercice
          groupe={groupePourCreation}
          onCree={ajouterExerciceCree}
          onFermer={() => setGroupePourCreation(null)}
        />
      )}

      <div
        className="fixed inset-x-0 bottom-0 flex justify-center px-4 pb-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        <button
          type="button"
          onClick={demarrer}
          disabled={exercicesCoches.length === 0 || demarrageEnCours}
          className="min-h-14 w-full max-w-md rounded-2xl bg-accent px-6 text-lg font-semibold text-slate-950 shadow-lg disabled:opacity-40"
        >
          C'est parti
        </button>
      </div>
    </div>
  )
}
