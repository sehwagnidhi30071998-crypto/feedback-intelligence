import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Feedback Intelligence — Turn meeting talk into tracked work";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#f3f5f1",
          padding: 32,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            border: "1px solid #dce1db",
            borderRadius: 24,
            padding: 48,
            justifyContent: "space-between",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "#1c2622",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                padding: 8,
              }}
            >
              {[0.4, 0.75, 0.55, 1, 0.65, 0.85, 0.45].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: `${Math.round(h * 100)}%`,
                    background: "#e0eeeb",
                    borderRadius: 2,
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#1c2622",
                  letterSpacing: -0.3,
                  lineHeight: 1,
                }}
              >
                Feedback Intelligence
              </div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: 3,
                  color: "#8a938e",
                  marginTop: 3,
                }}
              >
                TRANSCRIPT → TICKET
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 13,
                letterSpacing: 2.5,
                color: "#8a938e",
                fontWeight: 600,
              }}
            >
              TRANSCRIPT → TICKET
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 54,
                fontWeight: 800,
                color: "#1c2622",
                lineHeight: 0.95,
                letterSpacing: -1.5,
              }}
            >
              <div>Turn meeting talk</div>
              <div>into tracked work.</div>
            </div>
            <div
              style={{
                fontSize: 18,
                color: "#5b6560",
                lineHeight: 1.4,
                maxWidth: 620,
                marginTop: 4,
              }}
            >
              Extract actionable product feedback from meeting transcripts
              and turn approved items into Jira tickets.
            </div>
          </div>

          {/* Pipeline chips */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {[
              { label: "Add transcript", bg: "#e0eeeb", fg: "#0e6b66" },
              { label: "Review feedback", bg: "#f6ecd9", fg: "#a8781f" },
              { label: "Ship to Jira", bg: "#e2efe6", fg: "#2e7d50" },
            ].map((chip, i) => (
              <div
                key={chip.label}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <div
                  style={{
                    background: chip.bg,
                    color: chip.fg,
                    borderRadius: 999,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {chip.label}
                </div>
                {i < 2 ? (
                  <div style={{ color: "#c4ccc5", fontSize: 16 }}>→</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}