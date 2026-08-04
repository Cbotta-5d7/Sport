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
    const oscillateur = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillateur.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    oscillateur.connect(gain)
    gain.connect(ctx.destination)
    oscillateur.start()
    oscillateur.stop(ctx.currentTime + 0.35)
  } catch {
    // audio indisponible, on ignore silencieusement
  }
}
