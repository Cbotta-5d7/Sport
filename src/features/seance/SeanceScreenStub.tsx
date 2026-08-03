interface Props {
  seanceId: number
  onTerminer: () => void
}

export function SeanceScreenStub({ seanceId, onTerminer }: Props) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-slate-300">Séance #{seanceId} en cours.</p>
      <p className="max-w-sm text-sm text-slate-500">
        L'écran de séance complet (pavé numérique, minuteur, wake lock) arrive en phase 3.
      </p>
      <button
        type="button"
        onClick={onTerminer}
        className="min-h-14 rounded-xl border border-slate-700 px-6 text-slate-300"
      >
        Retour à l'accueil
      </button>
    </div>
  )
}
