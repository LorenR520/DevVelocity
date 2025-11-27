import * as React from "react";

export default function SeatLimitEmail({
  included,
  current,
}: {
  included: number | string;
  current: number;
}) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Seat Limit Reached</h1>

        <p style={styles.text}>
          Your plan includes <strong>{included}</strong> seats. You now have{" "}
          <strong>{current}</strong> assigned.
        </p>

        <p style={styles.text}>
          Additional team members will incur seat-based charges. You can review
          or upgrade anytime.
        </p>

        <a href="{APP_URL}/dashboard/team" style={styles.button}>
          Manage Team
        </a>

        <p style={styles.footer}>
          For unlimited seats, upgrade to the Enterprise plan.
        </p>
      </div>
    </div>
  );
}

const styles = {
  .../* same styles as others */ {},
};
