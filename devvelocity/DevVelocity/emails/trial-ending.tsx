import * as React from "react";

export default function TrialEndingEmail({ days }: { days: number }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Your Free Trial Is Ending</h1>

        <p style={styles.text}>
          Your DevVelocity trial ends in <strong>{days} days</strong>.
        </p>

        <p style={styles.text}>
          Your automations, image builds, and provider integrations will pause
          unless you choose a plan.
        </p>

        <a href="{APP_URL}/pricing" style={styles.button}>
          Choose a Plan
        </a>

        <p style={styles.footer}>
          No interruptions. No surprises. Continue your automated cloud engine.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#0d0d0d",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    color: "#fff",
  },
  card: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "30px",
    borderRadius: "10px",
    border: "1px solid #222",
    backgroundColor: "#1a1a1a",
  },
  title: {
    fontSize: "26px",
    color: "#f5a623",
    textAlign: "center" as const,
    marginBottom: "20px",
  },
  text: { fontSize: "15px", color: "#ccc", marginBottom: "14px" },
  button: {
    display: "inline-block",
    marginTop: "20px",
    padding: "12px 24px",
    backgroundColor: "#4da6ff",
    color: "#000",
    borderRadius: "6px",
    fontWeight: "bold",
    textDecoration: "none",
  },
  footer: { fontSize: "13px", color: "#666", marginTop: "20px" },
};
