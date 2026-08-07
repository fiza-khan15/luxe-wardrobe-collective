import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_brand_overview",
  title: "Get brand overview",
  description:
    "Get the public positioning, tagline, and value proposition of the indrobe peer-to-peer wardrobe subscription.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const overview = {
      name: "indrobe",
      tagline: "An infinite wardrobe. Zero fast fashion.",
      audience: "Creators and students",
      pitch:
        "A premium peer-to-peer wardrobe subscription. Rent high-end aesthetics for a flat monthly fee, or monetize your own closet with zero risk.",
      founding_offer: "Founding Members open · 50 spots",
      problem_solution:
        "Buying outfits for a single event is expensive, and letting your best clothes sit unworn is a waste. The platform connects both sides securely: renters refresh their style, owners get paid for what they already own.",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(overview, null, 2) }],
      structuredContent: overview,
    };
  },
});
