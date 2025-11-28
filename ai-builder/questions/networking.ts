// ai-builder/questions/networking.ts

export const networkingQuestions = [
  {
    id: "network_type",
    question: "Do you prefer a public network, private network, or hybrid?",
    options: ["public", "private", "hybrid"]
  },
  {
    id: "routing_layer",
    question: "How should traffic be routed?",
    options: [
      "Cloudflare",
      "NGINX (self-hosted)",
      "API Gateway",
      "Application Gateway",
      "Kubernetes Ingress"
    ]
  },
  {
    id: "vpc_model",
    question: "How complex should your network layout be?",
    options: [
      "Simple (1 subnet)",
      "Standard (public + private)",
      "Advanced (multi-AZ)",
      "Full mesh (enterprise)"
    ]
  },
  {
    id: "traffic_encryption",
    question: "What level of encryption do you want?",
    options: ["HTTPS basic", "mTLS", "Zero-trust tunnel", "WAF + TLS termination"]
  },
  {
    id: "access_control",
    question: "How should access be restricted?",
    options: [
      "Open access",
      "IP allowlist",
      "Private only",
      "IAM roles",
      "Network ACLs"
    ]
  },
  {
    id: "load_balancer",
    question: "Preferred load balancer:",
    options: [
      "Cloudflare LB",
      "AWS ALB",
      "AWS NLB",
      "Azure Load Balancer",
      "GCP Load Balancer",
      "Self-hosted NGINX"
    ]
  },
  {
    id: "scaling_strategy",
    question: "How should the system scale?",
    options: [
      "Vertical scaling",
      "Horizontal scaling",
      "Auto-scaling groups",
      "Container auto-scaling"
    ]
  }
];
