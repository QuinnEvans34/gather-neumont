import { useNavigate } from "react-router-dom";
import { NEUMONT_LOGO } from "../../config/assets";
import { useAuth } from "../../features/auth/AuthContext";
import { useProfile } from "../../features/profile/ProfileContext";

export default function OnboardingLanding() {
  const auth = useAuth();
  const profile = useProfile();
  const navigate = useNavigate();

  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 520, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img
            src={NEUMONT_LOGO}
            alt="Neumont logo"
            style={{ height: 56, width: "auto", display: "block" }}
          />
        </div>

        <h1 style={{ marginTop: 16 }}>Welcome</h1>
        <p style={{ marginTop: 8, opacity: 0.9 }}>
          Get set up in a few quick steps: profile, avatar, major.
        </p>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255, 255, 255, 0.18)",
              background: "rgba(255, 255, 255, 0.12)",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Sign in
          </button>

          <button
            onClick={() => {
              auth.continueAsGuest();
              profile.resetProfile();
              navigate("/onboarding/profile");
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255, 255, 255, 0.18)",
              background: "rgba(255, 255, 255, 0.06)",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Continue as guest
          </button>
        </div>

        <p style={{ marginTop: 12, fontSize: 13, opacity: 0.85 }}>
          Mode: <strong>{auth.mode}</strong>
        </p>
      </div>
    </div>
  );
}
