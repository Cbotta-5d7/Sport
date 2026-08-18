import { db } from './schema'
import type { Exercice, Programme, ProgrammeExercice } from './types'
import { nomJourSemaineFR } from '../utils/dates'

export interface ProgrammeExerciceAvecExercice extends ProgrammeExercice {
  exercice: Exercice
}

export async function listerProgrammes(): Promise<Programme[]> {
  return (await db.programmes.toArray()).filter((p) => !p.archive).sort((a, b) => a.ordre - b.ordre)
}

export async function programmeDuJour(reference = new Date()): Promise<Programme | null> {
  const nomJour = nomJourSemaineFR(reference)
  const programmes = await listerProgrammes()
  return programmes.find((p) => p.nom.trim().toLowerCase() === nomJour) ?? null
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
