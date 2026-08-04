import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "list_how_it_works_steps",
  title: "List how-it-works steps",
  description:
    "List the three public steps of the rental flow, from subscribing to peer-to-peer garment care.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const steps = [
      {
        step: 1,
        title: "Subscribe & Select",
        body: "Pick a tier, from Weekend Passes to Creator Packs. Browse a curated, high-aesthetic digital catalog of verified items.",
      },
      {
        step: 2,
        title: "Secure & Insured Delivery",
        body: "Every piece is shipped via professional, fully insured 3PL couriers. Unbox on video, wear it, and pack it back up.",
      },
      {
        step: 3,
        title: "Peer-to-Peer Care",
        body: "Return it to the original owner who handles the garment care. Zero hidden platform fees, just pure fashion rotation.",
      },
    ];
    return {
      content: [{ type: "text", text: JSON.stringify(steps, null, 2) }],
      structuredContent: { steps },
    };
  },
});
