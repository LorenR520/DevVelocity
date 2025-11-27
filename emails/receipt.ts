// emails/receipt.tsx

import * as React from "react";

interface ReceiptProps {
  amount: number;
  plan: string;
  seats: number | string;
}

export default function ReceiptEmail({ amount, plan, seats }: ReceiptProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#0d0d0d",
        color: "#ffffff",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#1a1a1a",
          borderRadius: "10px",
          padding: "30px",
          border: "1px solid #2a2a2a",
        }}
      >
        <h1
          style={{
            margin: "0 0 20px",
            fontSize: "26px",
            fontWeight: "bold",
            textAlign: "center",
            color: "#4da6ff",
          }}
        >
          Your DevVelocity Receipt
        </h1>

        <p style={{ fontSize: "15px", marginBottom: "20px", color: "#ccc" }}>
          Thank you for your subscription! Below is a summary of your recent
          DevVelocity billing event.
        </p>

        <div
          style={{
            backgroundColor: "#111",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #222",
          }}
        >
          <p style={{ margin: "6px 0", fontSize: "15px" }}>
            <strong>Plan:</strong> {plan}
          </p>

          <p style={{ margin: "6px 0", fontSize: "15px" }}>
            <strong>Seats:</strong> {seats}
          </p>

          <p style={{ margin: "6px 0", fontSize: "15px" }}>
            <strong>Total Amount:</strong>{" "}
            <span style={{ color: "#4da6ff", fontWeight: "bold" }}>
              ${amount.toFixed(2)}
            </span>
          </p>
        </div>

        <p style={{ fontSize: "14px", color: "#888", marginBottom: "20px" }}>
          DevVelocity automatically updates image pipelines, templates, and
          provider documentation — no maintenance required.
        </p>

        <p
          style={{
            fontSize: "14px",
            color: "#666",
            textAlign: "center",
            marginTop: "30px",
          }}
        >
          If you have any questions, reply to this email — we're here to help.
        </p>
      </div>
    </div>
  );
}
