import { useState } from 'react'

interface Props {
  noteInitiale: string
  onEnregistrer: (note: string) => void
  onFermer: () => void
}

export function ModaleNoteSeance({ noteInitiale, onEnregistrer, onFermer }: Props) {
  const [note, setNote] = useState(noteInitiale)

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60" onClick={onFermer}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-slate-900 p-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-semibold text-slate-50">Note de séance</h2>
        <textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none focus:border-accent"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onFermer}
            className="min-h-14 flex-1 rounded-xl border border-slate-700 text-slate-300"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onEnregistrer(note)}
            className="min-h-14 flex-1 rounded-xl bg-accent font-semibold text-slate-950"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
