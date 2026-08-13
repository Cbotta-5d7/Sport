import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { etatsGroupes } from '../../db/queries'
import { tableauBordSemaine, phraseSynthese, alerteImpossible } from '../../db/dashboard'
import { formatDelaiRelatif, formatPlageSemaineFR, nomJourSemaineFR, jourSemaineIndex } from '../../utils/dates'
import { IndicateurSync } from '../reglages/IndicateurSync'
import { KpiBandeau } from './KpiBandeau'
import { RecapClotureSemaine } from './RecapClotureSemaine'
import type { GroupeMusculaire } from '../../db/types'

interface Props {
  onContinuer: (groupes: GroupeMusculaire[]) => void
  onOuvrirReglages: () => void
  onOuvrirExercices: () => void
  onOuvrirReperes: () => void
  onOuvrirPoids: () => void
  onOuvrirGlobale: () => void
  onOuvrirGroupe: (groupe: GroupeMusculaire) => void
  onOuvrirHistorique: () => void
}

const HEURES_RECUPERATION = 72

const CLASSES_DISPONIBILITE = {
  complete: 'bg-emerald-50 text-emerald-700',
  disponible: 'bg-amber-50 text-amber-700',
  indispo: 'bg-red-50 text-red-700',
}

export function AccueilScreen({
  onContinuer,
  onOuvrirReglages,
  onOuvrirExercices,
  onOuvrirReperes,
  onOuvrirPoids,
  onOuvrirGlobale,
  onOuvrirGroupe,
  onOuvrirHistorique,
}: Props) {
  const [tri, setTri] = useState(false)
  const [selection, setSelection] = useState<GroupeMusculaire[]>([])

  const etats = useLiveQuery(() => etatsGroupes(), [], undefined)
  const tableau = useLiveQuery(() => tableauBordSemaine(), [], null)

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
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 text-slate-600"
            aria-label="Réglages"
          >
            ⚙
          </button>
        </div>
      </header>

      {tableau && (
        <p className="mb-3 text-sm text-slate-500">
          {formatPlageSemaineFR(maintenant)}, {nomJourSemaineFR(maintenant)}, J+{jourSemaineIndex(maintenant)}.{' '}
          {tableau.seancesFaites} séance{tableau.seancesFaites > 1 ? 's' : ''} sur {tableau.seancesCible}.
        </p>
      )}

      <KpiBandeau />

      {tableau && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white shadow-sm px-4 py-3">
          <p className="text-sm text-slate-700">{phraseSynthese(tableau)}</p>
          {alerteImpossible(tableau) && (
            <p className="mt-2 text-sm text-amber-600">{alerteImpossible(tableau)}</p>
          )}
        </div>
      )}

      {maintenant.getDay() === 0 && <RecapClotureSemaine />}

      <div className="mb-4 flex gap-2 overflow-x-auto">
        <button type="button" onClick={onOuvrirExercices} className="min-h-10 shrink-0 rounded-xl border border-slate-300 px-3 text-sm text-slate-600">
          Exercices
        </button>
        <button type="button" onClick={onOuvrirReperes} className="min-h-10 shrink-0 rounded-xl border border-slate-300 px-3 text-sm text-slate-600">
          ★ Repères
        </button>
        <button type="button" onClick={onOuvrirPoids} className="min-h-10 shrink-0 rounded-xl border border-slate-300 px-3 text-sm text-slate-600">
          Poids de corps
        </button>
        <button type="button" onClick={onOuvrirGlobale} className="min-h-10 shrink-0 rounded-xl border border-slate-300 px-3 text-sm text-slate-600">
          Vue globale
        </button>
        <button type="button" onClick={onOuvrirHistorique} className="min-h-10 shrink-0 rounded-xl border border-slate-300 px-3 text-sm text-slate-600">
          Historique
        </button>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-500">Groupes musculaires</h2>
        <button
          type="button"
          onClick={() => setTri((t) => !t)}
          className="min-h-9 rounded-xl border border-slate-300 px-3 text-xs text-slate-600"
        >
          Trier par délai
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {etatsTries.map((etat) => {
          const stat = statsParGroupe.get(etat.groupe)
          const quotaAtteint = stat ? stat.seriesEfficaces >= stat.cibleSeries : false
          const disponible = etat.heuresDepuisDerniere === null || etat.heuresDepuisDerniere >= HEURES_RECUPERATION
          const couleur = CLASSES_DISPONIBILITE[quotaAtteint ? 'complete' : disponible ? 'disponible' : 'indispo']
          const selectionne = selection.includes(etat.groupe)
          const reste = stat ? Math.max(0, stat.cibleSeries - stat.seriesEfficaces) : null
          const progression = stat && stat.cibleSeries > 0 ? Math.min(100, (stat.seriesEfficaces / stat.cibleSeries) * 100) : 0
          return (
            <div
              key={etat.groupe}
              role="button"
              tabIndex={0}
              onClick={() => basculer(etat.groupe)}
              onKeyDown={(e) => e.key === 'Enter' && basculer(etat.groupe)}
              className={`flex cursor-pointer flex-col gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-left transition ${couleur} ${
                selectionne ? 'ring-2 ring-accent' : ''
              }`}
            >
              <div className="flex min-h-11 items-center justify-between">
                <div>
                  <p className="text-lg font-medium text-slate-900">{etat.groupe}</p>
                  <p className="text-sm opacity-80">
                    {etat.joursDepuisDerniere === null
                      ? 'Jamais fait'
                      : formatDelaiRelatif(etat.joursDepuisDerniere)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right text-sm opacity-80">
                    <p>{stat?.totalSeries ?? 0} séries</p>
                    <p>
                      {stat?.seriesEfficaces ?? 0} efficaces · cible {stat?.cibleSeries ?? '—'}
                      {reste !== null && reste > 0 ? ` · reste ${reste}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOuvrirGroupe(etat.groupe)
                    }}
                    className="flex min-h-9 min-w-9 items-center justify-center rounded-xl border border-current text-xs opacity-70"
                    aria-label={`Statistiques ${etat.groupe}`}
                  >
                    📈
                  </button>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                <div className="h-full bg-accent" style={{ width: `${progression}%` }} />
              </div>
            </div>
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
            className="min-h-14 w-full max-w-md rounded-2xl bg-accent px-6 text-lg font-semibold text-slate-950 shadow-lg"
          >
            Voir les exercices ({selection.length})
          </button>
        </div>
      )}
    </div>
  )
}
