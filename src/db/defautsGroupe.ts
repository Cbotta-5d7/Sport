import type { Exercice, GroupeMusculaire } from './types'

type DefautsExercice = Pick<
  Exercice,
  'typeCharge' | 'incrementKg' | 'reposDefautSec' | 'repsCibleMin' | 'repsCibleMax'
>

export function defautsPourGroupe(groupe: GroupeMusculaire): DefautsExercice {
  if (groupe === 'Mollets') {
    return { typeCharge: 'machine', incrementKg: 2.5, reposDefautSec: 60, repsCibleMin: 12, repsCibleMax: 20 }
  }
  return { typeCharge: 'barre', incrementKg: 2.5, reposDefautSec: 150, repsCibleMin: 8, repsCibleMax: 12 }
}
