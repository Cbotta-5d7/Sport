export function vibrerCourt(): void {
  navigator.vibrate?.(40)
}

export function vibrerFinMinuteur(): void {
  navigator.vibrate?.([80, 60, 80])
}

let contexteAudio: AudioContext | null = null

export function jouerBip(): void {
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
