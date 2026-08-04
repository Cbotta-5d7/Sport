const JOUR_MS = 24 * 60 * 60 * 1000
const HEURE_MS = 60 * 60 * 1000

export function debutSemaine(date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const jour = d.getDay()
  const decalage = jour === 0 ? 6 : jour - 1
  d.setDate(d.getDate() - decalage)
  return d
}

export function finSemaine(date = new Date()): Date {
  const debut = debutSemaine(date)
  const fin = new Date(debut)
  fin.setDate(fin.getDate() + 7)
  return fin
}

export function estDansSemaine(dateIso: string, reference = new Date()): boolean {
  const t = new Date(dateIso).getTime()
  return t >= debutSemaine(reference).getTime() && t < finSemaine(reference).getTime()
}

export function joursDepuis(dateIso: string, reference = new Date()): number {
  const debut = new Date(dateIso)
  debut.setHours(0, 0, 0, 0)
  const ref = new Date(reference)
  ref.setHours(0, 0, 0, 0)
  return Math.round((ref.getTime() - debut.getTime()) / JOUR_MS)
}

export function heuresDepuis(dateIso: string, reference = new Date()): number {
  return (reference.getTime() - new Date(dateIso).getTime()) / HEURE_MS
}

export function formatDelaiRelatif(jours: number): string {
  if (jours <= 0) return "aujourd'hui"
  if (jours === 1) return 'hier'
  return `il y a ${jours} jours`
}

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

export function formatDateLongueFR(date: Date): string {
  return `${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]}`
}

export function nomJourSemaineFR(date: Date): string {
  return JOURS[date.getDay()]
}

export function formatPlageSemaineFR(reference = new Date()): string {
  const debut = debutSemaine(reference)
  const fin = new Date(debut)
  fin.setDate(fin.getDate() + 6)
  const memeMois = debut.getMonth() === fin.getMonth()
  const texteDebut = memeMois ? `${debut.getDate()}` : `${debut.getDate()} ${MOIS[debut.getMonth()]}`
  return `Semaine du ${texteDebut} au ${fin.getDate()} ${MOIS[fin.getMonth()]}`
}

export function jourSemaineIndex(reference = new Date()): number {
  const jour = reference.getDay()
  return jour === 0 ? 7 : jour
}

export function nowIso(): string {
  return new Date().toISOString()
}
