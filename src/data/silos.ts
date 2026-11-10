/** הסילואים של האתר - סדר הופעה בניווט, בפוטר ובמפת האתר. */
export const silos = [
  { id: 'roof-waterproofing', name: 'איטום גגות', short: 'גגות' },
  { id: 'methods', name: 'שיטות וחומרי איטום', short: 'שיטות וחומרים' },
  { id: 'walls', name: 'איטום קירות', short: 'קירות' },
  { id: 'interior', name: 'חדרים רטובים ופנים הבית', short: 'חדרים רטובים' },
  { id: 'balconies', name: 'איטום מרפסות ומשטחים', short: 'מרפסות' },
  { id: 'structures', name: 'איטום מבנים וחללים', short: 'מבנים' },
  { id: 'moisture', name: 'רטיבות ואיתור נזילות', short: 'רטיבות' },
  { id: 'gutters', name: 'מרזבים', short: 'מרזבים' },
  { id: 'roofing', name: 'בניית ותיקון גגות', short: 'בניית גגות' },
  { id: 'areas', name: 'אזורי שירות', short: 'אזורים' },
] as const;

export type SiloId = (typeof silos)[number]['id'];
export const siloById = (id: string) => silos.find((s) => s.id === id);
