export function formatKg(valeur: number): string {
  const arrondi = Math.round(valeur * 100) / 100
  return arrondi.toString().replace('.', ',')
}

export function formatPourcent(valeur: number, decimales = 1): string {
  const arrondi = Number(valeur.toFixed(decimales))
  return arrondi.toString().replace('.', ',')
}

export function arrondiIncrement(valeur: number, incrementKg: number): number {
  return Math.round(valeur / incrementKg) * incrementKg
}
