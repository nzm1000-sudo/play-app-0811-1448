'use strict';

/* ---------- Field catalog: everything the app can remember about a person ---------- */
const SEL = {
  gender: ['זכר', 'נקבה'],
  maritalStatus: ['רווק/ה', 'נשוי/אה', 'גרוש/ה', 'אלמן/ה', 'ידוע/ה בציבור'],
  hmo: ['כללית', 'מכבי', 'מאוחדת', 'לאומית'],
  education: ['תיכונית', 'תעודת בגרות', 'מקצועית / הנדסאי', 'תואר ראשון', 'תואר שני', 'תואר שלישי'],
};
const FIELDS = [
  ['אישי', 'firstName', 'שם פרטי', 'text', 'given-name'],
  ['אישי', 'lastName', 'שם משפחה', 'text', 'family-name'],
  ['אישי', 'idNumber', 'תעודת זהות', 'id'],
  ['אישי', 'birthDate', 'תאריך לידה', 'date', 'bday'],
  ['אישי', 'gender', 'מין', 'select'],
  ['אישי', 'maritalStatus', 'מצב משפחתי', 'select'],
  ['אישי', 'fatherName', 'שם האב', 'text'],
  ['אישי', 'motherName', 'שם האם', 'text'],
  ['אישי', 'prevLastName', 'שם משפחה קודם', 'text'],
  ['אישי', 'birthCountry', 'ארץ לידה', 'text', 'country-name'],
  ['אישי', 'aliyahDate', 'תאריך עלייה', 'date'],
  ['קשר', 'phone', 'טלפון נייד', 'tel', 'tel'],
  ['קשר', 'phone2', 'טלפון נוסף', 'tel'],
  ['קשר', 'email', 'דוא״ל', 'email', 'email'],
  ['כתובת', 'street', 'רחוב', 'text', 'address-line1'],
  ['כתובת', 'houseNum', 'מספר בית', 'text'],
  ['כתובת', 'apt', 'דירה', 'text'],
  ['כתובת', 'city', 'יישוב', 'text', 'address-level2'],
  ['כתובת', 'zip', 'מיקוד', 'zip', 'postal-code'],
  ['כתובת', 'poBox', 'תא דואר', 'text'],
  ['משפחה', 'spouseName', 'שם בן/בת הזוג', 'text'],
  ['משפחה', 'spouseId', 'ת״ז בן/בת הזוג', 'id'],
  ['משפחה', 'childrenCount', 'מספר ילדים', 'number'],
  ['עבודה', 'occupation', 'מקצוע', 'text', 'organization-title'],
  ['עבודה', 'employer', 'מקום עבודה', 'text', 'organization'],
  ['עבודה', 'jobTitle', 'תפקיד', 'text'],
  ['עבודה', 'workPhone', 'טלפון בעבודה', 'tel'],
  ['עבודה', 'education', 'השכלה', 'select'],
  ['בנק', 'bankName', 'בנק', 'text'],
  ['בנק', 'bankBranch', 'מספר סניף', 'number'],
  ['בנק', 'bankAccount', 'מספר חשבון', 'number'],
  ['בריאות', 'hmo', 'קופת חולים', 'select'],
  ['בריאות', 'allergies', 'רגישויות ואלרגיות', 'text'],
  ['בריאות', 'emergencyName', 'איש קשר לחירום', 'text'],
  ['בריאות', 'emergencyPhone', 'טלפון לחירום', 'tel'],
  ['מסמכים ורכב', 'passport', 'מספר דרכון', 'text'],
  ['מסמכים ורכב', 'passportExp', 'תוקף דרכון', 'date'],
  ['מסמכים ורכב', 'licenseNum', 'מספר רישיון נהיגה', 'text'],
  ['מסמכים ורכב', 'licenseExp', 'תוקף רישיון נהיגה', 'date'],
  ['מסמכים ורכב', 'carNumber', 'מספר רכב', 'text'],
  ['מסמכים ורכב', 'carTestExp', 'תוקף טסט לרכב', 'date'],
  ['מסמכים ורכב', 'carInsExp', 'תוקף ביטוח רכב', 'date'],
].map(([g, k, l, t, ac]) => ({ g, k, l, t, ac }));
// Computed from other fields, never typed.
const DERIVED = { fullName: 'שם מלא', fullAddress: 'כתובת מלאה', age: 'גיל', today: 'תאריך היום', hebToday: 'תאריך עברי' };
const FIELD = Object.fromEntries(FIELDS.map(f => [f.k, f]));
const GROUPS = [...new Set(FIELDS.map(f => f.g))];
const CORE = ['firstName', 'lastName', 'idNumber', 'birthDate', 'gender', 'phone', 'email', 'street', 'houseNum', 'city'];
const EXPIRY = { passportExp: 'הדרכון', licenseExp: 'רישיון הנהיגה', carTestExp: 'הטסט לרכב', carInsExp: 'ביטוח הרכב' };

/* ---------- Built-in templates. p = which person (role index); f = free field remembered by label ---------- */
// Body wording: {0.key} = value, {f.label} = free field, {g0:זכר|נקבה} = word by person 0's gender.
const P = (k, p = 0, l) => ({ k, p, l });
const F = (f, t = 'text') => ({ f, t });
const BUILTIN = [
  { id: 'personal', title: 'פרטים אישיים', icon: 'user', desc: 'טופס פרטים כללי', sign: true,
    fields: ['firstName', 'lastName', 'idNumber', 'birthDate', 'gender', 'maritalStatus', 'phone', 'email', 'street', 'houseNum', 'apt', 'city', 'zip'].map(k => P(k)) },
  { id: 'job', title: 'מועמדות לעבודה', icon: 'brief', desc: 'פרטים, ניסיון והשכלה', sign: true,
    fields: [P('fullName'), P('idNumber'), P('birthDate'), P('phone'), P('email'), P('fullAddress'), P('education'), P('occupation'),
      P('employer', 0, 'מקום עבודה אחרון'), F('המשרה המבוקשת'), F('זמינות להתחלה', 'date'), F('ציפיות שכר'), F('ממליצים', 'textarea')] },
  { id: 'child', title: 'הרשמה לחוג או גן', icon: 'child', desc: 'פרטי הילד וההורה', sign: true, roles: ['ההורה', 'הילד/ה'],
    fields: [F('שם החוג / המסגרת'), F('שנת לימודים'), P('fullName', 1, 'שם הילד/ה'), P('idNumber', 1, 'ת״ז הילד/ה'), P('birthDate', 1), P('age', 1),
      P('hmo', 1), P('allergies', 1), P('fullName', 0, 'שם ההורה'), P('idNumber', 0, 'ת״ז ההורה'), P('phone', 0), P('email', 0), P('fullAddress', 0),
      P('emergencyName', 0), P('emergencyPhone', 0)] },
  { id: 'trip', title: 'אישור הורים לפעילות', icon: 'flag', desc: 'טיול, מחנה או אירוע', sign: true, roles: ['ההורה', 'הילד/ה'],
    fields: [F('שם הפעילות'), F('תאריך הפעילות', 'date'), P('fullName', 0, 'שם ההורה'), P('idNumber', 0, 'ת״ז ההורה'), P('phone', 0),
      P('fullName', 1, 'שם הילד/ה'), P('allergies', 1), F('הערות', 'textarea')],
    body: 'אני הח״מ {0.fullName}, ת״ז {0.idNumber}, {g0:מאשר|מאשרת} ל{g1:בני|בתי} {1.fullName} להשתתף ב{f.שם הפעילות} בתאריך {f.תאריך הפעילות}.\nניתן להשיג אותי בטלפון {0.phone}.' },
  { id: 'poa', title: 'ייפוי כוח', icon: 'key', desc: 'הרשאה לפעול בשמך', sign: true, roles: ['מייפה הכוח', 'מיופה הכוח'],
    fields: [P('fullName', 0, 'שם מייפה הכוח'), P('idNumber', 0, 'ת״ז מייפה הכוח'), P('fullAddress', 0), P('fullName', 1, 'שם מיופה הכוח'),
      P('idNumber', 1, 'ת״ז מיופה הכוח'), F('מטרת ייפוי הכוח', 'textarea')],
    body: 'אני הח״מ {0.fullName}, ת״ז {0.idNumber}, מכתובת {0.fullAddress}, מייפה בזאת את {g1:כוחו|כוחה} של {1.fullName}, ת״ז {1.idNumber}, לפעול בשמי בעניין הבא:\n{f.מטרת ייפוי הכוח}' },
  { id: 'declare', title: 'הצהרה כללית', icon: 'pen', desc: 'הצהרה חתומה בשמך', sign: true,
    fields: [P('fullName'), P('idNumber'), P('fullAddress'), F('תוכן ההצהרה', 'textarea')],
    body: 'אני הח״מ {0.fullName}, ת״ז {0.idNumber}, מכתובת {0.fullAddress}, {g0:מצהיר|מצהירה} בזאת כי:\n{f.תוכן ההצהרה}\nולראיה באתי על החתום.' },
  { id: 'bank', title: 'פרטי חשבון בנק', icon: 'bank', desc: 'להחזרים ותשלומים', sign: true,
    fields: [P('fullName', 0, 'שם בעל החשבון'), P('idNumber'), P('bankName'), P('bankBranch'), P('bankAccount'), P('phone')] },
  { id: 'medical', title: 'שאלון רפואי', icon: 'heart', desc: 'רקע רפואי ואיש קשר', sign: true,
    fields: [P('fullName'), P('idNumber'), P('birthDate'), P('age'), P('hmo'), P('allergies'), F('תרופות קבועות', 'textarea'), F('מחלות רקע', 'textarea'),
      P('emergencyName'), P('emergencyPhone')] },
];
const ICONS = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/>',
  child: '<circle cx="12" cy="6" r="3"/><path d="M12 9v7M8 12h8M9 21l3-5 3 5"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  key: '<circle cx="8" cy="14" r="4"/><path d="M11 11l8-8M16 6l3 3"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  bank: '<path d="M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  doc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  next: '<path d="M6 9l6 6 6-6"/>',
  share: '<path d="M12 3v12M8 7l4-4 4 4M5 13v7h14v-7"/>',
  print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>',
  sign: '<path d="M3 17c3-5 5-5 6-2s3 2 5-1 3-2 4 0 2 1 3 0M3 21h18"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
};
const icon = n => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.doc}</svg>`;

/* ---------- Pure helpers (tested in test.js) ---------- */
function validId(v) {
  v = String(v || '').replace(/\D/g, '');
  if (v.length < 5 || v.length > 9) return false;
  v = v.padStart(9, '0');
  let s = 0;
  for (let i = 0; i < 9; i++) { const d = +v[i] * (i % 2 + 1); s += d > 9 ? d - 9 : d; }
  return s % 10 === 0;
}
const validPhone = v => /^(0\d{8,9}|\+972\d{8,9})$/.test(String(v || '').replace(/[\s-]/g, ''));
const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
function ageOf(iso, now = new Date()) {
  if (!iso) return '';
  const b = new Date(iso + 'T00:00');
  if (isNaN(b)) return '';
  let a = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) a--;
  return a >= 0 ? String(a) : '';
}
const fmtDate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso || ''); };
const isoOf = d => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const todayIso = () => isoOf(new Date());

// Hebrew numerals: 15 → ט״ו, 787 → תשפ״ז.
function gematria(n) {
  const L = [[400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'], [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'], [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'],
    [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א']];
  let s = '';
  while (n > 0) {
    if (n === 15 || n === 16) { s += n === 15 ? 'טו' : 'טז'; break; }
    const [v, ch] = L.find(([v]) => v <= n);
    s += ch; n -= v;
  }
  return s.length === 1 ? s + '׳' : s.slice(0, -1) + '״' + s.slice(-1);
}
function hebDate(d = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(d);
    const get = t => +parts.find(p => p.type === t).value;
    const month = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' }).formatToParts(d).find(p => p.type === 'month').value;
    return `${gematria(get('day'))} ב${month} ${gematria(get('year') % 1000)}`;
  } catch { return ''; }
}

// Fill placeholders: {g0:m|f} by gender, {0.fullName} / {f.label} by value; missing values become a blank line.
function renderBody(body, values, genders = []) {
  return String(body || '')
    .replace(/\{g(\d):([^|{}]*)\|([^|{}]*)\}/g, (_, i, m, f) => genders[i] === 'נקבה' ? f : genders[i] === 'זכר' ? m : m === f ? m : `${m}/${f}`)
    .replace(/\{([^{}]+)\}/g, (_, key) => {
      const v = values[key];
      return v ? (/^\d{4}-\d{2}-\d{2}$/.test(v) ? fmtDate(v) : v) : '__________';
    });
}

// Value of a profile key, including derived ones.
function profileValue(pf, k) {
  const v = (pf && pf.fields) || {};
  switch (k) {
    case 'fullName': return [v.firstName, v.lastName].filter(Boolean).join(' ');
    case 'fullAddress': {
      const st = [v.street, v.houseNum].filter(Boolean).join(' ') + (v.apt ? ` דירה ${v.apt}` : '');
      return [st.trim(), v.city, v.zip].filter(Boolean).join(', ');
    }
    case 'age': return ageOf(v.birthDate);
    case 'today': return todayIso();
    case 'hebToday': return hebDate();
    default: return v[k] || '';
  }
}

// Documents that expire within `within` days (or already expired), soonest first.
function expiryAlerts(profiles, now = new Date(), within = 60) {
  const t0 = new Date(isoOf(now) + 'T00:00');
  const out = [];
  profiles.forEach(p => Object.entries(EXPIRY).forEach(([k, what]) => {
    const iso = p.fields && p.fields[k];
    if (!iso) return;
    const days = Math.round((new Date(iso + 'T00:00') - t0) / 864e5);
    if (isNaN(days) || days > within) return;
    const whose = p.name === 'אני' || !p.name ? `${what} שלך` : `${what} של ${p.name}`;
    const when = days < 0 ? `פג לפני ${-days} ימים` : days === 0 ? 'פג היום' : days === 1 ? 'יפוג מחר' : `יפוג בעוד ${days} ימים`;
    out.push({ pid: p.id, days, text: `${whose} ${when}` });
  }));
  return out.sort((a, b) => a.days - b.days);
}
const completeness = p => Math.round(100 * CORE.filter(k => p && p.fields[k]).length / CORE.length);

// Smart paste: pull profile fields out of free text (a message, an email, text copied from a photo of an ID).
const SYN = {
  firstName: ['שם פרטי', 'פרטי'], lastName: ['שם משפחה', 'משפחה'], fullName: ['שם מלא', 'שם'],
  idNumber: ['תעודת זהות', 'ת"ז', 'תז', 'מספר זהות', 'מס זהות', 'זהות'], birthDate: ['תאריך לידה', 'ת. לידה', 'לידה'],
  phone: ['טלפון נייד', 'נייד', 'טלפון', 'פלאפון', 'סלולרי', 'טל'], phone2: ['טלפון נוסף', 'טלפון בבית'],
  email: ['דואר אלקטרוני', 'דוא"ל', 'מייל', 'אימייל', 'email', 'e-mail'], fullAddress: ['כתובת מלאה', 'כתובת', 'מען'],
  city: ['יישוב', 'ישוב', 'עיר'], bankAccount: ['מספר חשבון', 'חשבון', 'מס חשבון'], bankBranch: ['מספר סניף', 'סניף'],
  hmo: ['קופת חולים', 'קופה'], employer: ['מקום עבודה', 'מעסיק'], carNumber: ['מספר רכב', 'רכב'], fatherName: ['שם האב', 'שם אב'], motherName: ['שם האם', 'שם אם'],
};
FIELDS.forEach(f => (SYN[f.k] = SYN[f.k] || []).push(f.l));
const normL = s => String(s).replace(/[^א-תa-zA-Z]/g, '').toLowerCase();
function toIsoDate(s) {
  const m = /(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/.exec(s || '');
  if (!m) return '';
  let [, d, mo, y] = m.map(Number);
  if (y < 100) y += y > 30 ? 1900 : 2000;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function parseAddress(s) {
  const out = {};
  s = String(s).replace(/\b(\d{7})\b/, (_, z) => { out.zip = z; return ''; });
  const [first, ...rest] = s.split(',').map(x => x.trim()).filter(Boolean);
  const m = /^(.*?)\s+(\d+[א-ת]?)(?:\s*(?:דירה|דיר'|ד')\s*(\d+))?$/.exec(first || '');
  if (m) { out.street = m[1].trim(); out.houseNum = m[2]; if (m[3]) out.apt = m[3]; } else if (first) out.street = first;
  if (rest[0]) out.city = rest[0];
  return out;
}
function parseSmart(text) {
  const out = {};
  const put = (k, v) => {
    v = String(v || '').trim().replace(/[.;,]+$/, '');
    if (!v || out[k]) return;
    if (k === 'fullName') { const [a, ...b] = v.split(/\s+/); put('firstName', a); if (b.length) put('lastName', b.join(' ')); return; }
    if (k === 'fullAddress') { Object.entries(parseAddress(v)).forEach(([kk, vv]) => put(kk, vv)); return; }
    const t = FIELD[k] && FIELD[k].t;
    if (t === 'date') v = toIsoDate(v);
    if (t === 'id') v = v.replace(/\D/g, '');
    if (k === 'hmo') v = SEL.hmo.find(h => v.includes(h)) || v;
    if (k === 'gender') v = /נקב|אישה/.test(v) ? 'נקבה' : /זכר|גבר/.test(v) ? 'זכר' : '';
    if (v) out[k] = v;
  };
  const syns = Object.entries(SYN).flatMap(([k, ls]) => ls.map(l => [k, normL(l)])).sort((a, b) => b[1].length - a[1].length);
  String(text || '').split(/\n|;|\|/).forEach(line => {
    const m = /^\s*([^:\d\n]{1,25}?)\s*[:：–-]\s*(.+)$/.exec(line);
    if (!m) return;
    const nl = normL(m[1]);
    const hit = syns.find(([, s]) => s === nl) || syns.find(([, s]) => s.length >= 3 && nl.startsWith(s));
    if (hit) put(hit[0], m[2]);
  });
  // Unlabelled values recognised by shape.
  let rest = String(text || '');
  rest = rest.replace(/[^\s@,;:]+@[^\s@,;]+\.[a-z]{2,}/i, e => { put('email', e); return ' '; });
  rest = rest.replace(/(?:\+972[-\s]?|0)5\d[-\s]?\d{3}[-\s]?\d{4}/, p => { put('phone', p); return ' '; });
  (rest.match(/\b\d{9}\b/g) || []).some(n => validId(n) && (put('idNumber', n), true));
  const z = /\b\d{7}\b/.exec(rest); if (z && !String(out.idNumber || '').includes(z[0])) put('zip', z[0]);
  const d = /\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b/.exec(rest); if (d) put('birthDate', d[0]);
  return out;
}

const fieldId = fd => fd.f ? 'f.' + fd.f : fd.p + '.' + fd.k;
const fieldType = fd => fd.f ? fd.t : (FIELD[fd.k] ? FIELD[fd.k].t : fd.k === 'age' ? 'number' : 'text');
const fieldLabel = fd => fd.f || fd.l || (FIELD[fd.k] ? FIELD[fd.k].l : DERIVED[fd.k]);

if (typeof document === 'undefined') {
  module.exports = { validId, validPhone, validEmail, ageOf, renderBody, profileValue, fmtDate, gematria, hebDate, expiryAlerts, parseSmart, parseAddress, toIsoDate };
} else {
  startApp();
}

/* ======================================================================= */
function startApp() {
  const KEY = 'tfasim:v1';
  const $ = (s, el = document) => el.querySelector(s);
  const view = $('#view');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const chev = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  let S = load();
  function load() {
    const empty = { profiles: [], templates: [], filled: [], sheets: [], memory: {}, drafts: {}, theme: 'auto' };
    try { return Object.assign(empty, JSON.parse(localStorage.getItem(KEY)) || {}); } catch { return empty; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch { toast('האחסון במכשיר מלא. כדאי למחוק טפסים ישנים.'); }
  }
  let saveTimer;
  const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(save, 300); };
  addEventListener('pagehide', save);

  // Photographed forms are big, so they live in IndexedDB; S.sheets keeps only name, date and a thumbnail.
  const idb = (() => {
    let dbp;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open('tfasim', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('sheets');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
    const tx = async (mode, fn) => {
      const db = await open();
      return new Promise((res, rej) => {
        const t = db.transaction('sheets', mode), req = fn(t.objectStore('sheets'));
        t.oncomplete = () => res(req.result); t.onerror = () => rej(t.error);
      });
    };
    return {
      get: k => tx('readonly', s => s.get(k)), set: (k, v) => tx('readwrite', s => s.put(v, k)),
      del: k => tx('readwrite', s => s.delete(k)), all: () => tx('readonly', s => s.getAll()), clear: () => tx('readwrite', s => s.clear()),
    };
  })();

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400);
  }
  const applyTheme = () => S.theme === 'auto' ? document.documentElement.removeAttribute('data-theme') : document.documentElement.setAttribute('data-theme', S.theme);
  applyTheme();

  // Bottom sheet used for pickers and confirmations.
  function drawer(title, html, onMount) {
    const d = document.createElement('div');
    d.className = 'drawer-wrap';
    d.innerHTML = `<div class="scrim"></div><div class="drawer" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="grab"></div><button class="x" aria-label="סגירה"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <h2 class="h2" style="margin-top:4px">${esc(title)}</h2>${html}</div>`;
    document.body.append(d);
    const close = () => { d.classList.remove('open'); setTimeout(() => d.remove(), 260); };
    d.querySelector('.scrim').onclick = close;
    d.querySelector('.x').onclick = close;
    requestAnimationFrame(() => d.classList.add('open'));
    onMount && onMount(d.querySelector('.drawer'), close);
    return close;
  }

  function remember(label, val) {
    val = String(val || '').trim();
    if (!val) return;
    const list = (S.memory[label] || []).filter(x => x !== val);
    list.unshift(val);
    S.memory[label] = list.slice(0, 8);
  }
  const allTemplates = () => BUILTIN.concat(S.templates);
  const tplById = id => allTemplates().find(t => t.id === id);
  const profById = id => S.profiles.find(p => p.id === id);
  const genderOf = id => (profById(id) || { fields: {} }).fields.gender;

  /* ---------- Router ---------- */
  const TABS = { '': 'forms', profiles: 'profiles', docs: 'docs', settings: 'settings' };
  let depth = 0;
  addEventListener('hashchange', () => { depth++; route(); });
  $('#back').onclick = goBack;
  function goBack() {
    const [name] = parts();
    if (!(name in TABS) && depth > 0) history.back();
    else location.hash = { fill: '#/', tpl: '#/', doc: '#/docs', sheet: '#/docs', profile: '#/profiles' }[name] || '#/';
  }
  const parts = () => location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);

  function route() {
    document.querySelectorAll('.drawer-wrap').forEach(d => d.remove());
    const [name, id] = parts();
    const tab = TABS[name];
    document.querySelectorAll('.tabs a').forEach(a => a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    $('#back').hidden = !!tab || name === undefined;
    const screens = { '': home, profiles, profile: profileEdit, fill, doc, docs, settings, tpl: tplEdit, sheet: sheetView };
    (screens[name] || home)(id);
    view.classList.remove('fade'); void view.offsetWidth; view.classList.add('fade');
    scrollTo(0, 0);
  }
  const setTitle = t => { $('#title').textContent = t; document.title = t + ' · ממלא טפסים'; };

  // Left swipe = back one screen.
  let sx = null, sy = 0;
  addEventListener('touchstart', e => {
    sx = e.target.closest('canvas, input, textarea, select, .stage, .drawer') ? null : e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  addEventListener('touchend', e => {
    if (sx === null || $('#back').hidden) return;
    const dx = e.changedTouches[0].clientX - sx, dy = Math.abs(e.changedTouches[0].clientY - sy);
    if (dx < -80 && dy < 50) goBack();
    sx = null;
  }, { passive: true });

  const ring = (pct, size = 64) => {
    const r = size / 2 - 5, c = 2 * Math.PI * r;
    return `<svg class="ring" viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px" role="img" aria-label="${pct}% מהפרטים הבסיסיים">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle">${pct}%</text></svg>`;
  };

  /* ---------- Home ---------- */
  function home() {
    setTitle('טפסים');
    const me = S.profiles[0];
    const name = me && me.fields.firstName;
    const alerts = expiryAlerts(S.profiles);
    const drafts = Object.entries(S.drafts).filter(([id, d]) => tplById(id) && Object.values(d.values || {}).some(Boolean));
    view.innerHTML = `
      <section class="hero">
        <div class="hero-top">
          <div class="hero-text">
            <b>${name ? `שלום, ${esc(name)}` : 'ברוכים הבאים'}</b>
            <small>${esc(fmtDate(todayIso()))} · ${esc(hebDate())}</small>
          </div>
          ${me ? `<a href="#/profile/${me.id}" class="hero-ring" aria-label="השלמת הפרטים שלך">${ring(completeness(me))}</a>` : ''}
        </div>
        ${!me ? `<a class="btn mark" href="#/profile/new">מילוי הפרטים שלי פעם אחת</a>`
          : `<a class="btn mark" href="#/sheet/new">${icon('camera')} מילוי על גבי טופס מצולם</a>`}
      </section>
      ${alerts.length ? `<div class="alerts">${alerts.map(a => `
        <a class="alert ${a.days < 0 ? 'late' : ''}" href="#/profile/${a.pid}">${icon('clock')}<span>${esc(a.text)}</span></a>`).join('')}</div>` : ''}
      ${drafts.length ? `<h2 class="h2">להמשיך מאיפה שעצרת</h2><div class="card list">${drafts.map(([id]) => {
        const t = tplById(id);
        return `<a class="row" href="#/fill/${esc(id)}"><span class="avatar soft">${icon(t.icon)}</span><span class="grow"><b>${esc(t.title)}</b><small>טיוטה שמורה</small></span>${chev}</a>`;
      }).join('')}</div>` : ''}
      <h2 class="h2">טפסים מוכנים</h2>
      <div class="grid">${allTemplates().map(t => `
        <a class="card tile" href="#/fill/${esc(t.id)}">
          <span class="ic">${icon(t.icon)}</span><b>${esc(t.title)}</b>${t.desc ? `<small>${esc(t.desc)}</small>` : ''}
        </a>`).join('')}
      </div>
      <div class="btns one"><a class="btn ghost" href="#/tpl/new">${icon('plus')} טופס חדש משלי</a></div>`;
  }

  /* ---------- Profiles ---------- */
  function profiles() {
    setTitle('הפרטים שלי');
    view.innerHTML = `
      <p class="sub">כל הפרטים נשמרים רק במכשיר הזה</p>
      ${S.profiles.length ? `<div class="card list">${S.profiles.map(p => `
        <a class="row" href="#/profile/${p.id}">
          <span class="avatar">${esc((p.name || '?').trim()[0] || '?')}</span>
          <span class="grow"><b>${esc(p.name || 'ללא שם')}</b><small>${esc(filledCount(p))}</small></span>
          ${ring(completeness(p), 44)}
        </a>`).join('')}</div>` : '<div class="empty">עדיין אין פרטים שמורים</div>'}
      <div class="btns one"><a class="btn" href="#/profile/new">${icon('plus')} הוספת אדם</a></div>
      <p class="sub">אפשר לשמור את עצמך, בן או בת זוג, ילדים והורים</p>`;
  }
  const filledCount = p => {
    const n = FIELDS.filter(f => p.fields[f.k]).length + Object.keys(p.custom || {}).length;
    return n ? `${n} פרטים שמורים` + (p.sig ? ' · חתימה' : '') : 'עדיין ריק';
  };

  function profileEdit(id) {
    if (id === 'new') {
      const p = { id: uid(), name: S.profiles.length ? '' : 'אני', fields: {}, custom: {}, sig: '' };
      S.profiles.push(p); save();
      history.replaceState(null, '', '#/profile/' + p.id);
      id = p.id;
    }
    const p = profById(id);
    if (!p) return profiles();
    setTitle(p.name || 'אדם חדש');
    view.innerHTML = `
      <div class="card">
        <label class="field" style="margin-top:0"><span>שם לזיהוי (למשל: אני, דנה, אבא)</span>
          <input id="pname" value="${esc(p.name)}" placeholder="שם לזיהוי" autocomplete="off"></label>
        <button class="btn mark full" id="smart">${icon('spark')} הדבקה חכמה של פרטים</button>
      </div>
      ${GROUPS.map((g, i) => {
        const fs = FIELDS.filter(f => f.g === g);
        const n = fs.filter(f => p.fields[f.k]).length;
        return `<details class="card group" ${i < 3 ? 'open' : ''}>
          <summary>${esc(g)} <span class="count">${n}/${fs.length}</span></summary>
          ${fs.map(f => inputHtml('pf.' + f.k, f.l, f.t, p.fields[f.k] || '', { ac: f.ac, key: f.k })).join('')}
        </details>`;
      }).join('')}
      <details class="card group" open>
        <summary>פרטים נוספים משלי <span class="count">${Object.keys(p.custom || {}).length}</span></summary>
        <div id="custom">${Object.entries(p.custom || {}).map(([l, v]) => customRow(l, v)).join('')}</div>
        <div class="btns one"><button class="btn ghost small" id="addCustom">${icon('plus')} הוספת פרט</button></div>
      </details>
      <div class="card"><h2 class="h2" style="margin-top:4px">חתימה</h2>
        ${p.sig ? `<img class="sig-img" src="${esc(p.sig)}" alt="החתימה השמורה">` : ''}
        <div id="sigBox"></div>
      </div>
      <div class="btns one"><button class="btn danger" id="delP">מחיקת ${esc(p.name || 'האדם')}</button></div>`;

    $('#pname').oninput = e => { p.name = e.target.value; setTitle(p.name || 'אדם חדש'); saveSoon(); };
    view.querySelectorAll('[data-key]').forEach(inp => {
      validate(inp);
      inp.addEventListener('input', () => { p.fields[inp.dataset.key] = inp.value.trim(); validate(inp); saveSoon(); });
    });
    const syncCustom = () => {
      p.custom = {};
      view.querySelectorAll('.crow').forEach(r => {
        const l = r.querySelector('.cl').value.trim(), v = r.querySelector('.cv').value.trim();
        if (l) p.custom[l] = v;
      });
      saveSoon();
    };
    $('#custom').addEventListener('input', syncCustom);
    $('#custom').addEventListener('click', e => { if (e.target.closest('.cdel')) { e.target.closest('.crow').remove(); syncCustom(); } });
    $('#addCustom').onclick = () => { $('#custom').insertAdjacentHTML('beforeend', customRow('', '')); $('#custom .crow:last-child .cl').focus(); };
    sigPad($('#sigBox'), p.sig ? 'חתימה חדשה במקום השמורה' : 'שמירת החתימה', url => { p.sig = url; save(); toast('החתימה נשמרה'); profileEdit(p.id); });
    $('#smart').onclick = () => smartPaste(p);
    $('#delP').onclick = () => {
      if (!confirm(`למחוק את כל הפרטים של ${p.name || 'האדם הזה'}?`)) return;
      S.profiles = S.profiles.filter(x => x !== p); save(); location.hash = '#/profiles';
    };
  }
  const customRow = (l, v) => `<div class="crow sunk" style="padding:10px;margin:10px 0">
      <label class="field" style="margin:0 0 8px"><span>שם הפרט</span><input class="cl" value="${esc(l)}" placeholder="למשל: מספר מנוי"></label>
      <label class="field" style="margin:0"><span>ערך</span><input class="cv" value="${esc(v)}"></label>
      <button class="btn danger small cdel" style="margin-top:8px;width:100%">הסרה</button></div>`;

  function smartPaste(p) {
    const canClip = !!(navigator.clipboard && navigator.clipboard.readText);
    drawer('הדבקה חכמה', `
      <p class="sub">הדבק טקסט עם פרטים, וכל פרט יגיע לשדה שלו. זה יכול להיות הודעה, מייל, או טקסט שסימנת והעתקת מתוך צילום של תעודה.</p>
      <label class="field"><span>הטקסט</span><textarea id="spText" placeholder="שם: דנה כהן&#10;ת״ז 000000018&#10;נייד 050-1234567"></textarea></label>
      <div class="btns${canClip ? '' : ' one'}">${canClip ? '<button class="btn ghost" id="spClip">הדבקה מהלוח</button>' : ''}<button class="btn" id="spGo">זיהוי הפרטים</button></div>
      <div id="spOut"></div>`, (el, close) => {
      if (canClip) $('#spClip', el).onclick = async () => {
        try { $('#spText', el).value = await navigator.clipboard.readText(); $('#spGo', el).click(); } catch { toast('אין הרשאה ללוח. אפשר להדביק ידנית'); }
      };
      $('#spGo', el).onclick = () => {
        const found = parseSmart($('#spText', el).value);
        const keys = Object.keys(found).filter(k => FIELD[k]);
        $('#spOut', el).innerHTML = keys.length ? `
          <div class="sunk found">${keys.map(k => `
            <label class="check"><input type="checkbox" data-k="${k}" checked>
              <span class="grow"><small class="muted">${esc(FIELD[k].l)}</small><br><bdi>${esc(FIELD[k].t === 'date' ? fmtDate(found[k]) : found[k])}</bdi>
              ${p.fields[k] && p.fields[k] !== found[k] ? `<small class="muted"> · במקום ${esc(p.fields[k])}</small>` : ''}</span></label>`).join('')}</div>
          <div class="btns one"><button class="btn" id="spApply">${icon('check')} הוספת ${keys.length} פרטים</button></div>`
          : '<p class="sub">לא זוהו פרטים. כדאי לכתוב כל פרט בשורה עם שם, למשל: מיקוד: 3303212</p>';
        const apply = $('#spApply', el);
        if (apply) apply.onclick = () => {
          el.querySelectorAll('[data-k]:checked').forEach(c => { p.fields[c.dataset.k] = found[c.dataset.k]; });
          save(); close(); toast('הפרטים נוספו'); profileEdit(p.id);
        };
      };
    });
  }

  /* ---------- Inputs ---------- */
  function inputHtml(id, label, type, value, o = {}) {
    const dl = o.suggest && o.suggest.length ? `<datalist id="dl-${esc(id)}">${o.suggest.map(s => `<option value="${esc(s)}">`).join('')}</datalist>` : '';
    const list = dl ? ` list="dl-${esc(id)}"` : '';
    const data = `${o.key ? ` data-key="${esc(o.key)}"` : ''}${o.fid ? ` data-fid="${esc(o.fid)}"` : ''} data-type="${type}"`;
    const tag = o.auto ? `<span class="tag">${esc(o.auto)}</span>` : '';
    const ac = ` autocomplete="${o.ac || 'off'}"`;
    let ctl;
    if (type === 'select') {
      const opts = SEL[o.key] || [];
      ctl = `<select id="${esc(id)}"${data}><option value="">בחירה</option>${opts.concat(value && !opts.includes(value) ? [value] : [])
        .map(x => `<option ${x === value ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`;
    } else if (type === 'textarea') {
      ctl = `<textarea id="${esc(id)}"${data}>${esc(value)}</textarea>`;
    } else {
      const map = { id: ['text', 'numeric', 'ltr'], tel: ['tel', 'tel', 'ltr'], email: ['email', 'email', 'ltr'], zip: ['text', 'numeric', 'ltr'], number: ['text', 'numeric', 'ltr'], date: ['date', '', ''] };
      const [t, im, dir] = map[type] || ['text', '', ''];
      ctl = `<input id="${esc(id)}" type="${t}"${im ? ` inputmode="${im}"` : ''}${dir ? ` dir="${dir}"` : ''} value="${esc(value)}" enterkeyhint="next"${ac}${list}${data}>`;
    }
    return `<label class="field${o.auto ? ' auto' : ''}"><span>${esc(label)} ${tag}</span>${ctl}<small class="hint"></small></label>${dl}`;
  }
  function validate(inp) {
    const v = inp.value.trim(), t = inp.dataset.type, hint = inp.parentElement.querySelector('.hint');
    let msg = '', ok = true;
    if (v && t === 'id') { ok = validId(v); msg = ok ? '✓ מספר תקין' : 'ספרת הביקורת לא מתאימה. כדאי לבדוק שוב'; }
    if (v && t === 'tel') { ok = validPhone(v); msg = ok ? '' : 'מספר טלפון לא נראה תקין'; }
    if (v && t === 'email') { ok = validEmail(v); msg = ok ? '' : 'כתובת דוא״ל לא נראית תקינה'; }
    if (v && t === 'zip') { ok = /^\d{7}$/.test(v); msg = ok ? '' : 'מיקוד בישראל הוא 7 ספרות'; }
    if (!hint) return;
    hint.textContent = msg;
    hint.className = 'hint ' + (msg ? (ok ? 'ok' : 'bad') : '');
    inp.parentElement.classList.toggle('invalid', !ok);
  }
  // Enter on the keyboard jumps to the next field.
  view.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT' || e.isComposing) return;
    const all = [...view.querySelectorAll('input:not([type=checkbox]):not([type=file]), select, textarea')];
    const next = all[all.indexOf(e.target) + 1];
    if (next) { e.preventDefault(); next.focus(); }
  });

  /* ---------- Signature pad ---------- */
  function sigPad(box, saveLabel, onSave) {
    box.innerHTML = `<div class="sig"><canvas aria-label="משטח חתימה. צייר את החתימה באצבע"></canvas>
      <div class="line"></div><div class="ph">${icon('sign')} חתום כאן באצבע</div></div>
      <div class="btns"><button class="btn ghost small" data-act="clear">ניקוי</button><button class="btn small" data-act="save">${esc(saveLabel)}</button></div>`;
    const c = box.querySelector('canvas'), ph = box.querySelector('.ph'), ctx = c.getContext('2d');
    let drawing = false, dirty = false, last = null;
    const size = () => {
      const r = c.getBoundingClientRect(), d = devicePixelRatio || 1;
      c.width = r.width * d; c.height = r.height * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = '#13235B';
    };
    requestAnimationFrame(size);
    const pt = e => { const r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: e.pressure || .5 }; };
    c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); drawing = true; last = pt(e); ph.hidden = true; dirty = true; });
    c.addEventListener('pointermove', e => {
      if (!drawing) return;
      const p = pt(e);
      ctx.lineWidth = 1.6 + p.w * 2.2;
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p;
    });
    ['pointerup', 'pointercancel'].forEach(ev => c.addEventListener(ev, () => { drawing = false; }));
    box.querySelector('[data-act="clear"]').onclick = () => { ctx.clearRect(0, 0, c.width, c.height); dirty = false; ph.hidden = false; };
    box.querySelector('[data-act="save"]').onclick = () => {
      if (!dirty) return toast('עדיין לא ציירת חתימה');
      onSave(trimCanvas(c));
    };
  }
  // Crop empty margins so the stored image is small.
  function trimCanvas(c) {
    const ctx = c.getContext('2d'), { width: w, height: h } = c, d = ctx.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3]) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < x0) return c.toDataURL();
    const pad = 8, o = document.createElement('canvas');
    o.width = x1 - x0 + pad * 2; o.height = y1 - y0 + pad * 2;
    o.getContext('2d').drawImage(c, x0 - pad, y0 - pad, o.width, o.height, 0, 0, o.width, o.height);
    return o.toDataURL('image/png');
  }

  /* ---------- Fill a form ---------- */
  function fill(tplId) {
    const t = tplById(tplId);
    if (!t) return home();
    setTitle(t.title);
    const roles = t.roles || ['ממלא הטופס'];
    const d = S.drafts[t.id] || (S.drafts[t.id] = { people: roles.map((_, i) => (S.profiles[i] || S.profiles[0] || {}).id || ''), values: {}, auto: {}, sig: '' });

    // Auto-fill: every empty (or still auto) field gets the profile value or the last remembered answer.
    t.fields.forEach(fd => {
      const id = fieldId(fd);
      if (d.values[id] && !d.auto[id]) return;
      let v = '', src = '';
      if (fd.f) { v = (S.memory[fd.f] || [])[0] || ''; src = v && 'מהזיכרון'; }
      else { v = profileValue(profById(d.people[fd.p]), fd.k); src = v && 'מולא אוטומטית'; }
      if (v || d.auto[id]) { d.values[id] = v; d.auto[id] = src; }
    });

    const suggest = fd => {
      const out = [...(S.memory[fieldLabel(fd)] || [])];
      if (fd.k) S.profiles.forEach(p => out.push(profileValue(p, fd.k)));
      return [...new Set(out.filter(Boolean))].slice(0, 8);
    };

    const people = roles.map((r, i) => `
      <div class="card slim"><h2 class="h2" style="margin-top:2px">${esc(r)}</h2>
        ${S.profiles.length ? `<div class="chips" role="group" aria-label="${esc(r)}">${S.profiles.map(p => `
          <button class="chip" data-role="${i}" data-pid="${p.id}" aria-pressed="${d.people[i] === p.id}">${esc(p.name || 'ללא שם')}</button>`).join('')}</div>`
          : `<p class="sub" style="margin:8px 0">אין עדיין פרטים שמורים. <a href="#/profile/new">להוספה</a></p>`}
      </div>`).join('');

    const saved = profById(d.people[0]);
    view.innerHTML = `
      <div class="progress" id="prog"><div class="progress-row"><span id="progTxt"></span>
        <button class="btn small ghost" id="nextEmpty">לשדה החסר ${icon('next')}</button></div><div class="bar"><i id="progBar"></i></div></div>
      ${people}
      <div class="card">
        ${t.fields.map(fd => {
          const id = fieldId(fd);
          return inputHtml('in-' + id, fieldLabel(fd), fieldType(fd), d.values[id] || '', { fid: id, key: fd.k, auto: d.auto[id], suggest: suggest(fd), ac: fd.k && FIELD[fd.k] ? FIELD[fd.k].ac : '' });
        }).join('')}
      </div>
      ${t.sign ? `<div class="card"><h2 class="h2" style="margin-top:4px">חתימה</h2><div id="sigArea"></div></div>` : ''}
      ${saved ? `<div class="card slim"><label class="check"><input type="checkbox" id="upd" checked> לשמור פרטים חדשים שהקלדתי גם בפרטים של ${esc(saved.name || 'האדם')}</label></div>` : ''}
      <div class="btns"><button class="btn ghost" id="clearF">ניקוי</button><button class="btn" id="done">הצגת הטופס</button></div>`;

    const inputs = [...view.querySelectorAll('[data-fid]')];
    const empties = () => inputs.filter(i => !i.value.trim());
    const progress = () => {
      const n = inputs.length - empties().length;
      $('#progTxt').textContent = `${n} מתוך ${inputs.length} מולאו`;
      $('#progBar').style.width = (100 * n / inputs.length) + '%';
      $('#nextEmpty').hidden = n === inputs.length;
    };
    progress();
    const focusField = inp => { inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => inp.focus({ preventScroll: true }), 300); };
    $('#nextEmpty').onclick = () => { const e = empties()[0]; if (e) focusField(e); };

    view.querySelectorAll('.chip').forEach(b => b.onclick = () => {
      d.people[+b.dataset.role] = b.dataset.pid;
      t.fields.forEach(fd => { if (!fd.f && fd.p === +b.dataset.role) d.auto[fieldId(fd)] = 'x'; }); // let the new person overwrite
      saveSoon(); fill(tplId);
    });
    inputs.forEach(inp => {
      validate(inp);
      inp.addEventListener('input', () => {
        d.values[inp.dataset.fid] = inp.value;
        if (d.auto[inp.dataset.fid]) { d.auto[inp.dataset.fid] = ''; const l = inp.closest('.field'); l.classList.remove('auto'); l.querySelector('.tag')?.remove(); }
        validate(inp); progress(); saveSoon();
      });
    });

    if (t.sign) {
      const area = $('#sigArea');
      const showSaved = url => {
        area.innerHTML = `<img class="sig-img" src="${esc(url)}" alt="החתימה שתופיע בטופס"><div class="btns one"><button class="btn ghost small" id="resign">חתימה אחרת</button></div>`;
        $('#resign').onclick = () => { d.sig = ''; d.sigOff = true; pad(); };
      };
      const pad = () => sigPad(area, 'אישור החתימה', url => { d.sig = url; saveSoon(); showSaved(url); });
      const use = d.sig || (!d.sigOff && saved && saved.sig);
      if (use) { d.sig = use; showSaved(use); } else pad();
    }

    $('#clearF').onclick = () => { if (confirm('לנקות את כל השדות בטופס?')) { delete S.drafts[t.id]; save(); fill(tplId); } };
    const finish = () => {
      const values = {}, rows = [];
      t.fields.forEach(fd => {
        const id = fieldId(fd), v = String(d.values[id] || '').trim();
        values[id] = v;
        rows.push([fieldLabel(fd), fieldType(fd) === 'date' ? fmtDate(v) : v]);
        remember(fieldLabel(fd), v);
        // Teach the profile what the user typed for a real profile field.
        const p = profById(d.people[fd.p]);
        if ($('#upd')?.checked && fd.k && FIELD[fd.k] && p && v && !p.fields[fd.k]) p.fields[fd.k] = v;
      });
      const entry = { id: uid(), tplId: t.id, title: t.title, date: new Date().toISOString(), heb: hebDate(), rows,
        body: t.body ? renderBody(t.body, values, d.people.map(genderOf)) : '', sig: d.sig || '', who: profById(d.people[0])?.name || '' };
      S.filled.unshift(entry);
      delete S.drafts[t.id];
      save();
      location.hash = '#/doc/' + entry.id;
    };
    $('#done').onclick = () => {
      if (t.sign && !d.sig) { toast('חסרה חתימה'); $('#sigArea').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const bad = inputs.filter(i => i.closest('.field').classList.contains('invalid'));
      const miss = empties();
      if (!miss.length && !bad.length) return finish();
      const labelOf = i => i.closest('.field').querySelector('span').firstChild.textContent.trim();
      drawer(miss.length ? `חסרים ${miss.length} פרטים` : 'כדאי לבדוק', `
        <div class="card list flat">${[...bad, ...miss].map((i, n) => `<button class="row" data-n="${inputs.indexOf(i)}">
          <span class="grow"><b>${esc(labelOf(i))}</b><small>${n < bad.length ? 'נראה לא תקין' : 'ריק'}</small></span>${chev}</button>`).join('')}</div>
        <div class="btns"><button class="btn ghost" id="anyway">להציג בכל זאת</button><button class="btn" id="fix">להשלים</button></div>`, (el, close) => {
        el.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { close(); focusField(inputs[+b.dataset.n]); });
        $('#fix', el).onclick = () => { close(); focusField(bad[0] || miss[0]); };
        $('#anyway', el).onclick = () => { close(); finish(); };
      });
    };
  }

  /* ---------- Finished document ---------- */
  const docText = e => [e.title, fmtDate(e.date.slice(0, 10)) + (e.heb ? ' · ' + e.heb : ''), '', ...e.rows.filter(r => r[1]).map(([k, v]) => `${k}: ${v}`), e.body ? '\n' + e.body : ''].join('\n').trim();
  function doc(id) {
    const e = S.filled.find(x => x.id === id);
    if (!e) return docs();
    setTitle(e.title);
    view.innerHTML = `
      <article class="doc" id="paper">
        <h2>${esc(e.title)}</h2>
        <div class="date">${esc(fmtDate(e.date.slice(0, 10)))}${e.heb ? ` · ${esc(e.heb)}` : ''}</div>
        <div class="kv">${e.rows.map(([k, v]) => `<div class="k">${esc(k)}</div><div class="v" data-copy="${esc(v)}"><bdi>${esc(v) || '&nbsp;'}</bdi></div>`).join('')}</div>
        ${e.body ? `<div class="body">${esc(e.body)}</div>` : ''}
        ${e.sig ? `<div class="signed"><img src="${esc(e.sig)}" alt="חתימה"><div>חתימה</div></div>` : ''}
      </article>
      <p class="sub no-print" style="margin-top:12px">נגיעה בפרט מעתיקה אותו</p>
      <div class="btns no-print">
        <button class="btn" id="print">${icon('print')} הדפסה / PDF</button>
        <button class="btn" id="share">${icon('share')} שיתוף</button>
        <button class="btn ghost" id="copy">העתקת הכול</button>
        <button class="btn ghost" id="again">מילוי מחדש</button>
      </div>
      <div class="btns one no-print"><button class="btn danger" id="del">מחיקת הטופס</button></div>`;
    view.querySelectorAll('[data-copy]').forEach(el => el.onclick = () => el.dataset.copy && copy(el.dataset.copy, 'הועתק'));
    $('#print').onclick = () => print();
    $('#copy').onclick = () => copy(docText(e), 'כל הטופס הועתק');
    $('#share').onclick = async () => {
      try {
        const files = e.sig ? [new File([await (await fetch(e.sig)).blob()], 'חתימה.png', { type: 'image/png' })] : [];
        const data = { title: e.title, text: docText(e) };
        if (files.length && navigator.canShare?.({ files })) data.files = files;
        if (navigator.share) await navigator.share(data); else copy(data.text, 'הועתק. אפשר להדביק בכל מקום');
      } catch (err) { if (err.name !== 'AbortError') copy(docText(e), 'הועתק. אפשר להדביק בכל מקום'); }
    };
    $('#again').onclick = () => {
      const t = tplById(e.tplId);
      if (!t) return toast('התבנית של הטופס הזה נמחקה');
      const values = {};
      t.fields.forEach((fd, i) => { const r = e.rows[i]; if (r) values[fieldId(fd)] = fieldType(fd) === 'date' ? r[1].split('/').reverse().join('-') : r[1]; });
      S.drafts[t.id] = { people: (t.roles || [0]).map((_, i) => (S.profiles[i] || {}).id || ''), values, auto: {}, sig: e.sig };
      save(); location.hash = '#/fill/' + t.id;
    };
    $('#del').onclick = () => { if (confirm('למחוק את הטופס הזה?')) { S.filled = S.filled.filter(x => x !== e); save(); location.hash = '#/docs'; } };
  }
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; document.body.append(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    toast(msg);
  }

  /* ---------- Documents: filled forms + photographed forms ---------- */
  function docs() {
    setTitle('המסמכים שלי');
    const items = S.filled.map(e => ({ href: '#/doc/' + e.id, title: e.title, date: e.date, who: e.who, ic: tplById(e.tplId)?.icon }))
      .concat(S.sheets.map(s => ({ href: '#/sheet/' + s.id, title: s.name, date: s.date, thumb: s.thumb, who: 'טופס מצולם' })))
      .sort((a, b) => b.date.localeCompare(a.date));
    view.innerHTML = `
      <div class="btns one"><a class="btn mark" href="#/sheet/new">${icon('camera')} מילוי על גבי טופס מצולם</a></div>
      ${items.length ? `<div class="card list">${items.map(e => `
        <a class="row" href="${e.href}">
          ${e.thumb ? `<img class="thumb" src="${esc(e.thumb)}" alt="">` : `<span class="avatar soft">${icon(e.ic)}</span>`}
          <span class="grow"><b>${esc(e.title)}</b><small>${esc(fmtDate(e.date.slice(0, 10)))}${e.who ? ' · ' + esc(e.who) : ''}</small></span>${chev}
        </a>`).join('')}</div>` : `<div class="empty">עוד אין מסמכים.<br><a href="#/">לבחירת טופס</a></div>`}`;
  }

  /* ---------- Fill on top of a photographed / PDF form ---------- */
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.append(s); });
  async function imageToPage(src, max = 1800) {
    const img = await loadImg(src), k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', .85);
  }
  async function pdfToPages(file) {
    const V = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
    if (!window.pdfjsLib) await loadScript(V + 'pdf.min.js');
    pdfjsLib.GlobalWorkerOptions.workerSrc = V + 'pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i), vp1 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: 1600 / vp1.width });
      const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      pages.push(c.toDataURL('image/jpeg', .85));
    }
    if (pdf.numPages > 10) toast('נטענו 10 העמודים הראשונים');
    return pages;
  }
  function sheetNew() {
    setTitle('מילוי על גבי טופס');
    view.innerHTML = `
      <label class="card drop" for="sheetFile">
        <span class="ic big">${icon('camera')}</span>
        <b>צילום טופס או בחירת קובץ</b>
        <small>תמונה מהמצלמה או מהגלריה, או קובץ PDF</small>
      </label>
      <input type="file" id="sheetFile" accept="image/*,application/pdf" hidden>
      <div class="card steps">
        <div><span class="num">1</span>מצלמים את הטופס ישר מלמעלה, באור טוב</div>
        <div><span class="num">2</span>נוגעים במקום שצריך למלא ובוחרים פרט מהרשימה</div>
        <div><span class="num">3</span>מוסיפים חתימה ושומרים או משתפים</div>
      </div>`;
    $('#sheetFile').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      $('.drop').classList.add('busy'); $('.drop b').textContent = 'טוען את הטופס…';
      try {
        const pdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
        let pages;
        if (pdf) pages = await pdfToPages(f);
        else { const url = URL.createObjectURL(f); pages = [await imageToPage(url)]; URL.revokeObjectURL(url); }
        const id = uid(), name = f.name.replace(/\.[^.]+$/, '').replace(/^(IMG|image|photo)[_-]?\d*$/i, '') || 'טופס מצולם';
        const sh = { id, name, date: new Date().toISOString(), who: (S.profiles[0] || {}).id || '', pages: pages.map(img => ({ img, items: [] })) };
        await idb.set(id, sh);
        S.sheets.unshift({ id, name, date: sh.date, thumb: await imageToPage(pages[0], 120) });
        save();
        location.replace('#/sheet/' + id);
      } catch (err) {
        console.error(err);
        toast(navigator.onLine ? 'לא הצלחתי לפתוח את הקובץ' : 'פתיחת PDF דורשת אינטרנט בפעם הראשונה. אפשר לצלם את הטופס במקום');
        $('.drop').classList.remove('busy'); $('.drop b').textContent = 'צילום טופס או בחירת קובץ';
      }
    };
  }

  // Text for a profile key as it should appear on paper.
  const paperValue = (pf, k) => {
    if (k === 'today') return fmtDate(todayIso());
    const v = profileValue(pf, k);
    return FIELD[k] && FIELD[k].t === 'date' ? fmtDate(v) : v;
  };

  async function sheetView(id) {
    if (id === 'new') return sheetNew();
    view.innerHTML = '<div class="empty">טוען…</div>';
    let sh;
    try { sh = await idb.get(id); } catch { sh = null; }
    if (parts()[1] !== id) return; // user navigated away while loading
    if (!sh) { S.sheets = S.sheets.filter(s => s.id !== id); save(); return docs(); }
    setTitle(sh.name);
    let pg = 0, sel = null;
    const persist = (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => idb.set(sh.id, sh).catch(() => toast('השמירה נכשלה')), 300); }; })();
    const who = () => profById(sh.who);
    // Re-resolve every item that came from a profile field for the chosen person.
    const resolve = () => sh.pages.forEach(p => p.items.forEach(it => {
      if (it.k) it.text = paperValue(who(), it.k) || it.text;
      if (it.t === 'sig' && it.fromProfile && who() && who().sig) it.src = who().sig;
    }));

    view.innerHTML = `
      ${S.profiles.length ? `<div class="chips" role="group" aria-label="מי ממלא">${S.profiles.map(p =>
        `<button class="chip" data-pid="${p.id}" aria-pressed="${sh.who === p.id}">${esc(p.name || 'ללא שם')}</button>`).join('')}</div>` : ''}
      ${sh.pages.length > 1 ? `<div class="chips">${sh.pages.map((_, i) => `<button class="chip" data-pg="${i}" aria-pressed="${!i}">עמוד ${i + 1}</button>`).join('')}</div>` : ''}
      <p class="sub">נגיעה במקום ריק מוסיפה פרט · גרירה מזיזה</p>
      <div class="stage" id="stage"><img id="pgImg" alt="הטופס"><div id="layer"></div></div>
      <div class="btns">
        <button class="btn" id="shShare">${icon('share')} שמירה ושיתוף</button>
        <button class="btn" id="shPrint">${icon('print')} הדפסה / PDF</button>
        <button class="btn ghost" id="shCopy">מילוי חדש של הטופס</button>
        <button class="btn ghost" id="shRename">שינוי שם</button>
      </div>
      <div class="btns one"><button class="btn danger" id="shDel">מחיקה</button></div>
      <div class="toolbar" id="tb" hidden>
        <button aria-label="הקטנה">א−</button><button aria-label="הגדלה">א+</button>
        <button aria-label="עריכה">${icon('pen')}</button><button aria-label="מחיקה" class="bad">✕</button><button aria-label="סיום">${icon('check')}</button>
      </div>`;
    const stage = $('#stage'), layer = $('#layer'), img = $('#pgImg'), tb = $('#tb');
    new ResizeObserver(() => stage.style.setProperty('--W', stage.clientWidth + 'px')).observe(stage);

    const items = () => sh.pages[pg].items;
    const draw = () => {
      layer.innerHTML = items().map((it, i) => `
        <div class="it ${it.t === 'sig' ? 'is-sig' : ''} ${sel === i ? 'sel' : ''}" data-i="${i}" style="right:${(1 - it.x) * 100}%;top:${it.y * 100}%;--s:${it.s || 0}">
          ${it.t === 'sig' ? `<img src="${esc(it.src)}" alt="חתימה" draggable="false" style="width:calc(var(--W) * ${it.w})">` : `<bdi>${esc(it.text)}</bdi>`}
        </div>`).join('');
      tb.hidden = sel === null;
    };
    const showPage = i => { pg = i; sel = null; img.src = sh.pages[i].img; draw(); view.querySelectorAll('[data-pg]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.pg === i)); };
    showPage(0);

    view.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => showPage(+b.dataset.pg));
    view.querySelectorAll('[data-pid]').forEach(b => b.onclick = () => {
      sh.who = b.dataset.pid; resolve(); persist(); draw();
      view.querySelectorAll('[data-pid]').forEach(x => x.setAttribute('aria-pressed', x === b));
    });

    // Tap empty paper = add; drag an item = move; tap an item = select.
    let g = null;
    stage.addEventListener('pointerdown', e => {
      const el = e.target.closest('.it');
      g = { x: e.clientX, y: e.clientY, i: el ? +el.dataset.i : null, moved: false };
      if (el) { const it = items()[g.i]; g.ox = it.x; g.oy = it.y; g.el = el; el.setPointerCapture(e.pointerId); e.preventDefault(); }
    });
    stage.addEventListener('pointermove', e => {
      if (!g) return;
      const dx = e.clientX - g.x, dy = e.clientY - g.y;
      if (Math.hypot(dx, dy) > 5) g.moved = true;
      if (g.i === null || !g.moved) return;
      const r = stage.getBoundingClientRect(), it = items()[g.i];
      it.x = Math.min(1, Math.max(0, g.ox + dx / r.width)); it.y = Math.min(1, Math.max(0, g.oy + dy / r.height));
      g.el.style.right = (1 - it.x) * 100 + '%'; g.el.style.top = it.y * 100 + '%';
    });
    stage.addEventListener('pointercancel', () => { g = null; });
    stage.addEventListener('pointerup', e => {
      if (!g) return;
      const { i, moved } = g; g = null;
      if (i !== null) { if (moved) persist(); else { sel = sel === i ? null : i; draw(); } return; }
      if (moved) return;
      if (sel !== null) { sel = null; draw(); return; }
      const r = stage.getBoundingClientRect();
      picker((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    });

    const add = it => { items().push(it); sel = null; persist(); draw(); };
    function picker(x, y) {
      const p = who();
      const keys = Object.keys(DERIVED).filter(k => k !== 'age').concat(FIELDS.map(f => f.k), ['age']);
      const vals = keys.map(k => [k, paperValue(p, k)]).filter(([, v]) => v);
      const custom = p ? Object.entries(p.custom || {}).filter(([, v]) => v) : [];
      drawer('מה לכתוב כאן?', `
        <div class="pick-free"><input id="free" placeholder="טקסט חופשי" enterkeyhint="done" list="dl-free">
          <datalist id="dl-free">${(S.memory['טקסט על טופס'] || []).map(v => `<option value="${esc(v)}">`).join('')}</datalist>
          <button class="btn small" id="freeAdd">הוספה</button></div>
        <div class="pick-grid">
          <button class="pick sym" data-sym="✓"><b>✓</b><small>סימון</small></button>
          <button class="pick sym" data-sym="✗"><b>✗</b><small>איקס</small></button>
          <button class="pick sym" id="pSig"><b>${icon('sign')}</b><small>${p && p.sig ? 'החתימה שלי' : 'חתימה'}</small></button>
          ${vals.map(([k, v]) => `<button class="pick" data-k="${k}"><small>${esc(FIELD[k] ? FIELD[k].l : DERIVED[k])}</small><b><bdi>${esc(v)}</bdi></b></button>`).join('')}
          ${custom.map(([l, v]) => `<button class="pick" data-v="${esc(v)}"><small>${esc(l)}</small><b><bdi>${esc(v)}</bdi></b></button>`).join('')}
        </div>
        ${!vals.length ? '<p class="sub">כדי לקבל כאן את הפרטים שלך, מלא אותם במסך "הפרטים שלי".</p>' : ''}
        <div id="pSigPad"></div>`, (el, close) => {
        const s = .026;
        el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { close(); add({ t: 'text', x, y, s, k: b.dataset.k, text: paperValue(who(), b.dataset.k) }); });
        el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { close(); add({ t: 'text', x, y, s, text: b.dataset.v }); });
        el.querySelectorAll('[data-sym]').forEach(b => b.onclick = () => { close(); add({ t: 'text', x, y, s: .034, text: b.dataset.sym }); });
        const free = () => { const v = $('#free', el).value.trim(); if (!v) return toast('כתוב טקסט'); remember('טקסט על טופס', v); save(); close(); add({ t: 'text', x, y, s, text: v }); };
        $('#freeAdd', el).onclick = free;
        $('#free', el).onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); free(); } };
        $('#pSig', el).onclick = () => {
          if (p && p.sig) { close(); add({ t: 'sig', x, y, w: .26, src: p.sig, fromProfile: true }); return; }
          sigPad($('#pSigPad', el), 'הוספת החתימה', url => { close(); add({ t: 'sig', x, y, w: .26, src: url }); });
          $('#pSigPad', el).scrollIntoView({ behavior: 'smooth' });
        };
      });
    }

    const [bSmall, bBig, bEdit, bDel, bDone] = tb.querySelectorAll('button');
    const scale = k => {
      const it = items()[sel];
      if (it.t === 'sig') it.w = Math.min(.8, Math.max(.08, it.w * k)); else it.s = Math.min(.12, Math.max(.012, it.s * k));
      persist(); draw();
    };
    bSmall.onclick = () => scale(1 / 1.15);
    bBig.onclick = () => scale(1.15);
    bDel.onclick = () => { items().splice(sel, 1); sel = null; persist(); draw(); };
    bDone.onclick = () => { sel = null; draw(); };
    bEdit.onclick = () => {
      const it = items()[sel];
      if (it.t === 'sig') return toast('אפשר למחוק ולהוסיף חתימה אחרת');
      const v = prompt('הטקסט', it.text);
      if (v !== null && v.trim()) { it.text = v.trim(); delete it.k; persist(); draw(); }
    };

    // Burn the filled values into real images (for sharing and printing).
    async function compose() {
      await document.fonts.ready;
      const out = [];
      for (const p of sh.pages) {
        const im = await loadImg(p.img), c = document.createElement('canvas'), W = im.naturalWidth, H = im.naturalHeight;
        c.width = W; c.height = H;
        const ctx = c.getContext('2d');
        ctx.drawImage(im, 0, 0);
        for (const it of p.items) {
          if (it.t === 'sig') {
            const s = await loadImg(it.src), w = it.w * W, h = w * s.naturalHeight / s.naturalWidth;
            ctx.drawImage(s, it.x * W - w, it.y * H - h / 2, w, h);
          } else {
            ctx.font = `500 ${it.s * W}px Rubik, system-ui, sans-serif`;
            ctx.fillStyle = '#13235B'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.direction = /[֐-׿]/.test(it.text) ? 'rtl' : 'ltr';
            ctx.fillText(it.text, it.x * W, it.y * H);
          }
        }
        out.push(c);
      }
      return out;
    }
    const blobOf = c => new Promise(r => c.toBlob(r, 'image/jpeg', .92));
    $('#shShare').onclick = async () => {
      toast('מכין את הטופס…');
      const canvases = await compose();
      const files = await Promise.all(canvases.map(async (c, i) => new File([await blobOf(c)], `${sh.name}${canvases.length > 1 ? '-' + (i + 1) : ''}.jpg`, { type: 'image/jpeg' })));
      try {
        if (navigator.canShare?.({ files })) return await navigator.share({ files, title: sh.name });
      } catch (err) { if (err.name === 'AbortError') return; }
      files.forEach(f => { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(f), download: f.name }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
      toast('התמונה נשמרה');
    };
    $('#shPrint').onclick = async () => {
      const canvases = await compose();
      const area = document.createElement('div');
      area.id = 'printArea';
      area.innerHTML = canvases.map(c => `<img src="${c.toDataURL('image/jpeg', .92)}" alt="">`).join('');
      document.body.append(area); document.body.classList.add('printing');
      await Promise.all([...area.querySelectorAll('img')].map(i => i.decode().catch(() => {})));
      const done = () => { area.remove(); document.body.classList.remove('printing'); removeEventListener('afterprint', done); };
      addEventListener('afterprint', done);
      print();
    };
    $('#shCopy').onclick = async () => {
      const copyId = uid();
      const c = { ...JSON.parse(JSON.stringify(sh)), id: copyId, date: new Date().toISOString() };
      // Keep what came from the profile (it re-fills for whoever is chosen); drop one-off text.
      c.pages.forEach(p => { p.items = p.items.filter(it => it.k || it.fromProfile || it.text === '✓' || it.text === '✗'); });
      await idb.set(copyId, c);
      S.sheets.unshift({ ...S.sheets.find(s => s.id === sh.id), id: copyId, date: c.date });
      save(); toast('נוצר עותק חדש. בחר מי ממלא');
      location.hash = '#/sheet/' + copyId;
    };
    $('#shRename').onclick = () => {
      const v = prompt('שם הטופס', sh.name);
      if (!v || !v.trim()) return;
      sh.name = v.trim(); persist(); setTitle(sh.name);
      const m = S.sheets.find(s => s.id === sh.id); if (m) { m.name = sh.name; save(); }
    };
    $('#shDel').onclick = async () => {
      if (!confirm('למחוק את הטופס המצולם?')) return;
      await idb.del(sh.id); S.sheets = S.sheets.filter(s => s.id !== sh.id); save(); location.hash = '#/docs';
    };
  }

  /* ---------- Custom template editor ---------- */
  function tplEdit(id) {
    const existing = S.templates.find(t => t.id === id);
    const t = existing ? JSON.parse(JSON.stringify(existing)) : { id: 'my-' + uid(), title: '', icon: 'doc', desc: 'טופס שלי', sign: true, fields: [], body: '' };
    setTitle(existing ? 'עריכת טופס' : 'טופס חדש');
    const draw = () => {
      view.innerHTML = `
        <div class="card">
          <label class="field" style="margin-top:0"><span>שם הטופס</span><input id="tt" value="${esc(t.title)}" placeholder="למשל: טופס הרשמה לבריכה"></label>
          <label class="check"><input type="checkbox" id="ts" ${t.sign ? 'checked' : ''}> חתימה בסוף הטופס</label>
        </div>
        <div class="card"><h2 class="h2" style="margin-top:2px">השדות בטופס</h2>
          ${t.fields.length ? t.fields.map((fd, i) => `
            <div class="row sunk" style="margin:8px 0;min-height:56px">
              <span class="grow"><b>${esc(fieldLabel(fd))}</b><small>${fd.f ? 'נשמר בזיכרון' : 'מתמלא מהפרטים'}</small></span>
              <button class="btn ghost small" data-up="${i}" aria-label="העברה למעלה" ${i ? '' : 'disabled'}>▲</button>
              <button class="btn danger small" data-rm="${i}" aria-label="הסרת ${esc(fieldLabel(fd))}">✕</button>
            </div>`).join('') : '<p class="sub">עדיין אין שדות</p>'}
          <label class="field"><span>הוספת שדה מהפרטים השמורים</span>
            <select id="addP"><option value="">בחירה</option>
              <optgroup label="מחושב">${Object.entries(DERIVED).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</optgroup>
              ${GROUPS.map(g => `<optgroup label="${g}">${FIELDS.filter(f => f.g === g).map(f => `<option value="${f.k}">${f.l}</option>`).join('')}</optgroup>`).join('')}
            </select></label>
          <div class="sunk" style="padding:12px">
            <label class="field" style="margin-top:0"><span>או שדה חופשי (האפליקציה תזכור את התשובה)</span><input id="freeL" placeholder="שם השדה"></label>
            <div class="chips" id="freeT">${[['text', 'טקסט'], ['textarea', 'טקסט ארוך'], ['date', 'תאריך'], ['number', 'מספר']].map(([v, l], i) =>
              `<button class="chip" data-t="${v}" aria-pressed="${!i}">${l}</button>`).join('')}</div>
            <div class="btns one"><button class="btn ghost small" id="addF">${icon('plus')} הוספת השדה</button></div>
          </div>
        </div>
        <div class="card">
          <label class="field" style="margin-top:0"><span>נוסח קבוע (לא חובה). אפשר לשלב פרטים כמו {0.fullName} או {f.שם השדה}, וניסוח לפי מין כמו {g0:מאשר|מאשרת}</span>
            <textarea id="tb">${esc(t.body)}</textarea></label>
        </div>
        <div class="btns${existing ? '' : ' one'}">${existing ? '<button class="btn danger" id="tdel">מחיקה</button>' : ''}<button class="btn" id="tsave">שמירת הטופס</button></div>`;
      const keep = () => { t.title = $('#tt').value.trim(); t.sign = $('#ts').checked; t.body = $('#tb').value; };
      $('#addP').onchange = e => { keep(); if (e.target.value) { t.fields.push(P(e.target.value)); draw(); } };
      $('#freeT').onclick = e => { const b = e.target.closest('.chip'); if (b) $('#freeT').querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); };
      $('#addF').onclick = () => {
        const l = $('#freeL').value.trim();
        if (!l) return toast('כתוב שם לשדה');
        if (t.fields.some(fd => fd.f === l)) return toast('יש כבר שדה בשם הזה');
        keep(); t.fields.push(F(l, $('#freeT [aria-pressed="true"]').dataset.t)); draw();
      };
      view.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { keep(); t.fields.splice(+b.dataset.rm, 1); draw(); });
      view.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { keep(); const i = +b.dataset.up; [t.fields[i - 1], t.fields[i]] = [t.fields[i], t.fields[i - 1]]; draw(); });
      $('#tsave').onclick = () => {
        keep();
        if (!t.title) return toast('חסר שם לטופס');
        if (!t.fields.length) return toast('הוסף לפחות שדה אחד');
        S.templates = S.templates.filter(x => x.id !== t.id).concat(t); save();
        toast('הטופס נשמר'); location.hash = '#/fill/' + t.id;
      };
      if (existing) $('#tdel').onclick = () => { if (confirm('למחוק את הטופס?')) { S.templates = S.templates.filter(x => x.id !== t.id); save(); location.hash = '#/'; } };
    };
    draw();
  }

  /* ---------- Settings ---------- */
  function settings() {
    setTitle('הגדרות');
    const mine = S.templates;
    view.innerHTML = `
      <div class="card"><h2 class="h2" style="margin-top:2px">מראה</h2>
        <div class="chips" id="theme">${[['auto', 'אוטומטי'], ['light', 'בהיר'], ['dark', 'כהה']].map(([v, l]) =>
          `<button class="chip" data-v="${v}" aria-pressed="${S.theme === v}">${l}</button>`).join('')}</div>
      </div>
      ${mine.length ? `<div class="card"><h2 class="h2" style="margin-top:2px">הטפסים שלי</h2>${mine.map(t => `
        <a class="row sunk" style="margin:8px 0" href="#/tpl/${t.id}"><span class="grow"><b>${esc(t.title)}</b><small>${t.fields.length} שדות · עריכה</small></span></a>`).join('')}</div>` : ''}
      <div class="card"><h2 class="h2" style="margin-top:2px">הזיכרון</h2>
        <p class="sub">${Object.keys(S.memory).length} שדות זכורים · ${S.filled.length + S.sheets.length} מסמכים</p>
        <div class="btns one"><button class="btn ghost" id="forget">ניקוי ההשלמות הזכורות</button></div>
      </div>
      <div class="card"><h2 class="h2" style="margin-top:2px">גיבוי</h2>
        <p class="sub">הכול שמור רק במכשיר הזה. כדאי לשמור גיבוי מדי פעם.</p>
        <div class="btns"><button class="btn" id="exp">שמירת גיבוי</button><label class="btn ghost" for="imp">שחזור מגיבוי</label></div>
        <input type="file" id="imp" accept="application/json,.json" hidden>
      </div>
      <div class="btns one"><button class="btn danger" id="wipe">מחיקת כל המידע</button></div>`;
    $('#theme').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; S.theme = b.dataset.v; save(); applyTheme(); settings(); };
    $('#forget').onclick = () => { if (confirm('לשכוח את כל התשובות הזכורות? הפרטים השמורים לא יימחקו.')) { S.memory = {}; save(); settings(); } };
    $('#exp').onclick = async () => {
      const name = `גיבוי-טפסים-${todayIso()}.json`;
      let sheetData = [];
      try { sheetData = await idb.all(); } catch {}
      const file = new File([JSON.stringify({ ...S, sheetData })], name, { type: 'application/json' });
      try {
        if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], title: 'גיבוי טפסים' });
      } catch (err) { if (err.name === 'AbortError') return; }
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(file), download: name });
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $('#imp').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (!Array.isArray(data.profiles) || !Array.isArray(data.filled)) throw 0;
        if (!confirm('השחזור יחליף את כל המידע הנוכחי. להמשיך?')) return;
        const { sheetData = [], ...rest } = data;
        await idb.clear();
        for (const s of sheetData) if (s && s.id) await idb.set(s.id, s);
        S = Object.assign(load(), rest, { drafts: rest.drafts || {}, sheets: rest.sheets || [] }); save(); applyTheme(); toast('הגיבוי שוחזר'); settings();
      } catch { toast('הקובץ אינו גיבוי תקין'); }
    };
    $('#wipe').onclick = async () => {
      if (!confirm('למחוק את כל הפרטים, החתימות והטפסים מהמכשיר? אי אפשר לבטל.')) return;
      localStorage.removeItem(KEY); try { await idb.clear(); } catch {}
      S = load(); applyTheme(); toast('הכול נמחק'); location.hash = '#/';
    };
  }

  route();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
