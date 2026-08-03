import { useEffect } from 'react'

export function useWakeLock(actif: boolean): void {
  useEffect(() => {
    if (!actif) return

    let verrou: WakeLockSentinel | null = null
    let annule = false

    async function acquerir() {
      try {
        verrou = await navigator.wakeLock?.request('screen')
      } catch {
        // wake lock indisponible (navigateur, batterie faible...), on ignore
      }
    }

    async function reacquerirSiVisible() {
      if (document.visibilityState === 'visible' && !annule) {
        await acquerir()
      }
    }

    acquerir()
    document.addEventListener('visibilitychange', reacquerirSiVisible)

    return () => {
      annule = true
      document.removeEventListener('visibilitychange', reacquerirSiVisible)
      verrou?.release().catch(() => {})
    }
  }, [actif])
}
