import { db } from './schema'

export async function deplacerExercice(
  listeVisibleIds: number[],
  exerciceId: number,
  direction: 'haut' | 'bas',
): Promise<void> {
  const index = listeVisibleIds.indexOf(exerciceId)
  const indexVoisin = direction === 'haut' ? index - 1 : index + 1
  if (index === -1 || indexVoisin < 0 || indexVoisin >= listeVisibleIds.length) return

  const [actuel, voisin] = await Promise.all([
    db.exercices.get(exerciceId),
    db.exercices.get(listeVisibleIds[indexVoisin]),
  ])
  if (!actuel || !voisin) return

  await db.transaction('rw', db.exercices, async () => {
    await db.exercices.update(actuel.id, { ordre: voisin.ordre })
    await db.exercices.update(voisin.id, { ordre: actuel.ordre })
  })
}
