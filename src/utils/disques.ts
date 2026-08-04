export interface RepartitionDisque {
  poidsKg: number
  quantite: number
}

export interface ResultatRepartition {
  parCote: RepartitionDisque[]
  poidsParCote: number
  poidsAtteint: number
  poidsTotal: number
  reste: number
}

export function calculerRepartition(
  poidsCible: number,
  poidsBarreKg: number,
  inventaireDisquesKg: number[],
): ResultatRepartition {
  const poidsParCote = Math.max(0, (poidsCible - poidsBarreKg) / 2)
  const disquesTries = [...inventaireDisquesKg].sort((a, b) => b - a)

  let restant = poidsParCote
  const parCote: RepartitionDisque[] = []

  for (const poidsDisque of disquesTries) {
    if (poidsDisque <= 0) continue
    let quantite = 0
    while (restant >= poidsDisque - 1e-9) {
      restant -= poidsDisque
      quantite += 1
    }
    if (quantite > 0) parCote.push({ poidsKg: poidsDisque, quantite })
  }

  const reste = Math.max(0, Math.round(restant * 100) / 100)
  const poidsAtteintParCote = poidsParCote - reste
  const poidsAtteint = poidsBarreKg + poidsAtteintParCote * 2

  return {
    parCote,
    poidsParCote,
    poidsAtteint: Math.round(poidsAtteint * 100) / 100,
    poidsTotal: poidsCible,
    reste,
  }
}
