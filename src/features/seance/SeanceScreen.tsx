import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import type { Exercice, Serie, TypeSerie } from '../../db/types'
import {
  seanceExercicesAvecDetails,
  seriesPourSeanceExercice,
  historiqueExercice,
  seriesEfficacesSemaine,
} from '../../db/queries'
import { lirePrevisionSeries, definirPrevisionSeries } from '../../db/prevision'
import { demarrerMinuteur, ajusterMinuteur } from '../../db/minuteur'
import { detecterRecord } from '../../db/records'
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

interface Props {
  seanceId: number
  onTerminee: () => void
}

interface EntreeEnCours {
  poidsKg: number
  reps: number
  rir: number | null
  type: TypeSerie
}

export function SeanceScreen({ seanceId, onTerminee }: Props) {
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

  const [entree, setEntree] = useState<EntreeEnCours>({ poidsKg: 0, reps: 0, rir: null, type: 'normale' })

  useEffect(() => {
    setCoach(null)
    setDernierRecord(null)
  }, [seActuel?.id])

  useEffect(() => {
    if (!seActuel) return
    if (seriesActuelles.length > 0) {
      const derniere = seriesActuelles[seriesActuelles.length - 1]
      setEntree({ poidsKg: derniere.poidsKg, reps: derniere.reps, rir: null, type: 'normale' })
      return
    }
    const dernieresTravail = (historiqueExo[0]?.series ?? []).filter((s) => s.type !== 'échauffement')
    const avantDernieresTravail = (historiqueExo[1]?.series ?? []).filter((s) => s.type !== 'échauffement')
    const suggestion = calculerSuggestion(seActuel.exercice, dernieresTravail, avantDernieresTravail)
    setEntree({ poidsKg: suggestion.poidsKg, reps: suggestion.repsCible, rir: null, type: 'normale' })
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

  if (!seance || seanceExercices.length === 0 || !seActuel) {
    return <div className="flex min-h-dvh items-center justify-center text-slate-500">Chargement…</div>
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

    const record =
      entree.type !== 'échauffement'
        ? await detecterRecord(seActuel.exerciceId, entree.poidsKg, entree.reps)
        : { poids: false, rm: false, volume: false }
    const estRecord = record.poids || record.rm || record.volume

    const numeroSerie = seriesActuelles.length + 1
    const nouvelId = await db.series.add({
      seanceExerciceId: seActuel.id,
      numeroSerie,
      poidsKg: entree.poidsKg,
      reps: entree.reps,
      type: entree.type,
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

  async function ajouterExercice(exercice: Exercice) {
    const ordre = Math.max(...seanceExercices.map((s) => s.ordre), -1) + 1
    const nouvelSEId = await db.seanceExercices.add({
      seanceId,
      exerciceId: exercice.id,
      ordre,
      statut: 'a_faire',
      remplaceExerciceId: null,
    })
    await definirPrevisionSeries(nouvelSEId, 3)
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
        if (fait < prevu) {
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

  return (
    <div className="flex min-h-dvh flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="flex flex-col gap-1 border-b border-slate-800 bg-slate-950 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-50">{formatDuree(dureeSec)}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModaleNote(true)}
              className="min-h-10 rounded-lg border border-slate-700 px-3 text-sm text-slate-300"
            >
              Note
            </button>
            <button
              type="button"
              onClick={demanderTerminer}
              className="min-h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-slate-950"
            >
              Terminer
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          {seActuel.exercice.groupeMusculaire} : {idsGroupeActif.length} exercices, {nbTravailGroupe}/
          {nbPrevuGroupe} séries
        </p>
        {cibleGroupeActif && (
          <div>
            <p className="text-xs text-slate-500">
              Semaine : {efficacesSemaineGroupe}/{cibleGroupeActif.seriesCibleSemaine} séries efficaces
            </p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
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

      <div className="flex gap-2 overflow-x-auto border-b border-slate-800 px-2 py-2">
        {seanceExercices.map((se, i) => (
          <button
            key={se.id}
            type="button"
            onClick={() => setOngletActif(i)}
            onPointerDown={() => demarrerAppuiLong(i)}
            onPointerUp={annulerAppuiLong}
            onPointerLeave={annulerAppuiLong}
            className={`min-h-11 shrink-0 rounded-lg border px-3 text-sm select-none ${
              i === indexActif ? 'border-accent bg-slate-900 text-accent' : 'border-slate-800 text-slate-400'
            } ${se.statut === 'fait' ? 'opacity-60' : ''} ${se.statut === 'passe' ? 'opacity-30 line-through' : ''}`}
          >
            {se.exercice.nom}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setModaleChoix('ajouter')}
          className="min-h-11 shrink-0 rounded-lg border border-dashed border-slate-700 px-3 text-sm text-slate-400"
        >
          + Exercice
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ paddingBottom: '20rem' }}
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
        <p className="mb-2 text-3xl font-bold text-slate-50">{texteConsigne(suggestion)}</p>
        {suggestion.regle !== 'premiere_fois' && (
          <p className="mb-4 text-sm text-slate-400">{texteCommentaire(suggestion, dernieresTravail)}</p>
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
          <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-600 bg-amber-950/40 px-3 py-2">
            <p className="text-sm text-amber-300">🏆 {dernierRecord}</p>
            <button type="button" onClick={() => setDernierRecord(null)} className="min-h-8 min-w-8 text-amber-500">
              ✕
            </button>
          </div>
        )}

        {coach && (
          <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-sky-700 bg-sky-950/40 px-3 py-2">
            <p className="text-sm text-sky-300">{coach.texte}</p>
            <button
              type="button"
              onClick={() => {
                coach.action()
                setCoach(null)
              }}
              className="min-h-10 shrink-0 rounded-lg bg-sky-800 px-3 text-sm text-slate-100"
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
                className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-300">
                  Série {s.numeroSerie} · {formatKg(s.poidsKg)} kg x {s.reps}
                  {s.type !== 'normale' ? ` · ${s.type}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => db.series.delete(s.id)}
                  className="min-h-8 min-w-8 text-slate-500"
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
            className="min-h-11 flex-1 rounded-lg border border-slate-700 text-sm text-slate-300"
          >
            + Ajouter une série
          </button>
          <button
            type="button"
            onClick={passerExercice}
            className="min-h-11 flex-1 rounded-lg border border-slate-700 text-sm text-slate-300"
          >
            Passer cet exercice
          </button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 flex flex-col">
        <MinuteurRepos />
        <EntreeSerie
          numeroSerie={seriesActuelles.length + 1}
          poidsKg={entree.poidsKg}
          reps={entree.reps}
          incrementKg={seActuel.exercice.incrementKg}
          rir={entree.rir}
          type={entree.type}
          estDerniereSerie={estDerniereSerie}
          onChangerPoids={(poids) => setEntree((e) => ({ ...e, poidsKg: poids }))}
          onChangerReps={(reps) => setEntree((e) => ({ ...e, reps }))}
          onChoisirRir={(rir) => setEntree((e) => ({ ...e, rir }))}
          onChangerType={(type) => setEntree((e) => ({ ...e, type }))}
          onValider={validerSerie}
        />
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
    </div>
  )
}
