import * as React from "react";

export default function UpcomingInvoiceEmail({
  amount,
  date,
}: {
  amount: number;
  date: string;
}) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Upcoming Invoice</h1>

        <p style={styles.text}>
          This is a reminder that your next DevVelocity invoice of{" "}
          <strong>${amount.toFixed(2)}</strong> will be charged on{" "}
          <strong>{date}</strong>.
        </p>

        <p style={styles.text}>
          Your subscription includes all image updates, provider syncing,
          template automation, and team features.
        </p>

        <p style={styles.footer}>
          No action is required unless your payment method has changed.
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
    color: "#4da6ff",
    textAlign: "center" as const,
    marginBottom: "20px",
  },
  text: { fontSize: "15px", color: "#ccc", marginBottom: "16px" },
  footer: { fontSize: "13px", color: "#666", marginTop: "20px" },
};
