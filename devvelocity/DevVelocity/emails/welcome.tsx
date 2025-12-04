import * as React from "react";

export default function WelcomeEmail({ name }: { name: string }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome to DevVelocity</h1>

        <p style={styles.text}>
          Hey <strong>{name}</strong>, your automated multi-cloud engine is now
          live.
        </p>

        <p style={styles.text}>
          Your subscription includes automated image builds, provider syncing,
          template generation, and ongoing infrastructure intelligence.
        </p>

        <a href="{APP_URL}/dashboard" style={styles.button}>
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

const styles = {
  .../* shared styling */ {},
};
