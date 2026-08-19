import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Exercice, GroupeMusculaire } from '../../db/types'
import {
  listerProgrammes,
  exercicesProgramme,
  creerProgramme,
  renommerProgramme,
  supprimerProgramme,
  ajouterExerciceProgramme,
  retirerExerciceProgramme,
  majSeriesProgramme,
  deplacerExerciceProgramme,
  totalSeriesParGroupeProgramme,
  type ProgrammeExerciceAvecExercice,
} from '../../db/programme'
import { ModaleChoixExercice } from '../seance/ModaleChoixExercice'

interface Props {
  onRetour: () => void
}

function JourProgramme({
  programmeId,
  nom,
  groupesEnTrop,
}: {
  programmeId: number
  nom: string
  groupesEnTrop: Set<GroupeMusculaire>
}) {
  const exercices = useLiveQuery(
    () => exercicesProgramme(programmeId),
    [programmeId],
    [] as ProgrammeExerciceAvecExercice[],
  )
  const [renommage, setRenommage] = useState(false)
  const [nomEdite, setNomEdite] = useState(nom)
  const [modaleChoix, setModaleChoix] = useState(false)
  const [confirmationSuppression, setConfirmationSuppression] = useState(false)

  const totalSeries = exercices.reduce((a, e) => a + e.seriesCibles, 0)

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        {renommage ? (
          <input
            autoFocus
            value={nomEdite}
            onChange={(e) => setNomEdite(e.target.value)}
            onBlur={async () => {
              setRenommage(false)
              if (nomEdite.trim()) await renommerProgramme(programmeId, nomEdite.trim())
              else setNomEdite(nom)
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="min-h-9 flex-1 rounded-lg border border-accent px-2 text-lg font-semibold text-slate-900 outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setRenommage(true)}
            className="text-lg font-semibold text-slate-900"
          >
            {nom}
          </button>
        )}
        <span className="shrink-0 text-xs text-slate-400">{totalSeries} séries</span>
        <button
          type="button"
          onClick={() => setConfirmationSuppression(true)}
          aria-label={`Supprimer ${nom}`}
          className="flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-lg text-red-400"
        >
          🗑
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {exercices.map((pe, index) => {
          const enTrop = groupesEnTrop.has(pe.exercice.groupeMusculaire)
          return (
          <div
            key={pe.id}
            className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
              enTrop ? 'border-red-300 bg-red-50' : 'border-slate-200'
            }`}
          >
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                onClick={() => deplacerExerciceProgramme(programmeId, pe.id, 'haut')}
                disabled={index === 0}
                aria-label={`Monter ${pe.exercice.nom}`}
                className="flex h-6 w-6 items-center justify-center text-slate-400 disabled:opacity-20"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => deplacerExerciceProgramme(programmeId, pe.id, 'bas')}
                disabled={index === exercices.length - 1}
                aria-label={`Descendre ${pe.exercice.nom}`}
                className="flex h-6 w-6 items-center justify-center text-slate-400 disabled:opacity-20"
              >
                ▼
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-800">{pe.exercice.nom}</p>
              <p className={`text-xs ${enTrop ? 'text-red-500' : 'text-slate-400'}`}>{pe.exercice.groupeMusculaire}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => majSeriesProgramme(pe.id, pe.seriesCibles - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
              >
                −
              </button>
              <span className="w-6 text-center text-sm text-slate-800">{pe.seriesCibles}</span>
              <button
                type="button"
                onClick={() => majSeriesProgramme(pe.id, pe.seriesCibles + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => retirerExerciceProgramme(pe.id)}
              aria-label={`Retirer ${pe.exercice.nom}`}
              className="min-h-8 min-w-8 text-slate-400"
            >
              ✕
            </button>
          </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setModaleChoix(true)}
        className="mt-2 min-h-10 w-full rounded-xl border border-dashed border-slate-300 text-sm text-slate-500"
      >
        + Exercice
      </button>

      {modaleChoix && (
        <ModaleChoixExercice
          titre={`Ajouter à ${nom}`}
          onChoisir={async (exercice: Exercice) => {
            await ajouterExerciceProgramme(programmeId, exercice)
            setModaleChoix(false)
          }}
          onFermer={() => setModaleChoix(false)}
        />
      )}

      {confirmationSuppression && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/60"
          onClick={() => setConfirmationSuppression(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-5"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Supprimer {nom} ?</h2>
            <p className="mb-4 text-sm text-slate-500">Cette séance-type et ses exercices seront supprimés.</p>
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
                onClick={() => supprimerProgramme(programmeId)}
                className="min-h-14 flex-1 rounded-2xl bg-red-600 font-semibold text-white"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ProgrammeScreen({ onRetour }: Props) {
  const programmes = useLiveQuery(() => listerProgrammes(), [], undefined)
  const totaux = useLiveQuery(() => totalSeriesParGroupeProgramme(), [programmes], [])

  const groupesEnTrop = new Set(
    totaux.filter((t) => t.cible > 0 && t.totalProgramme > t.cible).map((t) => t.groupe),
  )

  async function ajouterJour() {
    await creerProgramme(`Jour ${(programmes?.length ?? 0) + 1}`)
  }

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
        <h1 className="text-xl font-semibold">Programme</h1>
      </header>

      <p className="mb-4 text-sm text-slate-500">
        Ton programme sert de repère : à toi de le suivre en lançant une séance depuis Accueil sur les groupes du
        jour. Ajuste les exercices et les séries ici.
      </p>

      {!programmes && <p className="text-slate-400">Chargement…</p>}

      {programmes?.map((p) => (
        <JourProgramme key={p.id} programmeId={p.id} nom={p.nom} groupesEnTrop={groupesEnTrop} />
      ))}

      <button
        type="button"
        onClick={ajouterJour}
        className="mb-6 min-h-12 rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500"
      >
        + Ajouter un jour
      </button>

      <h2 className="mb-2 text-sm font-medium text-slate-500">Récap par groupe musculaire</h2>
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200">
        {totaux.map((t) => {
          const enTrop = t.cible > 0 && t.totalProgramme > t.cible
          return (
            <div
              key={t.groupe}
              className={`flex justify-between border-b border-slate-200 px-4 py-2 last:border-0 ${
                enTrop ? 'bg-red-50' : ''
              }`}
            >
              <span className={enTrop ? 'text-red-700' : 'text-slate-800'}>{t.groupe}</span>
              <span className={enTrop ? 'font-semibold text-red-700' : 'text-slate-500'}>
                {t.totalProgramme} / {t.cible} séries
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
