import { db } from '../db/schema'

async function vibrationAutorisee(): Promise<boolean> {
  const r = await db.reglages.get('vibrationActif')
  return r?.valeur !== 'false'
}

async function sonAutorise(): Promise<boolean> {
  const r = await db.reglages.get('sonActif')
  return r?.valeur !== 'false'
}

export async function vibrerCourt(): Promise<void> {
  if (await vibrationAutorisee()) navigator.vibrate?.(40)
}

export async function vibrerFinMinuteur(): Promise<void> {
  if (await vibrationAutorisee()) navigator.vibrate?.([80, 60, 80])
}

let contexteAudio: AudioContext | null = null

export async function jouerBip(): Promise<void> {
  if (!(await sonAutorise())) return
  try {
    contexteAudio ??= new AudioContext()
    const ctx = contexteAudio
    // 4 bips espacés de 0,5s : couvre environ 2 secondes d'alerte au lieu d'un seul bip de 0,35s.
    const nombreBips = 4
    const intervalleSec = 0.5
    for (let i = 0; i < nombreBips; i++) {
      const debut = ctx.currentTime + i * intervalleSec
      const oscillateur = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillateur.frequency.value = 880
      gain.gain.setValueAtTime(0.2, debut)
      gain.gain.exponentialRampToValueAtTime(0.001, debut + 0.35)
      oscillateur.connect(gain)
      gain.connect(ctx.destination)
      oscillateur.start(debut)
      oscillateur.stop(debut + 0.35)
    }
  } catch {
    // audio indisponible, on ignore silencieusement
  }
}
