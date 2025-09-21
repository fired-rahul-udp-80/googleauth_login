import React, { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

/**
 * Simple flow:
 * - User clicks GoogleLogin -> we get credentialResponse.credential (id_token)
 * - POST /auth/google with { token }
 * - Backend verifies, creates/returns JWT and user
 * - Store JWT in localStorage; use it for protected requests
 */

const API = "http://localhost:5000"; // adjust if backend is on another host

function App() {
  const [user, setUser] = useState(null);
  const [jwt, setJwt] = useState(localStorage.getItem("jwt") || null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (jwt) {
      axios
        .get(`${API}/profile/me`, { headers: { Authorization: `Bearer ${jwt}` } })
        .then((r) => {
          setProfile(r.data.user);
          setUser(r.data.user);
        })
        .catch((err) => {
          console.error("Profile fetch failed", err);
          setJwt(null);
          localStorage.removeItem("jwt");
        });
    }
  }, [jwt]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // credentialResponse.credential is the Google ID token
      const token = credentialResponse?.credential;
      if (!token) return alert("No credential received");

      const res = await axios.post(`${API}/auth/google`, { token });
      const { token: jwtToken, user } = res.data;
      setUser(user);
      setJwt(jwtToken);
      localStorage.setItem("jwt", jwtToken);
      setProfile(user);
    } catch (err) {
      console.error("Login error", err);
      alert("Login failed");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    setJwt(null);
    localStorage.removeItem("jwt");
  };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "Arial, sans-serif" }}>
      <h1>Google Login (JWT) Demo</h1>

      {!user ? (
        <>
          <p>Sign in with Google:</p>
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert("Google Sign In Failed")} />
        </>
      ) : (
        <div>
          <h3>Welcome, {user.name}</h3>
          <img src={user.picture} alt="avatar" style={{ width: 80, borderRadius: 40 }} />
          <p>{user.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}

      <hr />

      <h4>Protected: fetch profile using stored JWT</h4>
      {profile ? (
        <pre style={{ background: "#f8f8f8", padding: 12 }}>{JSON.stringify(profile, null, 2)}</pre>
      ) : (
        <p>No profile loaded. Log in to fetch profile.</p>
      )}
    </div>
  );
}

export default App;
