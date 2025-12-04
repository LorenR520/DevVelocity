import * as React from "react";

export default function FailedPaymentEmail({ amount }: { amount: number }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Payment Failed</h1>

        <p style={styles.text}>
          We were unable to process your recent DevVelocity payment of{" "}
          <strong>${amount.toFixed(2)}</strong>.
        </p>

        <p style={styles.text}>
          This may occur due to an expired card, insufficient funds, or a bank
          decline. Your account will remain active during the grace period.
        </p>

        <a href="{APP_URL}/dashboard/billing" style={styles.button}>
          Update Payment Method
        </a>

        <p style={styles.footer}>
          If this continues, automated cloud builds will pause until payment is
          successful.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#0d0d0d",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    color: "#ffffff",
  },
  card: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#1a1a1a",
    padding: "30px",
    borderRadius: "10px",
    border: "1px solid #222",
  },
  title: {
    fontSize: "26px",
    fontWeight: "bold",
    color: "#ff5757",
    marginBottom: "20px",
    textAlign: "center" as const,
  },
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
  text: { fontSize: "15px", color: "#ccc", marginBottom: "14px" },
  footer: {
    fontSize: "13px",
    color: "#666",
    marginTop: "30px",
    textAlign: "center" as const,
  },
};
