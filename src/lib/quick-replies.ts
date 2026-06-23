// Clinic-approved canned responses. (Plain module — "use server" files export
// only async functions, so this lives here.)

export const QUICK_REPLIES = [
  { label: "Normal swelling", body: "That's completely normal — swelling usually peaks Day 2–3 and eases after. Keep icing and avoid heat. You're doing great!" },
  { label: "Send a photo", body: "Thanks for letting us know. Could you send a quick photo so I can take a look? No rush." },
  { label: "Book follow-up", body: "Let's get you in to take a look. You can book here: {{book_link}} or reply with a good time." },
  { label: "Reassurance", body: "Totally understandable to be cautious! What you're describing sounds like normal healing. Reach out anytime." },
  { label: "After-hours", body: "Got it — I'll review first thing in the morning. If it's an emergency, call 911 or go to the ER." },
];
