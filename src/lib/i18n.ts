// Minimal i18n for patient-facing surfaces (escalation page). Clinic picks a
// default language; per-patient override is stored on the Patient row in DB mode.

export type Lang = "en" | "es";

const T = {
  en: {
    badge: "Something's wrong",
    title: "Tell us what's going on",
    sub: "This goes straight to your clinic — before it becomes a stressful night or a public review. The sooner you tell them, the faster they can help.",
    severityLabel: "How urgent is it?",
    mild: "Mild",
    mildDesc: "Just a question",
    moderate: "Moderate",
    moderateDesc: "Something's off",
    urgent: "Urgent",
    urgentDesc: "Possible complication",
    emergency: "Emergency",
    emergencyDesc: "Severe / needs immediate help",
    concernLabel: "What's concerning you?",
    photoLabel: "Photo (optional)",
    photoHint: "Tap to upload a photo",
    placeholder: "e.g. The left side is more swollen than the right and feels firm since this morning.",
    submit: "Send to clinic",
    footer: "For a medical emergency, call 911 — this form is not monitored 24/7.",
    successTitle: "Thank you — message sent",
    successBody:
      "Your concern has been routed to the clinic directly. They'll reach out to you shortly. For a true emergency, call 911 or go to the nearest ER.",
  },
  es: {
    badge: "Algo no está bien",
    title: "Cuéntanos qué pasa",
    sub: "Esto llega directo a tu clínica — antes de que se convierta en una noche de angustia o una reseña pública. Cuanto antes lo digas, más rápido te ayudarán.",
    severityLabel: "¿Qué tan urgente es?",
    mild: "Leve",
    mildDesc: "Solo una pregunta",
    moderate: "Moderado",
    moderateDesc: "Algo no se ve bien",
    urgent: "Urgente",
    urgentDesc: "Posible complicación",
    emergency: "Emergencia",
    emergencyDesc: "Grave / necesita ayuda inmediata",
    concernLabel: "¿Qué te preocupa?",
    photoLabel: "Foto (opcional)",
    photoHint: "Toca para subir una foto",
    placeholder: "ej. El lado izquierdo está más hinchado que el derecho y se siente firme desde esta mañana.",
    submit: "Enviar a la clínica",
    footer: "Para una emergencia médica, llama al 911 — este formulario no se monitorea 24/7.",
    successTitle: "Gracias — mensaje enviado",
    successBody:
      "Tu mensaje se envió directamente a la clínica. Se comunicarán contigo pronto. Para una emergencia real, llama al 911 o ve a la sala de emergencias más cercana.",
  },
} as const;

export type TKey = keyof (typeof T)["en"];

export function t(lang: Lang, key: TKey): string {
  return T[lang]?.[key] ?? T.en[key];
}
