import { Html } from "@react-email/html";

export default function ReceiptEmail({ amount, plan, seats }: any) {
  return (
    <Html>
      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <h2>Thank you for your DevVelocity purchase!</h2>

        <p><strong>Plan:</strong> {plan}</p>
        <p><strong>Seats:</strong> {seats}</p>
        <p><strong>Amount Charged:</strong> ${amount}</p>

        <p style={{ marginTop: "20px" }}>Questions?  
          Email <a href="mailto:support@devvelocity.app">support@devvelocity.app</a>
        </p>
      </div>
    </Html>
  );
}
