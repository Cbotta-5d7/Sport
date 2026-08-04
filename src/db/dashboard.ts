import { db } from './schema'
import { ordrePriorite } from './types'
import type { GroupeMusculaire } from './types'
import { estDansSemaine, debutSemaine } from '../utils/dates'
import { serieEstEfficace } from './rir'
import { estimation1RM, tonnageTotal, estSerieDeTravail } from '../utils/calculs'

export type CouleurGroupeSemaine = 'vert' | 'orange' | 'rouge' | 'violet'

export interface StatGroupeSemaine {
  groupe: GroupeMusculaire
  cibleSeries: number
  totalSeries: number
  seriesEfficaces: number
  couleur: CouleurGroupeSemaine
}

export interface TableauBordSemaine {
  groupes: StatGroupeSemaine[]
  seancesFaites: number
  seancesCible: number
  seancesRestantes: number
  totalEfficaces: number
  totalCible: number
  totalReste: number
}

async function chargerDonneesSemaine(reference: Date) {
  const [ciblesBrutes, tousExercices, toutesSeances, tousSeanceExercices] = await Promise.all([
    db.ciblesVolume.toArray(),
    db.exercices.toArray(),
    db.seances.toArray(),
    db.seanceExercices.toArray(),
  ])
  const cibles = ciblesBrutes.sort(
    (a, b) => ordrePriorite(a.groupeMusculaire) - ordrePriorite(b.groupeMusculaire),
  )

  const seancesSemaine = toutesSeances.filter((s) => estDansSemaine(s.date, reference))
  const seanceIdsSemaine = new Set(seancesSemaine.map((s) => s.id))
  const seanceExercicesSemaine = tousSeanceExercices.filter((se) => seanceIdsSemaine.has(se.seanceId))
  const idsSE = seanceExercicesSemaine.map((se) => se.id)
  const seriesSemaine = idsSE.length ? await db.series.where('seanceExerciceId').anyOf(idsSE).toArray() : []

  return { cibles, tousExercices, seancesSemaine, seanceExercicesSemaine, seriesSemaine }
}

export async function tableauBordSemaine(reference = new Date()): Promise<TableauBordSemaine> {
  const { cibles, tousExercices, seancesSemaine, seanceExercicesSemaine, seriesSemaine } =
    await chargerDonneesSemaine(reference)

  const exerciceParId = new Map(tousExercices.map((e) => [e.id, e]))
  const seParId = new Map(seanceExercicesSemaine.map((se) => [se.id, se]))

  const parGroupe = new Map<GroupeMusculaire, { total: number; efficaces: number }>()
  for (const c of cibles) parGroupe.set(c.groupeMusculaire, { total: 0, efficaces: 0 })

  for (const s of seriesSemaine) {
    if (!s.validee || s.type === 'échauffement') continue
    const se = seParId.get(s.seanceExerciceId)
    if (!se) continue
    const exo = exerciceParId.get(se.exerciceId)
    if (!exo) continue
    const stats = parGroupe.get(exo.groupeMusculaire)
    if (!stats) continue
    stats.total += 1
    if (serieEstEfficace(s)) stats.efficaces += 1
  }

  const seancesCibleReglage = await db.reglages.get('seancesCibleParSemaine')
  const seancesCible = Number(seancesCibleReglage?.valeur ?? 3)
  const seancesFaites = seancesSemaine.filter((s) => s.statut === 'terminee').length
  const seancesRestantes = Math.max(0, seancesCible - seancesFaites)

  const groupes: StatGroupeSemaine[] = cibles.map((c) => {
    const stats = parGroupe.get(c.groupeMusculaire) ?? { total: 0, efficaces: 0 }
    const reste = Math.max(0, c.seriesCibleSemaine - stats.efficaces)
    let couleur: CouleurGroupeSemaine
    if (stats.efficaces > 20) couleur = 'violet'
    else if (reste === 0) couleur = 'vert'
    else if (seancesRestantes > 0 && reste <= seancesRestantes * 10) couleur = 'orange'
    else couleur = 'rouge'
    return {
      groupe: c.groupeMusculaire,
      cibleSeries: c.seriesCibleSemaine,
      totalSeries: stats.total,
      seriesEfficaces: stats.efficaces,
      couleur,
    }
  })

  const totalEfficaces = groupes.reduce((a, g) => a + g.seriesEfficaces, 0)
  const totalCible = groupes.reduce((a, g) => a + g.cibleSeries, 0)
  const totalReste = groupes.reduce((a, g) => a + Math.max(0, g.cibleSeries - g.seriesEfficaces), 0)

  return { groupes, seancesFaites, seancesCible, seancesRestantes, totalEfficaces, totalCible, totalReste }
}

export interface KPI {
  seriesEfficaces: number
  tauxAtteinte: number
  indiceProgression: number | null
  regulariteFaites: number
  regulariteCible: number
  vitessePriseDeMasseGSemaine: number | null
  densite: number | null
}

function joursEntre(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)
}

async function indiceProgressionRepere(reference: Date): Promise<number | null> {
  const reperes = (await db.exercices.toArray()).filter((e) => e.estRepere && !e.archive)
  if (reperes.length === 0) return null

  const seanceExercices = await db.seanceExercices.toArray()
  const toutesSeances = await db.seances.toArray()
  const seanceParId = new Map(toutesSeances.map((s) => [s.id, s]))

  let comparables = 0
  let enHausse = 0

  for (const exo of reperes) {
    const sesExo = seanceExercices.filter((se) => se.exerciceId === exo.id)
    const idsSE = sesExo.map((se) => se.id)
    if (idsSE.length === 0) continue
    const series = await db.series.where('seanceExerciceId').anyOf(idsSE).toArray()

    let meilleurActuel = 0
    let meilleurAncien = 0
    for (const s of series) {
      if (!s.validee || s.type === 'échauffement') continue
      const se = sesExo.find((x) => x.id === s.seanceExerciceId)
      const seance = se ? seanceParId.get(se.seanceId) : undefined
      if (!seance) continue
      const rm = estimation1RM(s.poidsKg, s.reps)
      if (!rm) continue
      const age = joursEntre(new Date(seance.date), reference)
      if (age <= 7) meilleurActuel = Math.max(meilleurActuel, rm.valeur)
      else if (age >= 21 && age <= 35) meilleurAncien = Math.max(meilleurAncien, rm.valeur)
    }

    if (meilleurActuel > 0 && meilleurAncien > 0) {
      comparables += 1
      if (meilleurActuel > meilleurAncien) enHausse += 1
    }
  }

  if (comparables === 0) return null
  return (enHausse / comparables) * 100
}

async function regulariteSurQuatreSemaines(reference: Date): Promise<{ faites: number; cible: number }> {
  const seancesCibleReglage = await db.reglages.get('seancesCibleParSemaine')
  const cibleSemaine = Number(seancesCibleReglage?.valeur ?? 3)
  const debut = new Date(reference)
  debut.setDate(debut.getDate() - 28)

  const seances = await db.seances.toArray()
  const faites = seances.filter(
    (s) => s.statut === 'terminee' && new Date(s.date) >= debut && new Date(s.date) <= reference,
  ).length

  return { faites, cible: cibleSemaine * 4 }
}

export async function vitessePriseDeMasse(reference: Date): Promise<number | null> {
  const debut = new Date(reference)
  debut.setDate(debut.getDate() - 28)
  const mesures = (await db.poidsCorporel.toArray())
    .filter((p) => new Date(p.date) >= debut && new Date(p.date) <= reference)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (mesures.length < 2) return null
  const premiere = mesures[0]
  const derniere = mesures[mesures.length - 1]
  const jours = joursEntre(new Date(premiere.date), new Date(derniere.date))
  if (jours === 0) return null
  const deltaKg = derniere.poidsKg - premiere.poidsKg
  return (deltaKg * 1000 * 7) / jours
}

async function densiteSemaine(reference: Date): Promise<number | null> {
  const seances = (await db.seances.toArray()).filter(
    (s) => s.statut === 'terminee' && estDansSemaine(s.date, reference),
  )
  if (seances.length === 0) return null

  const seanceExercices = await db.seanceExercices.toArray()
  let tonnage = 0
  let minutes = 0
  for (const seance of seances) {
    const idsSE = seanceExercices.filter((se) => se.seanceId === seance.id).map((se) => se.id)
    const series = idsSE.length ? await db.series.where('seanceExerciceId').anyOf(idsSE).toArray() : []
    tonnage += tonnageTotal(series.filter(estSerieDeTravail))
    minutes += seance.dureeSec / 60
  }
  if (minutes === 0) return null
  return tonnage / minutes
}

export async function calculerKPI(reference = new Date()): Promise<KPI> {
  const semaine = await tableauBordSemaine(reference)
  const regularite = await regulariteSurQuatreSemaines(reference)

  return {
    seriesEfficaces: semaine.totalEfficaces,
    tauxAtteinte: semaine.totalCible > 0 ? (semaine.totalEfficaces / semaine.totalCible) * 100 : 0,
    indiceProgression: await indiceProgressionRepere(reference),
    regulariteFaites: regularite.faites,
    regulariteCible: regularite.cible,
    vitessePriseDeMasseGSemaine: await vitessePriseDeMasse(reference),
    densite: await densiteSemaine(reference),
  }
}

export function phraseSynthese(t: TableauBordSemaine): string {
  if (t.totalReste === 0) {
    return `Cette semaine tu as fait ${t.totalEfficaces} séries efficaces sur ${t.totalCible}. Cible atteinte.`
  }
  const pluriel = t.seancesRestantes > 1 ? 's' : ''
  return `Cette semaine tu as fait ${t.totalEfficaces} séries efficaces sur ${t.totalCible}. Il te manque ${t.totalReste} séries, réparties sur ${t.seancesRestantes} séance${pluriel}.`
}

export function alerteImpossible(t: TableauBordSemaine): string | null {
  if (t.seancesRestantes === 0 || t.totalReste === 0) return null
  if (t.totalReste <= t.seancesRestantes * 15) return null
  const priorites = [...t.groupes]
    .filter((g) => g.cibleSeries - g.seriesEfficaces > 0)
    .sort((a, b) => b.cibleSeries - b.seriesEfficaces - (a.cibleSeries - a.seriesEfficaces))
    .slice(0, 3)
    .map((g) => g.groupe.toLowerCase())
  return `Il reste ${t.seancesRestantes} séance${t.seancesRestantes > 1 ? 's' : ''} pour ${t.totalReste} séries. C'est trop. Priorise ${priorites.join(', ')}.`
}

export function debutSemaineActuelle(reference = new Date()): Date {
  return debutSemaine(reference)
}

export interface RecapSemaine {
  debut: Date
  totalEfficaces: number
  totalCible: number
  seancesFaites: number
}

export async function recapitulatifQuatreSemaines(reference = new Date()): Promise<RecapSemaine[]> {
  const resultats: RecapSemaine[] = []
  for (let i = 0; i < 5; i++) {
    const ref = new Date(reference)
    ref.setDate(ref.getDate() - i * 7)
    const t = await tableauBordSemaine(ref)
    resultats.push({
      debut: debutSemaine(ref),
      totalEfficaces: t.totalEfficaces,
      totalCible: t.totalCible,
      seancesFaites: t.seancesFaites,
    })
  }
  return resultats
}
