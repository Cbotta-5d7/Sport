import { db } from './schema'
import type { GroupeMusculaire, Serie } from './types'
import { debutSemaine } from '../utils/dates'
import { scoreCharge, tonnageTotal, estSerieDeTravail } from '../utils/calculs'
import { historiqueExercice } from './queries'
import { tableauBordSemaine } from './dashboard'

function libelleSemaine(debut: Date): string {
  return `${debut.getDate()}/${debut.getMonth() + 1}`
}

function dernieresNSemaines(n: number, reference = new Date()): Date[] {
  const resultat: Date[] = []
  for (let i = n - 1; i >= 0; i--) {
    const ref = new Date(reference)
    ref.setDate(ref.getDate() - i * 7)
    resultat.push(debutSemaine(ref))
  }
  return resultat
}

// --- Par exercice ---

export interface PointChargeRM {
  date: string
  chargeMax: number | null
  // Score pondéré poids-dominant (voir utils/calculs.ts scoreCharge), pas un 1RM théorique :
  // reste cohérent avec l'indicateur "Monte !"/"Progresse" affiché en séance.
  score: number | null
}

// Un point par séance réelle (pas par semaine/jour calendaire) : deux séances du même exercice
// la même semaine donnent deux points distincts, et une séance sans historique voisin n'affiche
// jamais de faux 0 puisqu'il n'y a tout simplement pas de bucket vide à remplir.
export async function chargeEt1RMParSeance(exerciceId: number): Promise<PointChargeRM[]> {
  const historique = (await historiqueExercice(exerciceId, 200, { inclureEnCours: true })).slice().reverse()

  return historique.map((h) => {
    let chargeMax = 0
    let score = 0
    for (const s of h.series.filter(estSerieDeTravail)) {
      chargeMax = Math.max(chargeMax, s.poidsKg)
      score = Math.max(score, scoreCharge(s.poidsKg, s.reps))
    }
    return {
      date: h.seance.date,
      chargeMax: chargeMax > 0 ? chargeMax : null,
      score: score > 0 ? score : null,
    }
  })
}

export interface PointTonnageSeance {
  date: string
  tonnage: number
  moyenne5: number | null
}

export async function tonnageParSeance(exerciceId: number): Promise<PointTonnageSeance[]> {
  const historique = (await historiqueExercice(exerciceId, 200, { inclureEnCours: true })).slice().reverse()
  const points: PointTonnageSeance[] = historique.map((h) => ({
    date: h.seance.date,
    tonnage: tonnageTotal(h.series.filter(estSerieDeTravail)),
    moyenne5: null,
  }))
  for (let i = 0; i < points.length; i++) {
    const debut = Math.max(0, i - 4)
    const tranche = points.slice(debut, i + 1)
    points[i].moyenne5 = tranche.reduce((a, p) => a + p.tonnage, 0) / tranche.length
  }
  return points
}

export interface PointNuage {
  poidsKg: number
  reps: number
}

export async function nuagePoidsReps(exerciceId: number): Promise<PointNuage[]> {
  const historique = await historiqueExercice(exerciceId, 200, { inclureEnCours: true })
  return historique.flatMap((h) => h.series.filter(estSerieDeTravail).map((s) => ({ poidsKg: s.poidsKg, reps: s.reps })))
}

export interface RepartitionReps {
  plage: string
  count: number
}

const PLAGES_REPS: [string, (r: number) => boolean][] = [
  ['1-5', (r) => r <= 5],
  ['6-10', (r) => r >= 6 && r <= 10],
  ['11-15', (r) => r >= 11 && r <= 15],
  ['16-20', (r) => r >= 16 && r <= 20],
  ['21+', (r) => r >= 21],
]

export async function repartitionParFourchette(exerciceId: number): Promise<RepartitionReps[]> {
  const points = await nuagePoidsReps(exerciceId)
  return PLAGES_REPS.map(([plage, test]) => ({ plage, count: points.filter((p) => test(p.reps)).length }))
}

// --- Par groupe musculaire ---

async function seriesGroupeParSemaine(groupe: GroupeMusculaire, nbSemaines: number) {
  const exercices = await db.exercices.where('groupeMusculaire').equals(groupe).toArray()
  const idsExo = exercices.map((e) => e.id)
  const seanceExercices = idsExo.length ? await db.seanceExercices.where('exerciceId').anyOf(idsExo).toArray() : []
  const idsSE = seanceExercices.map((se) => se.id)
  const series = idsSE.length ? await db.series.where('seanceExerciceId').anyOf(idsSE).toArray() : []
  const seances = await db.seances.toArray()
  const seanceParId = new Map(seances.map((s) => [s.id, s]))
  const seParId = new Map(seanceExercices.map((se) => [se.id, se]))
  const semaines = dernieresNSemaines(nbSemaines)
  return { series, seanceParId, seParId, semaines, exercices }
}

export interface PointSeriesSemaineGroupe {
  semaine: string
  realise: number
  cible: number
}

export async function seriesParSemaineGroupe(
  groupe: GroupeMusculaire,
  nbSemaines = 12,
): Promise<PointSeriesSemaineGroupe[]> {
  const { series, seanceParId, seParId, semaines } = await seriesGroupeParSemaine(groupe, nbSemaines)
  const cible = await db.ciblesVolume.get(groupe)

  return semaines.map((debut) => {
    const fin = new Date(debut)
    fin.setDate(fin.getDate() + 7)
    let realise = 0
    for (const s of series) {
      const se = seParId.get(s.seanceExerciceId)
      const seance = se ? seanceParId.get(se.seanceId) : undefined
      if (!seance) continue
      const d = new Date(seance.date)
      if (d < debut || d >= fin) continue
      if (s.validee && estSerieDeTravail(s)) realise += 1
    }
    return { semaine: libelleSemaine(debut), realise, cible: cible?.seriesCibleSemaine ?? 0 }
  })
}

export interface PointIndiceCharge {
  semaine: string
  indice: number | null
}

export async function indiceChargeGroupe(groupe: GroupeMusculaire, nbSemaines = 12): Promise<PointIndiceCharge[]> {
  const exercices = (await db.exercices.where('groupeMusculaire').equals(groupe).toArray()).filter((e) => e.estRepere)
  if (exercices.length === 0) return []

  const semaines = dernieresNSemaines(nbSemaines)
  const rmParSemaine: number[][] = semaines.map(() => [])

  for (const exo of exercices) {
    const historique = await historiqueExercice(exo.id, 200, { inclureEnCours: true })
    semaines.forEach((debut, i) => {
      const fin = new Date(debut)
      fin.setDate(fin.getDate() + 7)
      let meilleur = 0
      for (const h of historique) {
        const d = new Date(h.seance.date)
        if (d < debut || d >= fin) continue
        for (const s of h.series.filter(estSerieDeTravail)) {
          meilleur = Math.max(meilleur, scoreCharge(s.poidsKg, s.reps))
        }
      }
      if (meilleur > 0) rmParSemaine[i].push(meilleur)
    })
  }

  const moyennes = rmParSemaine.map((vals) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null))
  const base = moyennes.find((m) => m !== null) ?? null

  return semaines.map((debut, i) => ({
    semaine: libelleSemaine(debut),
    indice: base && moyennes[i] !== null ? Math.round(((moyennes[i] as number) / base) * 100) : null,
  }))
}

export interface PointFrequence {
  semaine: string
  seances: number
}

export async function frequenceHebdoGroupe(groupe: GroupeMusculaire, nbSemaines = 12): Promise<PointFrequence[]> {
  const { seanceParId, seParId, series, semaines } = await seriesGroupeParSemaine(groupe, nbSemaines)

  return semaines.map((debut) => {
    const fin = new Date(debut)
    fin.setDate(fin.getDate() + 7)
    const idsSeances = new Set<number>()
    for (const s of series) {
      const se = seParId.get(s.seanceExerciceId)
      const seance = se ? seanceParId.get(se.seanceId) : undefined
      if (!seance) continue
      const d = new Date(seance.date)
      if (d < debut || d >= fin) continue
      idsSeances.add(seance.id)
    }
    return { semaine: libelleSemaine(debut), seances: idsSeances.size }
  })
}

export interface PointEcartCumule {
  semaine: string
  ecartCumule: number
}

export async function ecartCumuleGroupe(groupe: GroupeMusculaire, nbSemaines = 12): Promise<PointEcartCumule[]> {
  const points = await seriesParSemaineGroupe(groupe, nbSemaines)
  let cumul = 0
  return points.map((p) => {
    cumul += p.realise - p.cible
    return { semaine: p.semaine, ecartCumule: cumul }
  })
}

// --- Vue globale ---

export interface PointRadarGroupe {
  groupe: string
  realise: number
  cible: number
}

export async function radarGroupes(): Promise<PointRadarGroupe[]> {
  const t = await tableauBordSemaine()
  return t.groupes.map((g) => ({ groupe: g.groupe, realise: g.totalSeries, cible: g.cibleSeries }))
}

export interface JourChaleur {
  date: string
  intensite: number
}

export async function carteChaleurSeances(nbSemaines = 12): Promise<JourChaleur[]> {
  const seances = (await db.seances.toArray()).filter((s) => s.statut === 'terminee')
  const debut = dernieresNSemaines(nbSemaines)[0]
  const parJour = new Map<string, number>()
  for (const s of seances) {
    const d = new Date(s.date)
    if (d < debut) continue
    const cle = d.toISOString().slice(0, 10)
    parJour.set(cle, (parJour.get(cle) ?? 0) + 1)
  }
  const resultat: JourChaleur[] = []
  const jour = new Date(debut)
  const aujourdhui = new Date()
  while (jour <= aujourdhui) {
    const cle = jour.toISOString().slice(0, 10)
    resultat.push({ date: cle, intensite: parJour.get(cle) ?? 0 })
    jour.setDate(jour.getDate() + 1)
  }
  return resultat
}

export interface PointVolumeSemaine {
  semaine: string
  volume: number
}

export async function volumeTotalParSemaine(nbSemaines = 12): Promise<PointVolumeSemaine[]> {
  const semaines = dernieresNSemaines(nbSemaines)
  const toutesSeries = await db.series.toArray()
  const seanceExercices = await db.seanceExercices.toArray()
  const seances = await db.seances.toArray()
  const seanceParId = new Map(seances.map((s) => [s.id, s]))
  const seParId = new Map(seanceExercices.map((se) => [se.id, se]))

  return semaines.map((debut) => {
    const fin = new Date(debut)
    fin.setDate(fin.getDate() + 7)
    let volume = 0
    for (const s of toutesSeries) {
      if (!estSerieDeTravail(s)) continue
      const se = seParId.get(s.seanceExerciceId)
      const seance = se ? seanceParId.get(se.seanceId) : undefined
      if (!seance) continue
      const d = new Date(seance.date)
      if (d < debut || d >= fin) continue
      volume += s.poidsKg * s.reps
    }
    return { semaine: libelleSemaine(debut), volume }
  })
}

// --- Poids de corps ---

export interface PointPoidsCorporel {
  date: string
  poidsKg: number
  moyenne7: number | null
}

export async function poidsCorporelAvecMoyenne(): Promise<PointPoidsCorporel[]> {
  const mesures = (await db.poidsCorporel.toArray()).sort((a, b) => a.date.localeCompare(b.date))
  const points: PointPoidsCorporel[] = mesures.map((m) => ({ date: m.date, poidsKg: m.poidsKg, moyenne7: null }))

  for (let i = 0; i < points.length; i++) {
    const dateI = new Date(points[i].date)
    const fenetre = points.filter((p) => {
      const d = new Date(p.date)
      const diffJours = (dateI.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      return diffJours >= 0 && diffJours < 7
    })
    points[i].moyenne7 = fenetre.reduce((a, p) => a + p.poidsKg, 0) / fenetre.length
  }
  return points
}

export type { Serie }
