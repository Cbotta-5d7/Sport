import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { lireMinuteur } from '../db/minuteur'
import { vibrerFinMinuteur, jouerBip } from '../utils/vibration'

export interface EtatMinuteur {
  secondesRestantes: number
  dureeSec: number
  serieId: number
  termine: boolean
}

export function useMinuteurRepos(): EtatMinuteur | null {
  const etatStocke = useLiveQuery(() => lireMinuteur(), [], undefined)
  const [, forcerRafraichissement] = useState(0)
  const aDejaAlerte = useRef<string | null>(null)

  useEffect(() => {
    if (!etatStocke) return
    const id = setInterval(() => forcerRafraichissement((n) => n + 1), 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etatStocke?.finHorodatage])

  if (!etatStocke) return null

  const restantMs = new Date(etatStocke.finHorodatage).getTime() - Date.now()
  const secondesRestantes = Math.max(0, Math.ceil(restantMs / 1000))
  const termine = secondesRestantes === 0

  if (termine && aDejaAlerte.current !== etatStocke.finHorodatage) {
    aDejaAlerte.current = etatStocke.finHorodatage
    vibrerFinMinuteur()
    jouerBip()
  }

  return {
    secondesRestantes,
    dureeSec: etatStocke.dureeSec,
    serieId: etatStocke.serieId,
    termine,
  }
}
