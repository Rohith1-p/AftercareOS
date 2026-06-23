// Render personalization tokens + apply quiet-hours shift to send times.

export interface RenderContext {
  first_name?: string;
  clinic_name?: string;
  provider_name?: string;
  procedure?: string;
  book_link?: string;
  review_link?: string;
  reply_to?: string;
}

export function renderTemplate(body: string, ctx: RenderContext): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    const val = ctx[key as keyof RenderContext];
    return val && val.length ? val : "";
  });
}

export function hasUnfilledTokens(body: string): string[] {
  const out: string[] = [];
  const re = /\{\{\s*(\w+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) out.push(m[1]);
  return out;
}

// SMS segmentation: count message segments (GSM-7 160 / UCS-2 70, with concatenation).
export function smsSegments(text: string): number {
  const isUnicode = /[^\u0000-\u00ff]/.test(text) || /[\u2026\u2018\u2019\u201c\u201d]/.test(text);
  const perSegment = isUnicode ? 67 : 153;
  const single = isUnicode ? 70 : 160;
  const len = text.length;
  if (len <= single) return 1;
  return Math.ceil(len / perSegment);
}

// ── Quiet hours ──
// If a sendAt lands inside quiet hours (HH:mm), push to the next allowed time.
export function applyQuietHours(
  sendAt: Date,
  start?: string, // "21:00"
  end?: string, // "07:00"
): Date {
  if (!start || !end) return sendAt;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  const result = new Date(sendAt);
  const mins = result.getHours() * 60 + result.getMinutes();

  const inQuiet = startMin < endMin
    ? mins >= startMin && mins < endMin // e.g. 02:00–06:00
    : mins >= startMin || mins < endMin; // overnight e.g. 21:00–07:00

  if (!inQuiet) return result;

  // Push to end-of-quiet today (or tomorrow).
  result.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
  if (result <= sendAt) result.setDate(result.getDate() + 1);
  return result;
}

// Compute a step's sendAt from an appointment time + offset, with quiet hours.
export function computeSendAt(
  appointmentAt: Date,
  offsetMinutes: number,
  quiet?: { start?: string; end?: string },
): Date {
  const raw = new Date(appointmentAt.getTime() + offsetMinutes * 60_000);
  return quiet ? applyQuietHours(raw, quiet.start, quiet.end) : raw;
}
