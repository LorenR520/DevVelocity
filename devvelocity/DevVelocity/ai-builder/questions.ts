export const AI_BUILDER_QUESTIONS = [
  {
    id: 0,
    question: "Do you have a preferred cloud provider?",
    description: "AWS, Azure, GCP, DigitalOcean, Oracle, Cloudflare, or 'no preference'.",
    type: "select",
    options: [
      "AWS",
      "Azure",
      "GCP",
      "DigitalOcean",
      "Oracle",
      "Cloudflare",
      "No Preference"
    ]
  },

  {
    id: 1,
    question: "What automation goals do you have?",
    description: "AI will recommend Stripe, Lemon Squeezy, Supabase, CI/CD, or DevVelocity automations.",
    type: "multi",
    options: [
      "Build & Deploy",
      "Scaling Automation",
      "Billing Automation",
      "Monitoring",
      "Failover",
      "Security Policy Automation",
      "AI-driven Auto-Updates"
    ]
  },

  {
    id: 2,
    question: "How many cloud providers do you want to integrate?",
    description: "Your plan tier limits how many are allowed.",
    type: "number"
  },

  {
    id: 3,
    question: "How much maintenance do you want to perform?",
    description: "AI will select architectures with lower manual load if requested.",
    type: "select",
    options: [
      "Minimal (serverless / managed)",
      "Moderate (mixed VM + serverless)",
      "High control (full VM + custom automation)",
    ]
  },

  {
    id: 4,
    question: "What monthly budget range do you want to stay within?",
    description: "AI will restrict provider and resource choices to fit your tier & price cap.",
    type: "select",
    options: [
      "Under $50/mo",
      "$50 - $150/mo",
      "$150 - $500/mo",
      "$500 - $2,000/mo",
      "Unlimited"
    ]
  },

  {
    id: 5,
    question: "What level of security or compliance do you require?",
    description: "HIPAA, SOC2, ISO27001, PCI-DSS — AI will map features to tier availability.",
    type: "multi",
    options: [
      "Standard",
      "SSO / MFA",
      "Zero Trust",
      "HIPAA",
      "PCI-DSS",
      "SOC2",
      "ISO27001"
    ]
  },

  {
    id: 6,
    question: "What are you building?",
    description: "API, SaaS product, web server, internal tool, ML pipeline, or hybrid system.",
    type: "select",
    options: [
      "SaaS product",
      "API backend",
      "Data pipeline",
      "DevOps tool",
      "Internal automation system",
      "AI/ML workload",
      "E-commerce",
      "Custom Project"
    ]
  },

  {
    id: 7,
    question: "Describe your project in your own words.",
    description: "The more detail you provide, the more optimized the architecture becomes.",
    type: "textarea"
  },
];
