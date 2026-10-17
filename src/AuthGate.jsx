import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabase.js";
import App from "./App.jsx";

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 20,
    background: "#f7f6f2",
    fontFamily: "'DM Sans', Arial, sans-serif",
    color: "#202938",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 32,
    background: "#fff",
    border: "1px solid #e8e8e5",
    borderRadius: 12,
    boxShadow: "0 12px 40px #10182712",
  },
  logo: {
    width: 48,
    height: 48,
    display: "grid",
    placeItems: "center",
    border: "1px solid #cda956",
    borderRadius: 10,
    color: "#a98739",
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 20,
  },
  heading: { margin: "0 0 8px", fontSize: 23, fontWeight: 800 },
  description: {
    margin: "0 0 24px",
    color: "#7e8795",
    fontSize: 13,
    lineHeight: 1.6,
  },
  label: {
    display: "block",
    margin: "15px 0 7px",
    fontSize: 12,
    fontWeight: 700,
  },
  input: {
    boxSizing: "border-box",
    width: "100%",
    padding: 12,
    border: "1px solid #dfe2e7",
    borderRadius: 6,
    fontSize: 14,
  },
  button: {
    width: "100%",
    padding: 13,
    marginTop: 20,
    border: 0,
    borderRadius: 6,
    background: "#cda956",
    color: "#172033",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  message: {
    marginTop: 16,
    padding: 12,
    borderRadius: 6,
    background: "#fff0ef",
    color: "#a63b35",
    fontSize: 12,
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },
};

function MessagePage({ title, message, onSignOut }) {
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.logo}>R</div>
        <h1 style={styles.heading}>{title}</h1>
        <p style={styles.description}>{message}</p>
        {onSignOut && (
          <button style={styles.button} onClick={onSignOut}>
            Sign out
          </button>
        )}
      </section>
    </main>
  );
}

export default function AuthGate() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      return;
    }

    let alive = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!alive) return;
      setSession(nextSession);
      setProfile(null);
      setProfileError("");
      setAuthError("");
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) setAuthError("Unable to restore your session. Please try again.");
      setSession(data?.session ?? null);
      setCheckingSession(false);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user?.id) {
      setProfile(null);
      setCheckingProfile(false);
      setProfileError("");
      return;
    }

    let alive = true;
    setCheckingProfile(true);
    setProfile(null);
    setProfileError("");

    async function loadProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, is_active")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        setProfileError(
          "We couldn't verify your account profile. Check the database setup and access policies, then try again."
        );
      } else if (!data) {
        setProfileError(
          "No profile exists for this account. Ask the shop administrator to check account provisioning."
        );
      } else if (!data.is_active) {
        setProfileError(
          "This account is inactive. Contact the shop administrator."
        );
      } else if (data.role !== "admin") {
        setProfileError(
          "This account is not authorized to access the administrator dashboard."
        );
      } else {
        setProfile(data);
      }

      setCheckingProfile(false);
    }

    loadProfile();

    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  async function handleLogin(event) {
    event.preventDefault();
    setAuthError("");

    if (!supabase) return;

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthError("Sign-in failed. Check your email and password.");
      } else {
        setPassword("");
      }
    } catch {
      setAuthError("Unable to sign in. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError("Sign-out failed. Please try again.");
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    return (
      <MessagePage
        title="Setup required"
        message="Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local .env.local file, then restart the development server."
      />
    );
  }

  if (checkingSession || (session && checkingProfile)) {
    return (
      <MessagePage
        title="Checking your account"
        message="Please wait while we securely verify your session and administrator access."
      />
    );
  }

  if (!session) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <div style={styles.logo}>R</div>
          <h1 style={styles.heading}>Royal Barber Shop</h1>
          <p style={styles.description}>
            Administrator sign-in. Use an existing authorized account.
          </p>

          <form onSubmit={handleLogin}>
            <label style={styles.label} htmlFor="admin-email">
              Email address
            </label>
            <input
              id="admin-email"
              style={styles.input}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label style={styles.label} htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              style={styles.input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <button
              style={styles.button}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {authError && <div style={styles.message}>{authError}</div>}
        </section>
      </main>
    );
  }

  if (!profile || profileError) {
    return (
      <MessagePage
        title="Access not granted"
        message={profileError || "Your administrator profile could not be verified."}
        onSignOut={handleSignOut}
      />
    );
  }

  return <App profile={profile} onSignOut={handleSignOut} />;
}
