import { Link } from "react-router-dom";

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
        <h1>Onboarding</h1>
        <p>This is a placeholder onboarding landing page.</p>
        <p>
          <Link to="/">Back to game</Link>
        </p>
      </div>
    </div>
  );
}

