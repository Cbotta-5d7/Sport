import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import type { Exercice, Serie } from '../../db/types'
import {
  seanceExercicesAvecDetails,
  seriesPourSeanceExercice,
  historiqueExercice,
  seriesEfficacesSemaine,
} from '../../db/queries'
import { lirePrevisionSeries, definirPrevisionSeries } from '../../db/prevision'
import { demarrerMinuteur, ajusterMinuteur } from '../../db/minuteur'
import { detecterRecord } from '../../db/records'
import { supprimerSeance, supprimerSeanceExercice } from '../../db/historique'
import { nowIso } from '../../utils/dates'
import { formatKg } from '../../utils/nombres'
import { calculerSuggestion, texteConsigne, texteCommentaire } from '../../utils/progression'
import { calculerComparaisonTonnage } from '../../utils/tonnageComparaison'
import { detecterDepassementLarge, detecterChuteReps } from '../../utils/coach'
import { useChronometre, formatDuree } from '../../hooks/useChronometre'
import { useWakeLock } from '../../hooks/useWakeLock'
import { vibrerCourt } from '../../utils/vibration'
import { MinuteurRepos } from './MinuteurRepos'
import { EntreeSerie } from './EntreeSerie'
import { BlocDerniereFois } from './BlocDerniereFois'
import { BlocTonnage } from './BlocTonnage'
import { ModaleChoixExercice } from './ModaleChoixExercice'
import { ModaleNoteSeance } from './ModaleNoteSeance'
import { AlerteFinSeance, type AlerteGroupe } from './AlerteFinSeance'
import { IndicateurSync } from '../reglages/IndicateurSync'

interface Props {
  seanceId: number
  onTerminee: () => void
  onAnnulee: () => void
}

interface EntreeEnCours {
  poidsKg: number
  reps: number
  rir: number | null
}

export function SeanceScreen({ seanceId, onTerminee, onAnnulee }: Props) {
  const seance = useLiveQuery(() => db.seances.get(seanceId), [seanceId])
  const seanceExercices = useLiveQuery(() => seanceExercicesAvecDetails(seanceId), [seanceId], [])

  const [ongletActif, setOngletActif] = useState(0)
  const indexActif = Math.min(ongletActif, Math.max(0, seanceExercices.length - 1))
  const seActuel = seanceExercices[indexActif]

  useWakeLock(true)
  const dureeSec = useChronometre(seance?.dateDebut)

  const seriesActuelles = useLiveQuery(
    () => (seActuel ? seriesPourSeanceExercice(seActuel.id) : Promise.resolve([] as Serie[])),
    [seActuel?.id],
    [] as Serie[],
  )

  const prevision = useLiveQuery(
    () => (seActuel ? lirePrevisionSeries(seActuel.id) : Promise.resolve(null)),
    [seActuel?.id],
    null,
  )

  const [historiqueExo, setHistoriqueExo] = useState<{ seance: { date: string }; series: Serie[] }[]>([])
  useEffect(() => {
    if (!seActuel) return
    let annule = false
    historiqueExercice(seActuel.exerciceId, 5).then((h) => {
      if (!annule) setHistoriqueExo(h)
    })
    return () => {
      annule = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seActuel?.exerciceId])

  const [entree, setEntree] = useState<EntreeEnCours>({ poidsKg: 0, reps: 0, rir: null })
  const [entreeReduite, setEntreeReduite] = useState(false)
  const [confirmationAnnulation, setConfirmationAnnulation] = useState(false)
  const [annulationEnCours, setAnnulationEnCours] = useState(false)
  const [confirmationSuppressionExo, setConfirmationSuppressionExo] = useState(false)

  useEffect(() => {
    setCoach(null)
    setDernierRecord(null)
    setEntreeReduite(false)
  }, [seActuel?.id])

  useEffect(() => {
    if (!seActuel) return
    if (seriesActuelles.length > 0) {
      const derniere = seriesActuelles[seriesActuelles.length - 1]
      setEntree({ poidsKg: derniere.poidsKg, reps: derniere.reps, rir: null })
      return
    }
    const dernieresTravail = (historiqueExo[0]?.series ?? []).filter((s) => s.type !== 'échauffement')
    const avantDernieresTravail = (historiqueExo[1]?.series ?? []).filter((s) => s.type !== 'échauffement')
    const suggestion = calculerSuggestion(seActuel.exercice, dernieresTravail, avantDernieresTravail)
    setEntree({ poidsKg: suggestion.poidsKg, reps: suggestion.repsCible, rir: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seActuel?.id, seriesActuelles.length, historiqueExo])

  const [modaleChoix, setModaleChoix] = useState<'ajouter' | 'remplacer' | null>(null)
  const [indexRemplacement, setIndexRemplacement] = useState<number | null>(null)
  const [modaleNote, setModaleNote] = useState(false)
  const [alertes, setAlertes] = useState<AlerteGroupe[] | null>(null)
  const [coach, setCoach] = useState<{ texte: string; action: () => void } | null>(null)
  const [dernierRecord, setDernierRecord] = useState<string | null>(null)
  const longPressRef = useRef<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  const idsGroupeActif = seanceExercices
    .filter((se) => se.exercice.groupeMusculaire === seActuel?.exercice.groupeMusculaire)
    .map((se) => se.id)

  const seriesGroupeActif = useLiveQuery(
    () => (idsGroupeActif.length ? db.series.where('seanceExerciceId').anyOf(idsGroupeActif).toArray() : Promise.resolve([] as Serie[])),
    [idsGroupeActif.join(',')],
    [] as Serie[],
  )

  const previsionsGroupe = useLiveQuery(
    () => Promise.all(idsGroupeActif.map((id) => lirePrevisionSeries(id))),
    [idsGroupeActif.join(',')],
    [] as (number | null)[],
  )

  const cibleGroupeActif = useLiveQuery(
    async () => (seActuel ? db.ciblesVolume.get(seActuel.exercice.groupeMusculaire) : undefined),
    [seActuel?.exercice.groupeMusculaire],
    undefined,
  )

  const efficacesSemaineGroupe = useLiveQuery(
    () => (seActuel ? seriesEfficacesSemaine(seActuel.exercice.groupeMusculaire) : Promise.resolve(0)),
    [seActuel?.exercice.groupeMusculaire, seriesGroupeActif.length],
    0,
  )

  const compteursParExercice = useLiveQuery(
    async () => {
      const entries = await Promise.all(
        seanceExercices.map(async (se) => {
          const [prevu, series] = await Promise.all([lirePrevisionSeries(se.id), seriesPourSeanceExercice(se.id)])
          const fait = series.filter((s) => s.type !== 'échauffement').length
          return [se.id, { fait, prevu: prevu ?? se.exercice.seriesCibleDefaut }] as const
        }),
      )
      return new Map(entries)
    },
    [seanceExercices.map((se) => se.id).join(',')],
    new Map<number, { fait: number; prevu: number }>(),
  )

  if (!seance || seanceExercices.length === 0 || !seActuel) {
    return <div className="flex min-h-dvh items-center justify-center text-slate-400">Chargement…</div>
  }

  const nbTravailGroupe = seriesGroupeActif.filter((s) => s.type !== 'échauffement').length
  const nbPrevuGroupe = previsionsGroupe.reduce((acc: number, p) => acc + (p ?? 3), 0)

  const estDerniereSerie = seriesActuelles.length + 1 >= (prevision ?? Infinity)
  const dernieresTravail = (historiqueExo[0]?.series ?? []).filter((s) => s.type !== 'échauffement')
  const avantDernieresTravail = (historiqueExo[1]?.series ?? []).filter((s) => s.type !== 'échauffement')
  const suggestion = calculerSuggestion(seActuel.exercice, dernieresTravail, avantDernieresTravail)
  const historiqueRecentSeries = historiqueExo.map((h) => h.series)
  const comparaisonTonnage = calculerComparaisonTonnage(seriesActuelles, dernieresTravail.length ? dernieresTravail : null, historiqueRecentSeries, prevision)

  async function validerSerie() {
    if (!seActuel) return
    if (estDerniereSerie && entree.rir === null) return

    setCoach(null)
    const maintenant = nowIso()
    const derniereValidee = seriesActuelles[seriesActuelles.length - 1]
    if (derniereValidee) {
      const reposReel = Math.round(
        (new Date(maintenant).getTime() - new Date(derniereValidee.horodatage).getTime()) / 1000,
      )
      await db.series.update(derniereValidee.id, { reposReelSec: Math.max(0, reposReel) })
    }

    const record = await detecterRecord(seActuel.exerciceId, entree.poidsKg, entree.reps)
    const estRecord = record.poids || record.rm || record.volume

    const numeroSerie = seriesActuelles.length + 1
    const nouvelId = await db.series.add({
      seanceExerciceId: seActuel.id,
      numeroSerie,
      poidsKg: entree.poidsKg,
      reps: entree.reps,
      type: 'normale',
      rir: estDerniereSerie ? entree.rir : null,
      reposReelSec: null,
      validee: true,
      estRecord,
      horodatage: maintenant,
    })

    if (estRecord) {
      const libelles = [
        record.poids && 'meilleur poids',
        record.rm && 'meilleur 1RM estimé',
        record.volume && 'meilleur volume sur une série',
      ].filter(Boolean)
      setDernierRecord(`Record : ${libelles.join(', ')} sur ${seActuel.exercice.nom} !`)
    }

    if (estDerniereSerie && entree.rir !== null) {
      const rirFinal = entree.rir
      const autres = await db.series.where('seanceExerciceId').equals(seActuel.id).toArray()
      await Promise.all(
        autres.filter((s) => s.id !== nouvelId && s.rir !== rirFinal).map((s) => db.series.update(s.id, { rir: rirFinal })),
      )
      await db.seanceExercices.update(seActuel.id, { statut: 'fait' })
    } else if (seActuel.statut === 'a_faire') {
      await db.seanceExercices.update(seActuel.id, { statut: 'en_cours' })
    }

    if (detecterDepassementLarge(entree.reps, seActuel.exercice.repsCibleMax)) {
      const incrementKg = seActuel.exercice.incrementKg
      setCoach({
        texte: 'Large dépassement de l\'objectif. Monter le poids dès la série suivante ?',
        action: () =>
          setEntree((e) => ({ ...e, poidsKg: e.poidsKg + incrementKg, reps: seActuel.exercice.repsCibleMin })),
      })
    } else if (derniereValidee && detecterChuteReps(entree.reps, derniereValidee.reps)) {
      setCoach({
        texte: 'Chute de reps : repos trop court ou charge trop lourde. Ajouter 30 s de repos ?',
        action: () => ajusterMinuteur(30),
      })
    }

    await demarrerMinuteur(seActuel.exercice.reposDefautSec, nouvelId)
    vibrerCourt()
  }

  async function ajouterUneSerie() {
    if (!seActuel) return
    const nouvelle = (prevision ?? seriesActuelles.length) + 1
    await definirPrevisionSeries(seActuel.id, nouvelle)
    if (seActuel.statut === 'fait') {
      await db.seanceExercices.update(seActuel.id, { statut: 'en_cours' })
    }
  }

  async function passerExercice() {
    if (!seActuel) return
    await db.seanceExercices.update(seActuel.id, { statut: 'passe' })
    if (indexActif < seanceExercices.length - 1) setOngletActif(indexActif + 1)
  }

  async function supprimerExercice() {
    if (!seActuel || seanceExercices.length <= 1) return
    await supprimerSeanceExercice(seActuel.id)
    setConfirmationSuppressionExo(false)
    setOngletActif((i) => Math.max(0, Math.min(i, seanceExercices.length - 2)))
  }

  function demanderSuppressionExercice() {
    if (!seActuel || seanceExercices.length <= 1) return
    if (seriesActuelles.length > 0) {
      setConfirmationSuppressionExo(true)
    } else {
      supprimerExercice()
    }
  }

  async function ajouterExercice(exercice: Exercice) {
    const ordre = Math.max(...seanceExercices.map((s) => s.ordre), -1) + 1
    const nouvelSEId = await db.seanceExercices.add({
      seanceId,
      exerciceId: exercice.id,
      ordre,
      statut: 'a_faire',
      remplaceExerciceId: null,
    })
    await definirPrevisionSeries(nouvelSEId, exercice.seriesCibleDefaut)
    setModaleChoix(null)
    setOngletActif(seanceExercices.length)
  }

  async function remplacerExercice(nouvelExercice: Exercice) {
    if (indexRemplacement === null) return
    const cible = seanceExercices[indexRemplacement]
    const seriesExistantes = await seriesPourSeanceExercice(cible.id)

    if (seriesExistantes.length === 0) {
      await db.seanceExercices.update(cible.id, { exerciceId: nouvelExercice.id })
    } else {
      if (cible.statut !== 'fait') {
        await db.seanceExercices.update(cible.id, { statut: 'passe' })
      }
      const ordre = Math.max(...seanceExercices.map((s) => s.ordre), -1) + 1
      const previsionAncienne = await lirePrevisionSeries(cible.id)
      const nouvelSEId = await db.seanceExercices.add({
        seanceId,
        exerciceId: nouvelExercice.id,
        ordre,
        statut: 'a_faire',
        remplaceExerciceId: cible.exerciceId,
      })
      await definirPrevisionSeries(nouvelSEId, previsionAncienne ?? 3)
      setOngletActif(seanceExercices.length)
    }
    setModaleChoix(null)
    setIndexRemplacement(null)
  }

  function demarrerAppuiLong(index: number) {
    longPressRef.current = window.setTimeout(() => {
      setIndexRemplacement(index)
      setModaleChoix('remplacer')
    }, 550)
  }
  function annulerAppuiLong() {
    if (longPressRef.current !== null) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
  }

  async function calculerAlertes(): Promise<AlerteGroupe[]> {
    const groupes = new Map<string, typeof seanceExercices>()
    for (const se of seanceExercices) {
      const liste = groupes.get(se.exercice.groupeMusculaire) ?? []
      liste.push(se)
      groupes.set(se.exercice.groupeMusculaire, liste)
    }

    const resultat: AlerteGroupe[] = []
    for (const [groupe, liste] of groupes) {
      const exercicesIncomplets: { nom: string; fait: number; prevu: number }[] = []
      for (const se of liste) {
        const series = await seriesPourSeanceExercice(se.id)
        const fait = series.filter((s) => s.type !== 'échauffement').length
        const prevu = (await lirePrevisionSeries(se.id)) ?? fait
        if (fait === 0) {
          exercicesIncomplets.push({ nom: se.exercice.nom, fait, prevu })
        }
      }
      if (exercicesIncomplets.length === 0) continue

      const cible = await db.ciblesVolume.get(groupe as Exercice['groupeMusculaire'])
      const efficaces = await seriesEfficacesSemaine(groupe as Exercice['groupeMusculaire'])
      const manque = Math.max(0, (cible?.seriesCibleSemaine ?? 0) - efficaces)

      resultat.push({
        groupe: groupe as Exercice['groupeMusculaire'],
        exercicesIncomplets,
        seriesManquantesSemaine: manque,
      })
    }
    return resultat
  }

  async function demanderTerminer() {
    const a = await calculerAlertes()
    if (a.length > 0) {
      setAlertes(a)
    } else {
      await finaliser()
    }
  }

  async function finaliser() {
    const maintenant = nowIso()
    await db.seances.update(seanceId, {
      statut: 'terminee',
      dateFin: maintenant,
      dureeSec,
    })
    setAlertes(null)
    onTerminee()
  }

  async function confirmerAnnulation() {
    setAnnulationEnCours(true)
    await supprimerSeance(seanceId)
    onAnnulee()
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="flex shrink-0 flex-col gap-1 border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">
            {formatDuree(dureeSec)} <MinuteurRepos />
          </span>
          <div className="flex items-center gap-2">
            <IndicateurSync />
            <button
              type="button"
              onClick={() => setModaleNote(true)}
              className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm text-slate-600"
            >
              Note
            </button>
            <button
              type="button"
              onClick={demanderTerminer}
              className="min-h-10 rounded-xl bg-accent px-4 text-sm font-semibold text-white"
            >
              Terminer
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {seActuel.exercice.groupeMusculaire} : {idsGroupeActif.length} exercices, {nbTravailGroupe}/
            {nbPrevuGroupe} séries
          </p>
          <button
            type="button"
            onClick={() => (seance.dejaTerminee ? onAnnulee() : setConfirmationAnnulation(true))}
            className="min-h-8 rounded-lg px-2 text-xs text-slate-400"
          >
            {seance.dejaTerminee ? 'Quitter' : 'Annuler la séance'}
          </button>
        </div>
        {cibleGroupeActif && (
          <div>
            <p className="text-xs text-slate-400">
              Semaine : {efficacesSemaineGroupe}/{cibleGroupeActif.seriesCibleSemaine} séries efficaces
            </p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-accent"
                style={{
                  width: `${Math.min(100, (efficacesSemaineGroupe / cibleGroupeActif.seriesCibleSemaine) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </header>

      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2">
        {seanceExercices.map((se, i) => {
          const compteur = compteursParExercice.get(se.id)
          return (
            <button
              key={se.id}
              type="button"
              onClick={() => setOngletActif(i)}
              onPointerDown={() => demarrerAppuiLong(i)}
              onPointerUp={annulerAppuiLong}
              onPointerLeave={annulerAppuiLong}
              className={`flex min-h-11 shrink-0 flex-col items-center rounded-xl border px-3 py-1 text-sm select-none ${
                i === indexActif ? 'border-accent bg-orange-50 text-accent' : 'border-slate-200 text-slate-500'
              } ${se.statut === 'fait' ? 'opacity-60' : ''} ${se.statut === 'passe' ? 'opacity-30 line-through' : ''}`}
            >
              <span>{se.exercice.nom}</span>
              {compteur && (
                <span className={`text-xs font-semibold ${compteur.fait >= compteur.prevu ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {compteur.fait}/{compteur.prevu}
                </span>
              )}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setModaleChoix('ajouter')}
          className="min-h-11 shrink-0 rounded-xl border border-dashed border-slate-300 px-3 text-sm text-slate-500"
        >
          + Exercice
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return
          const delta = e.changedTouches[0].clientX - touchStartX.current
          if (delta < -60 && indexActif < seanceExercices.length - 1) setOngletActif(indexActif + 1)
          if (delta > 60 && indexActif > 0) setOngletActif(indexActif - 1)
          touchStartX.current = null
        }}
      >
        <span className="mb-2 inline-flex min-h-8 items-center rounded-full bg-slate-900 px-3 text-sm font-semibold text-white">
          Série {seriesActuelles.length}/{prevision ?? seActuel.exercice.seriesCibleDefaut}
        </span>
        <p className="mb-2 text-3xl font-bold text-slate-900">{texteConsigne(suggestion)}</p>
        {suggestion.regle !== 'premiere_fois' && (
          <p className="mb-4 text-sm text-slate-500">{texteCommentaire(suggestion, dernieresTravail)}</p>
        )}

        <div className="mb-4">
          <BlocDerniereFois
            exerciceId={seActuel.exerciceId}
            exerciceRemplaceId={seActuel.remplaceExerciceId}
            seriesActuelles={seriesActuelles}
          />
        </div>

        <div className="mb-4">
          <BlocTonnage comparaison={comparaisonTonnage} />
        </div>

        {dernierRecord && (
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2">
            <p className="text-sm text-amber-700">🏆 {dernierRecord}</p>
            <button type="button" onClick={() => setDernierRecord(null)} className="min-h-8 min-w-8 text-amber-500">
              ✕
            </button>
          </div>
        )}

        {coach && (
          <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-sky-300 bg-sky-50 px-3 py-2">
            <p className="text-sm text-sky-700">{coach.texte}</p>
            <button
              type="button"
              onClick={() => {
                coach.action()
                setCoach(null)
              }}
              className="min-h-10 shrink-0 rounded-xl bg-sky-700 px-3 text-sm text-white"
            >
              Appliquer
            </button>
          </div>
        )}

        {seriesActuelles.length > 0 && (
          <div className="mb-4 flex flex-col gap-1">
            {seriesActuelles.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <span className="text-slate-600">
                  Série {s.numeroSerie} · {formatKg(s.poidsKg)} kg x {s.reps}
                </span>
                <button
                  type="button"
                  onClick={() => db.series.delete(s.id)}
                  className="min-h-8 min-w-8 text-slate-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={ajouterUneSerie}
            className="min-h-11 flex-1 rounded-xl border border-slate-300 text-sm text-slate-600"
          >
            + Ajouter une série
          </button>
          <button
            type="button"
            onClick={passerExercice}
            className="min-h-11 flex-1 rounded-xl border border-slate-300 text-sm text-slate-600"
          >
            Passer cet exercice
          </button>
          <button
            type="button"
            onClick={demanderSuppressionExercice}
            disabled={seanceExercices.length <= 1}
            aria-label="Supprimer cet exercice"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-red-200 text-red-500 disabled:opacity-30"
          >
            🗑
          </button>
        </div>
      </div>

      <div className="shrink-0">
        <button
          type="button"
          onClick={() => setEntreeReduite((r) => !r)}
          className="flex w-full items-center justify-center gap-2 border-t border-slate-200 bg-white py-1.5"
          style={{ paddingBottom: entreeReduite ? 'calc(env(safe-area-inset-bottom) + 0.375rem)' : undefined }}
        >
          <span className="h-1 w-10 rounded-full bg-slate-300" />
          {entreeReduite && (
            <span className="text-xs text-slate-500">
              Série {seriesActuelles.length + 1} · {formatKg(entree.poidsKg)} kg x {entree.reps} · toucher pour agrandir
            </span>
          )}
        </button>
        {!entreeReduite && (
          <EntreeSerie
            numeroSerie={seriesActuelles.length + 1}
            poidsKg={entree.poidsKg}
            reps={entree.reps}
            incrementKg={seActuel.exercice.incrementKg}
            rir={entree.rir}
            estDerniereSerie={estDerniereSerie}
            onChangerPoids={(poids) => setEntree((e) => ({ ...e, poidsKg: poids }))}
            onChangerReps={(reps) => setEntree((e) => ({ ...e, reps }))}
            onChoisirRir={(rir) => setEntree((e) => ({ ...e, rir }))}
            onValider={validerSerie}
          />
        )}
      </div>

      {modaleChoix && (
        <ModaleChoixExercice
          titre={modaleChoix === 'ajouter' ? 'Ajouter un exercice' : 'Remplacer par'}
          exclureId={modaleChoix === 'remplacer' && indexRemplacement !== null ? seanceExercices[indexRemplacement].exerciceId : undefined}
          onChoisir={modaleChoix === 'ajouter' ? ajouterExercice : remplacerExercice}
          onFermer={() => {
            setModaleChoix(null)
            setIndexRemplacement(null)
          }}
        />
      )}

      {modaleNote && (
        <ModaleNoteSeance
          noteInitiale={seance.notes}
          onEnregistrer={async (note) => {
            await db.seances.update(seanceId, { notes: note })
            setModaleNote(false)
          }}
          onFermer={() => setModaleNote(false)}
        />
      )}

      {alertes && (
        <AlerteFinSeance alertes={alertes} onRetourSeance={() => setAlertes(null)} onTerminer={finaliser} />
      )}

      {confirmationAnnulation && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={() => setConfirmationAnnulation(false)}>
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-5"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Annuler cette séance ?</h2>
            <p className="mb-4 text-sm text-slate-500">
              Toutes les séries saisies depuis le lancement seront effacées. Ton historique des séances
              précédentes n'est pas concerné.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmationAnnulation(false)}
                className="min-h-14 flex-1 rounded-2xl border border-slate-300 text-slate-600"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={confirmerAnnulation}
                disabled={annulationEnCours}
                className="min-h-14 flex-1 rounded-2xl bg-red-600 font-semibold text-white disabled:opacity-40"
              >
                Annuler la séance
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmationSuppressionExo && seActuel && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={() => setConfirmationSuppressionExo(false)}>
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-5"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Supprimer {seActuel.exercice.nom} ?</h2>
            <p className="mb-4 text-sm text-slate-500">
              {seriesActuelles.length > 1
                ? `${seriesActuelles.length} séries déjà validées sur cet exercice seront effacées.`
                : '1 série déjà validée sur cet exercice sera effacée.'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmationSuppressionExo(false)}
                className="min-h-14 flex-1 rounded-2xl border border-slate-300 text-slate-600"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={supprimerExercice}
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
