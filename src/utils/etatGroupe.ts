import type { EtatGroupe } from '../db/queries'

export type CouleurDelai = 'gris' | 'vert' | 'orange' | 'rouge'

export function couleurDelai(etat: EtatGroupe): CouleurDelai {
  if (etat.joursDepuisDerniere === null) return 'gris'
  const intervalleCible = 7 / etat.cibleSeancesSemaine
  if (etat.joursDepuisDerniere <= intervalleCible) return 'vert'
  if (etat.joursDepuisDerniere <= intervalleCible * 2) return 'orange'
  return 'rouge'
}

export const CLASSES_COULEUR_DELAI: Record<CouleurDelai, string> = {
  gris: 'border-slate-700 bg-slate-900 text-slate-400',
  vert: 'border-emerald-700 bg-emerald-950 text-emerald-300',
  orange: 'border-amber-700 bg-amber-950 text-amber-300',
  rouge: 'border-red-700 bg-red-950 text-red-300',
}
