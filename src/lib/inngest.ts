import { Inngest } from "inngest";
import { processDueMessages } from "@/lib/scheduler";

// Inngest client. In dev without keys this still constructs; functions are
// invoked by the Inngest dev server or the manual cron endpoint.
export const inngest = new Inngest({ id: "aftercareos" });

// Runs every minute: send any timed messages that are now due.
export const processDueMessagesFn = inngest.createFunction(
  { id: "process-due-messages", name: "Send due aftercare messages" },
  { cron: "* * * * *" }, // every minute
  async () => {
    const report = await processDueMessages();
    return { processed: report.processed, sent: report.sent, failed: report.failed };
  },
);

export const functions = [processDueMessagesFn];
