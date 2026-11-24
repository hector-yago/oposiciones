// Temporadas: decoración especial según la fecha. Lógica pura.
/** @returns {'navidad'|'halloween'|'verano'|'primavera'|null} */
export function seasonOf(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if ((m === 12 && d >= 15) || (m === 1 && d <= 6)) return 'navidad';
  if ((m === 10 && d >= 24) || (m === 11 && d === 1)) return 'halloween';
  if ((m === 6 && d >= 21) || m === 7 || m === 8 || (m === 9 && d <= 22)) return 'verano';
  if ((m === 3 && d >= 20) || m === 4 || m === 5 || (m === 6 && d <= 20)) return 'primavera';
  return null;
}

export const SEASON_NAMES = { navidad: 'Navidad', halloween: 'Halloween', verano: 'Verano', primavera: 'Primavera' };
