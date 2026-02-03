import { Link } from "react-router-dom";
import { NEUMONT_LOGO } from "../config/assets";
import { MAJORS } from "../config/majors";

export default function OnboardingLanding() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ maxWidth: 520, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img
            src={NEUMONT_LOGO}
            alt="Neumont logo"
            style={{ height: 56, width: "auto", display: "block" }}
          />
        </div>

        <h1 style={{ marginTop: 16 }}>Onboarding</h1>
        <p style={{ marginTop: 8 }}>
          Asset verification: logo + major icons should load from <code>/assets</code>.
        </p>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {MAJORS.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.06)",
              }}
            >
              <img
                src={m.logoPath}
                alt={`${m.label} icon`}
                style={{ width: 36, height: 36, display: "block" }}
              />
              <div style={{ fontSize: 14, lineHeight: 1.2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        <p>
          <Link to="/">Back to game</Link>
        </p>
      </div>
    </div>
  );
}
