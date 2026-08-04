import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { etatsGroupes } from '../../db/queries'
import { couleurDelai, CLASSES_COULEUR_DELAI } from '../../utils/etatGroupe'
import { formatDelaiRelatif } from '../../utils/dates'
import { IndicateurSync } from '../reglages/IndicateurSync'
import type { GroupeMusculaire } from '../../db/types'

interface Props {
  onContinuer: (groupes: GroupeMusculaire[]) => void
  onOuvrirReglages: () => void
}

export function AccueilScreen({ onContinuer, onOuvrirReglages }: Props) {
  const [tri, setTri] = useState(false)
  const [selection, setSelection] = useState<GroupeMusculaire[]>([])

  const etats = useLiveQuery(() => etatsGroupes(), [], undefined)

  const etatsTries = useMemo(() => {
    if (!etats) return []
    if (tri) {
      return [...etats].sort((a, b) => {
        const ja = a.joursDepuisDerniere ?? Number.POSITIVE_INFINITY
        const jb = b.joursDepuisDerniere ?? Number.POSITIVE_INFINITY
        return jb - ja
      })
    }
    const enRetardDepuis10Jours = (j: number | null) => j !== null && j > 10
    return [...etats].sort((a, b) => {
      const aEnRetard = enRetardDepuis10Jours(a.joursDepuisDerniere)
      const bEnRetard = enRetardDepuis10Jours(b.joursDepuisDerniere)
      if (aEnRetard !== bEnRetard) return aEnRetard ? -1 : 1
      return 0
    })
  }, [etats, tri])

  function basculer(groupe: GroupeMusculaire) {
    setSelection((s) => (s.includes(groupe) ? s.filter((g) => g !== groupe) : [...s, groupe]))
  }

  return (
    <div
      className="flex min-h-dvh flex-col px-4 pb-28"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <header className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Musculation</h1>
        <div className="flex items-center gap-2">
          <IndicateurSync onClick={onOuvrirReglages} />
          <button
            type="button"
            onClick={() => setTri((t) => !t)}
            className="min-h-[44px] rounded-lg border border-slate-700 px-3 text-sm text-slate-300"
          >
            Trier par délai
          </button>
          <button
            type="button"
            onClick={onOuvrirReglages}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-700 text-slate-300"
            aria-label="Réglages"
          >
            ⚙
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {etatsTries.map((etat) => {
          const couleur = couleurDelai(etat)
          const selectionne = selection.includes(etat.groupe)
          return (
            <button
              key={etat.groupe}
              type="button"
              onClick={() => basculer(etat.groupe)}
              className={`flex min-h-14 items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition ${CLASSES_COULEUR_DELAI[couleur]} ${
                selectionne ? 'ring-2 ring-accent' : ''
              }`}
            >
              <div>
                <p className="text-lg font-medium text-slate-50">{etat.groupe}</p>
                <p className="text-sm opacity-80">
                  {etat.joursDepuisDerniere === null
                    ? 'Jamais fait'
                    : formatDelaiRelatif(etat.joursDepuisDerniere)}
                </p>
              </div>
              <div className="text-right text-sm opacity-80">
                <p>
                  {etat.seriesEfficacesSemaine}/{etat.cibleSeriesSemaine} séries
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {selection.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 flex justify-center px-4 pb-6"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
        >
          <button
            type="button"
            onClick={() => onContinuer(selection)}
            className="min-h-14 w-full max-w-md rounded-xl bg-accent px-6 text-lg font-semibold text-slate-950 shadow-lg"
          >
            Voir les exercices ({selection.length})
          </button>
        </div>
      )}
    </div>
  )
}
