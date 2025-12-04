import * as React from "react";

export default function OverageWarningEmail({
  limit,
  current,
}: {
  limit: number;
  current: number;
}) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Usage Limit Reached</h1>

        <p style={styles.text}>
          You've used <strong>{current}</strong> units of your{" "}
          <strong>{limit}</strong> included workload for this billing cycle.
        </p>

        <p style={styles.text}>
          Additional usage will incur metered charges at your plan's overage
          rate.
        </p>

        <a href="{APP_URL}/dashboard/billing/usage" style={styles.button}>
          View Usage
        </a>

        <p style={styles.footer}>
          Consider upgrading to the Team or Enterprise plan for higher limits.
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
    color: "#ff4d4d",
    textAlign: "center" as const,
    marginBottom: "20px",
  },
  text: { fontSize: "15px", color: "#ccc", marginBottom: "16px" },
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
