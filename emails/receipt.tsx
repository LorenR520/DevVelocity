import * as React from "react";

interface ReceiptProps {
  amount: number;
  plan: string;
  seats?: number;
  date?: string;
  period?: string;
  invoiceId?: string;
}

export default function ReceiptEmail({
  amount,
  plan,
  seats = 1,
  date = new Date().toLocaleDateString(),
  period = "Monthly",
  invoiceId = "",
}: ReceiptProps) {
  return (
    <div
      style={{
        backgroundColor: "#0f0f0f",
        padding: "40px",
        borderRadius: "12px",
        color: "#ffffff",
        fontFamily: "Arial, Helvetica, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {/* HEADER */}
      <h1
        style={{
          marginBottom: "10px",
          fontSize: "26px",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        DevVelocity Receipt
      </h1>

      <p
        style={{
          color: "#b5b5b5",
          textAlign: "center",
          marginBottom: "30px",
          fontSize: "15px",
        }}
      >
        Thank you for your subscription. Your automation engine is active.
      </p>

      {/* RECEIPT PANEL */}
      <div
        style={{
          backgroundColor: "#1a1a1a",
          padding: "24px",
          borderRadius: "8px",
        }}
      >
        <p style={{ margin: "6px 0" }}>
          <strong>Plan:</strong> {plan}
        </p>

        <p style={{ margin: "6px 0" }}>
          <strong>Seats:</strong> {seats}
        </p>

        <p style={{ margin: "6px 0" }}>
          <strong>Billing Cycle:</strong> {period}
        </p>

        {invoiceId && (
          <p style={{ margin: "6px 0" }}>
            <strong>Invoice ID:</strong> {invoiceId}
          </p>
        )}

        <p style={{ margin: "6px 0" }}>
          <strong>Date:</strong> {date}
        </p>

        <p
          style={{
            marginTop: "18px",
            fontSize: "20px",
            fontWeight: "bold",
            color: "#4dabff",
          }}
        >
          Total Charged: ${amount}
        </p>
      </div>

      {/* FOOTER */}
      <p
        style={{
          marginTop: "30px",
          textAlign: "center",
          fontSize: "13px",
          color: "#666",
        }}
      >
        DevVelocity — Automated Multi-Cloud Image Engine<br />
        This email was sent automatically from your billing events.
      </p>
    </div>
  );
}
