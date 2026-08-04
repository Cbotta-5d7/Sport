import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { etatsGroupes } from '../../db/queries'
import { tableauBordSemaine, phraseSynthese, alerteImpossible, type TableauBordSemaine } from '../../db/dashboard'
import { formatDelaiRelatif, formatPlageSemaineFR, nomJourSemaineFR, jourSemaineIndex } from '../../utils/dates'
import { IndicateurSync } from '../reglages/IndicateurSync'
import { KpiBandeau } from './KpiBandeau'
import { RecapClotureSemaine } from './RecapClotureSemaine'
import type { GroupeMusculaire } from '../../db/types'

interface Props {
  onContinuer: (groupes: GroupeMusculaire[]) => void
  onOuvrirReglages: () => void
}

const CLASSES_COULEUR_VOLUME: Record<string, string> = {
  vert: 'border-emerald-700 bg-emerald-950 text-emerald-300',
  orange: 'border-amber-700 bg-amber-950 text-amber-300',
  rouge: 'border-red-700 bg-red-950 text-red-300',
  violet: 'border-violet-700 bg-violet-950 text-violet-300',
}

export function AccueilScreen({ onContinuer, onOuvrirReglages }: Props) {
  const [tri, setTri] = useState(false)
  const [selection, setSelection] = useState<GroupeMusculaire[]>([])
  const [tableau, setTableau] = useState<TableauBordSemaine | null>(null)

  const etats = useLiveQuery(() => etatsGroupes(), [], undefined)

  useEffect(() => {
    let annule = false
    tableauBordSemaine().then((t) => {
      if (!annule) setTableau(t)
    })
    return () => {
      annule = true
    }
  }, [etats])

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

  const statsParGroupe = new Map((tableau?.groupes ?? []).map((g) => [g.groupe, g]))
  const maintenant = new Date()

  return (
    <div
      className="flex min-h-dvh flex-col px-4 pb-28"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Musculation</h1>
        <div className="flex items-center gap-2">
          <IndicateurSync onClick={onOuvrirReglages} />
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

      {tableau && (
        <p className="mb-3 text-sm text-slate-400">
          {formatPlageSemaineFR(maintenant)}, {nomJourSemaineFR(maintenant)}, J+{jourSemaineIndex(maintenant)}.{' '}
          {tableau.seancesFaites} séance{tableau.seancesFaites > 1 ? 's' : ''} sur {tableau.seancesCible}.
        </p>
      )}

      <KpiBandeau />

      {tableau && (
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
          <p className="text-sm text-slate-200">{phraseSynthese(tableau)}</p>
          {alerteImpossible(tableau) && (
            <p className="mt-2 text-sm text-amber-400">{alerteImpossible(tableau)}</p>
          )}
        </div>
      )}

      {maintenant.getDay() === 0 && <RecapClotureSemaine />}

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-400">Groupes musculaires</h2>
        <button
          type="button"
          onClick={() => setTri((t) => !t)}
          className="min-h-9 rounded-lg border border-slate-700 px-3 text-xs text-slate-300"
        >
          Trier par délai
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {etatsTries.map((etat) => {
          const stat = statsParGroupe.get(etat.groupe)
          const couleur = stat ? CLASSES_COULEUR_VOLUME[stat.couleur] : 'border-slate-700 bg-slate-900 text-slate-300'
          const selectionne = selection.includes(etat.groupe)
          const reste = stat ? Math.max(0, stat.cibleSeries - stat.seriesEfficaces) : null
          return (
            <button
              key={etat.groupe}
              type="button"
              onClick={() => basculer(etat.groupe)}
              className={`flex min-h-14 items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition ${couleur} ${
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
                {stat && stat.totalSeries !== stat.seriesEfficaces ? (
                  <p>
                    {stat.seriesEfficaces} eff. / {stat.totalSeries} séries
                  </p>
                ) : (
                  <p>{stat?.seriesEfficaces ?? 0} séries</p>
                )}
                <p>
                  cible {stat?.cibleSeries ?? '—'}
                  {reste !== null && reste > 0 ? ` · reste ${reste}` : ''}
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
