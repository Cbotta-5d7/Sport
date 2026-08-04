export function detecterDepassementLarge(reps: number, repsCibleMax: number): boolean {
  return reps >= repsCibleMax + 3
}

export function detecterChuteReps(repsActuelles: number, repsPrecedentes: number): boolean {
  return repsPrecedentes > 0 && repsActuelles < repsPrecedentes * 0.8
}
