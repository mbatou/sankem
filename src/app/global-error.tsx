"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#0A0A0A",
          color: "#F5F5F0",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem" }}>Something went wrong</h1>
        <p style={{ color: "#A8A8A2" }}>An unexpected error occurred.</p>
        <button
          onClick={reset}
          style={{
            border: "1px solid rgba(245,245,240,0.3)",
            padding: "0.75rem 1.5rem",
            color: "#F5F5F0",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: "0.8rem",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
