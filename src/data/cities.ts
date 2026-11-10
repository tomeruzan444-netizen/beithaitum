/**
 * טבלת ערים - מקור אמת לסלאגים, שיוך לאזור וקואורדינטות (לחישוב ערים סמוכות).
 * סלאג שנקבע לא משתנה (build-spec סעיף 3). נתוני אקלים ובנייה נכתבים בעמוד העיר עצמו, עם מקור.
 * קואורדינטות: מרכז העיר, בקירוב.
 */
export type City = { slug: string; name: string; region?: string; lat: number; lng: number; wave: 1 | 2 };

export const regions = [
  { slug: 'center', name: 'מרכז' },
  { slug: 'sharon', name: 'שרון' },
  { slug: 'shfela', name: 'שפלה' },
  { slug: 'krayot', name: 'חיפה והקריות' },
  { slug: 'north', name: 'צפון' },
  { slug: 'south', name: 'דרום' },
] as const;

export const cities: City[] = [
  { slug: 'tel-aviv', name: 'תל אביב', region: 'center', lat: 32.0853, lng: 34.7818, wave: 1 },
  { slug: 'jerusalem', name: 'ירושלים', lat: 31.7683, lng: 35.2137, wave: 1 },
  { slug: 'haifa', name: 'חיפה', region: 'krayot', lat: 32.794, lng: 34.9896, wave: 1 },
  { slug: 'rishon-lezion', name: 'ראשון לציון', region: 'center', lat: 31.973, lng: 34.7925, wave: 1 },
  { slug: 'petah-tikva', name: 'פתח תקווה', region: 'center', lat: 32.084, lng: 34.8878, wave: 1 },
  { slug: 'ashdod', name: 'אשדוד', region: 'south', lat: 31.8014, lng: 34.6435, wave: 1 },
  { slug: 'netanya', name: 'נתניה', region: 'sharon', lat: 32.3215, lng: 34.8532, wave: 1 },
  { slug: 'beer-sheva', name: 'באר שבע', region: 'south', lat: 31.252, lng: 34.7915, wave: 1 },
  { slug: 'holon', name: 'חולון', region: 'center', lat: 32.0158, lng: 34.7874, wave: 1 },
  { slug: 'bnei-brak', name: 'בני ברק', region: 'center', lat: 32.0807, lng: 34.8338, wave: 1 },
  { slug: 'ramat-gan', name: 'רמת גן', region: 'center', lat: 32.0684, lng: 34.8248, wave: 1 },
  { slug: 'bat-yam', name: 'בת ים', region: 'center', lat: 32.0132, lng: 34.748, wave: 1 },
  { slug: 'ashkelon', name: 'אשקלון', region: 'south', lat: 31.6688, lng: 34.5743, wave: 1 },
  { slug: 'rehovot', name: 'רחובות', region: 'shfela', lat: 31.8928, lng: 34.8113, wave: 1 },
  { slug: 'beit-shemesh', name: 'בית שמש', region: 'shfela', lat: 31.747, lng: 34.9881, wave: 1 },
  { slug: 'kfar-saba', name: 'כפר סבא', region: 'sharon', lat: 32.175, lng: 34.9069, wave: 1 },
  { slug: 'herzliya', name: 'הרצליה', region: 'sharon', lat: 32.1624, lng: 34.8447, wave: 1 },
  { slug: 'hadera', name: 'חדרה', region: 'sharon', lat: 32.434, lng: 34.9196, wave: 1 },
  { slug: 'modiin', name: 'מודיעין', region: 'shfela', lat: 31.898, lng: 35.0104, wave: 1 },
  { slug: 'raanana', name: 'רעננה', region: 'sharon', lat: 32.1848, lng: 34.8713, wave: 1 },
  { slug: 'lod', name: 'לוד', region: 'center', lat: 31.951, lng: 34.8881, wave: 1 },
  { slug: 'ramla', name: 'רמלה', region: 'center', lat: 31.9293, lng: 34.8656, wave: 1 },
  { slug: 'rosh-haayin', name: 'ראש העין', region: 'center', lat: 32.0956, lng: 34.9566, wave: 1 },
  { slug: 'hod-hasharon', name: 'הוד השרון', region: 'sharon', lat: 32.15, lng: 34.888, wave: 1 },
  { slug: 'givatayim', name: 'גבעתיים', region: 'center', lat: 32.0722, lng: 34.8125, wave: 1 },
  { slug: 'nes-ziona', name: 'נס ציונה', region: 'shfela', lat: 31.9293, lng: 34.7987, wave: 1 },
  { slug: 'yavne', name: 'יבנה', region: 'shfela', lat: 31.8781, lng: 34.7383, wave: 1 },
  { slug: 'kiryat-ata', name: 'קרית אתא', region: 'krayot', lat: 32.809, lng: 35.106, wave: 1 },
  { slug: 'kiryat-bialik', name: 'קרית ביאליק', region: 'krayot', lat: 32.8275, lng: 35.086, wave: 1 },
  { slug: 'kiryat-motzkin', name: 'קרית מוצקין', region: 'krayot', lat: 32.8371, lng: 35.0775, wave: 1 },
  { slug: 'kiryat-yam', name: 'קרית ים', region: 'krayot', lat: 32.8497, lng: 35.0694, wave: 1 },
  { slug: 'nahariya', name: 'נהריה', region: 'north', lat: 33.0058, lng: 35.094, wave: 1 },
  { slug: 'afula', name: 'עפולה', region: 'north', lat: 32.6078, lng: 35.2897, wave: 1 },
  { slug: 'karmiel', name: 'כרמיאל', region: 'north', lat: 32.919, lng: 35.2951, wave: 1 },
  { slug: 'tiberias', name: 'טבריה', region: 'north', lat: 32.7922, lng: 35.5312, wave: 1 },
  { slug: 'nof-hagalil', name: 'נוף הגליל', region: 'north', lat: 32.709, lng: 35.327, wave: 1 },
  { slug: 'kiryat-gat', name: 'קרית גת', region: 'south', lat: 31.61, lng: 34.7642, wave: 1 },
  { slug: 'ramat-hasharon', name: 'רמת השרון', region: 'sharon', lat: 32.1461, lng: 34.8394, wave: 1 },
  { slug: 'zichron-yaakov', name: 'זכרון יעקב', region: 'north', lat: 32.5707, lng: 34.9516, wave: 1 },
  { slug: 'pardes-hanna-karkur', name: 'פרדס חנה כרכור', region: 'sharon', lat: 32.4711, lng: 34.9675, wave: 1 },
];

export const cityBySlug = (s: string) => cities.find((c) => c.slug === s);
export const regionBySlug = (s: string) => regions.find((r) => r.slug === s);

/** מרחק בק"מ (haversine) */
export function km(a: City, b: City) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
