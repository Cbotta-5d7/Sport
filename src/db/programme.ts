import { db } from './schema'
import type { Exercice, GroupeMusculaire, Programme, ProgrammeExercice } from './types'
import { GROUPES_PAR_PRIORITE } from './types'
import { estDansSemaine, nomJourSemaineFR } from '../utils/dates'
import { seanceExercicesAvecDetails } from './queries'

export interface TotalSeriesGroupe {
  groupe: GroupeMusculaire
  totalProgramme: number
  cible: number
}

export interface ProgrammeExerciceAvecExercice extends ProgrammeExercice {
  exercice: Exercice
}

export async function listerProgrammes(): Promise<Programme[]> {
  return (await db.programmes.toArray()).filter((p) => !p.archive).sort((a, b) => a.ordre - b.ordre)
}

function groupesProgramme(exos: { exercice: Exercice }[]): Set<GroupeMusculaire> {
  return new Set(exos.map((e) => e.exercice.groupeMusculaire))
}

function memeComposition(a: Set<GroupeMusculaire>, b: Set<GroupeMusculaire>): boolean {
  return a.size === b.size && [...a].every((g) => b.has(g))
}

export async function programmeDuJour(reference = new Date()): Promise<Programme | null> {
  const programmes = await listerProgrammes()
  if (programmes.length === 0) return null

  // Se base sur la séquence logique des programmes (leur ordre), pas sur le jour calendaire réel :
  // si la semaine est décalée (ex : mardi/mercredi/vendredi/samedi au lieu de lundi/mardi/jeudi/
  // vendredi), on propose le prochain programme de la séquence pas encore fait cette semaine.
  //
  // On ne compte PAS simplement le nombre de séances terminées cette semaine : une séance
  // improvisée (qui ne correspond à aucun programme, ex : un seul exercice isolé) ne doit pas
  // décaler la séquence. Seules les séances dont la composition (mêmes groupes musculaires)
  // correspond à un programme marquent ce programme comme "déjà fait".
  const groupesParProgramme = new Map<number, Set<GroupeMusculaire>>()
  for (const p of programmes) {
    groupesParProgramme.set(p.id, groupesProgramme(await exercicesProgramme(p.id)))
  }

  const seancesTermineesSemaine = (await db.seances.toArray()).filter(
    (s) => s.statut === 'terminee' && estDansSemaine(s.date, reference),
  )

  const idsProgrammesFaits = new Set<number>()
  for (const seance of seancesTermineesSemaine) {
    const groupesSeance = groupesProgramme(await seanceExercicesAvecDetails(seance.id))
    const programmeCorrespondant = programmes.find(
      (p) => !idsProgrammesFaits.has(p.id) && memeComposition(groupesSeance, groupesParProgramme.get(p.id)!),
    )
    if (programmeCorrespondant) idsProgrammesFaits.add(programmeCorrespondant.id)
  }

  const prochain = programmes.find((p) => !idsProgrammesFaits.has(p.id))
  if (prochain) return prochain

  // Repli si toute la séquence de la semaine a déjà été faite (ex : 5e séance) : correspondance par
  // jour calendaire réel, comme avant.
  const nomJour = nomJourSemaineFR(reference)
  return programmes.find((p) => p.nom.trim().toLowerCase() === nomJour) ?? null
}

export async function previsionProgrammeDuJour(
  exerciceId: number,
  reference = new Date(),
): Promise<number | undefined> {
  const programme = await programmeDuJour(reference)
  if (!programme) return undefined
  const liste = await exercicesProgramme(programme.id)
  return liste.find((pe) => pe.exerciceId === exerciceId)?.seriesCibles
}

export async function exercicesProgramme(programmeId: number): Promise<ProgrammeExerciceAvecExercice[]> {
  const liste = (await db.programmeExercices.where('programmeId').equals(programmeId).toArray()).sort(
    (a, b) => a.ordre - b.ordre,
  )
  const resultats: ProgrammeExerciceAvecExercice[] = []
  for (const pe of liste) {
    const exercice = await db.exercices.get(pe.exerciceId)
    if (exercice) resultats.push({ ...pe, exercice })
  }
  return resultats
}

export async function creerProgramme(nom: string): Promise<number> {
  const ordreMax = (await db.programmes.toArray()).reduce((max, p) => Math.max(max, p.ordre), -1)
  return db.programmes.add({ nom, ordre: ordreMax + 1, archive: false })
}

export async function renommerProgramme(programmeId: number, nom: string): Promise<void> {
  await db.programmes.update(programmeId, { nom })
}

export async function supprimerProgramme(programmeId: number): Promise<void> {
  await db.transaction('rw', db.programmes, db.programmeExercices, async () => {
    await db.programmeExercices.where('programmeId').equals(programmeId).delete()
    await db.programmes.delete(programmeId)
  })
}

export async function ajouterExerciceProgramme(programmeId: number, exercice: Exercice): Promise<number> {
  const ordreMax = (await db.programmeExercices.where('programmeId').equals(programmeId).toArray()).reduce(
    (max, pe) => Math.max(max, pe.ordre),
    -1,
  )
  return db.programmeExercices.add({
    programmeId,
    exerciceId: exercice.id,
    ordre: ordreMax + 1,
    seriesCibles: exercice.seriesCibleDefaut,
    repsCibleMin: exercice.repsCibleMin,
    repsCibleMax: exercice.repsCibleMax,
    reposSec: exercice.reposDefautSec,
  })
}

export async function retirerExerciceProgramme(programmeExerciceId: number): Promise<void> {
  await db.programmeExercices.delete(programmeExerciceId)
}

export async function majSeriesProgramme(programmeExerciceId: number, seriesCibles: number): Promise<void> {
  await db.programmeExercices.update(programmeExerciceId, { seriesCibles: Math.max(1, seriesCibles) })
}

export async function totalSeriesParGroupeProgramme(): Promise<TotalSeriesGroupe[]> {
  const [programmes, toutesLesLignes, cibles] = await Promise.all([
    listerProgrammes(),
    db.programmeExercices.toArray(),
    db.ciblesVolume.toArray(),
  ])
  const idsProgrammes = new Set(programmes.map((p) => p.id))
  const lignesActives = toutesLesLignes.filter((l) => idsProgrammes.has(l.programmeId))

  const exerciceParId = new Map(
    (await db.exercices.bulkGet(Array.from(new Set(lignesActives.map((l) => l.exerciceId))))).map((e) =>
      e ? [e.id, e] : null,
    ).filter((x): x is [number, Exercice] => x !== null),
  )

  const totalParGroupe = new Map<GroupeMusculaire, number>()
  for (const ligne of lignesActives) {
    const exercice = exerciceParId.get(ligne.exerciceId)
    if (!exercice) continue
    totalParGroupe.set(
      exercice.groupeMusculaire,
      (totalParGroupe.get(exercice.groupeMusculaire) ?? 0) + ligne.seriesCibles,
    )
  }

  const cibleParGroupe = new Map(cibles.map((c) => [c.groupeMusculaire, c.seriesCibleSemaine]))

  return GROUPES_PAR_PRIORITE.map((groupe) => ({
    groupe,
    totalProgramme: totalParGroupe.get(groupe) ?? 0,
    cible: cibleParGroupe.get(groupe) ?? 0,
  }))
}

export async function deplacerExerciceProgramme(
  programmeId: number,
  programmeExerciceId: number,
  direction: 'haut' | 'bas',
): Promise<void> {
  const liste = (await db.programmeExercices.where('programmeId').equals(programmeId).toArray()).sort(
    (a, b) => a.ordre - b.ordre,
  )
  const index = liste.findIndex((pe) => pe.id === programmeExerciceId)
  const indexVoisin = direction === 'haut' ? index - 1 : index + 1
  if (index === -1 || indexVoisin < 0 || indexVoisin >= liste.length) return

  const actuel = liste[index]
  const voisin = liste[indexVoisin]
  await db.transaction('rw', db.programmeExercices, async () => {
    await db.programmeExercices.update(actuel.id, { ordre: voisin.ordre })
    await db.programmeExercices.update(voisin.id, { ordre: actuel.ordre })
  })
}
