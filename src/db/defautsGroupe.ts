import type { Exercice, GroupeMusculaire } from './types'

type DefautsExercice = Pick<
  Exercice,
  'typeCharge' | 'incrementKg' | 'reposDefautSec' | 'repsCibleMin' | 'repsCibleMax' | 'seriesCibleDefaut'
>

export function defautsPourGroupe(groupe: GroupeMusculaire): DefautsExercice {
  if (groupe === 'Mollets') {
    return {
      typeCharge: 'machine',
      incrementKg: 2.5,
      reposDefautSec: 60,
      repsCibleMin: 12,
      repsCibleMax: 20,
      seriesCibleDefaut: 3,
    }
  }
  return {
    typeCharge: 'barre',
    incrementKg: 2.5,
    reposDefautSec: 150,
    repsCibleMin: 8,
    repsCibleMax: 12,
    seriesCibleDefaut: 3,
  }
}
