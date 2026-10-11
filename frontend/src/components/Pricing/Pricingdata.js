// ─────────────────────────────────────────────────────
//  ✏️  EDIT YOUR PLANS HERE
// ─────────────────────────────────────────────────────

export const PLANS = [
  {
    key: "starter",
    title: "Starter",
    tagline: "Perfect to get going",
    monthly: 2999,      // ₹2,499 per month
    annually: 2499,    // ₹24,999 per year (~2 months free)
    cta: "Get started",
    isBestValue: false,
    features: [
      "50 Site Plans per month",
      "Standard YOLOv8 Detection",
      "Basic Rooftop Outlining",
    ],
    extras: ["Email support", "JSON Data Export"],
  },
  {
    key: "pro",
    title: "Pro",
    tagline: "For growing teams",
    monthly: 7999,      // ₹7,999 per month
    annually: 6799,    // ₹79,999 per year
    cta: "Start free trial",
    isBestValue: true,
    features: [
      "Everything in Starter",
      "250 Site Plans per month",
      "Real-ESRGAN Sharpening",
      "Advanced Obstacle Mapping",
    ],
    extras: ["Priority support", "API access", "PNG Site Reports"],
  },
  {
    key: "enterprise",
    title: "Enterprise",
    tagline: "Built for scale",
    monthly: 24999,     // ₹24,999 per month
    annually: 20799,   // ₹2,49,999 per year
    cta: "Talk to sales",
    isBestValue: false,
    features: [
      "Everything in Pro",
      "1,000 Site Plans per month",
      "Shapely Geometry Analytics",
      "Multi-agent AI Analysis",
    ],
    extras: ["SLA guarantee", "Dedicated manager", "CAD/DXF Export"],
  },
  {
    key: "custom",
    title: "Custom",
    tagline: "Your rules, your stack",
    monthly: null,
    annually: null,
    cta: "Contact us",
    isBestValue: false,
    features: [
      "Unlimited everything",
      "On-premise option",
      "White-label ready",
    ],
    extras: ["Custom contracts", "Dedicated infra", "Custom AI Training"],
  },
];