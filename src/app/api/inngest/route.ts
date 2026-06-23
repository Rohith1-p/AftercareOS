import { serve } from "inngest/next";
import { inngest, functions } from "@/lib/inngest";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
