import type { Serie } from './types'

export const OPTIONS_RIR: { valeur: number; libelle: string }[] = [
  { valeur: 0, libelle: '0' },
  { valeur: 1, libelle: '1 à 2' },
  { valeur: 2, libelle: '3 à 4' },
  { valeur: 3, libelle: 'plus de 4' },
]

export function serieEstEfficace(serie: Pick<Serie, 'type' | 'rir' | 'validee'>): boolean {
  return serie.validee && serie.type !== 'échauffement' && serie.rir !== null && serie.rir <= 2
}
