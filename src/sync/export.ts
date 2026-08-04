import { construireSnapshot } from './snapshot'

export async function telechargerExportJSON(): Promise<void> {
  const snapshot = await construireSnapshot()
  const contenu = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([contenu], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().slice(0, 10)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = `musculation-export-${date}.json`
  document.body.appendChild(lien)
  lien.click()
  document.body.removeChild(lien)
  URL.revokeObjectURL(url)
}
