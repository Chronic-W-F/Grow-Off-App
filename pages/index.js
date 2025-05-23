import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        console.log("User logged in:", user.email, "UID:", user.uid);

        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log("Firestore role data:", userData);
            setRole(userData.role || 'contestant');
          } else {
            console.log("No Firestore doc found — defaulting to contestant");
            setRole('contestant');
          }
        } catch (err) {
          console.error("Error fetching Firestore role:", err);
          setRole('contestant');
        }
      } else {
        setUser(null);
        setRole('');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Login error:", err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };
console.log("🔥 Client-side component rendering!");

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Grow-Off App</h1>

      {!user ? (
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <br />
          <button type="submit">Log In</button>
        </form>
      ) : (
        <div>
          <p>Logged in as: <strong>{user.email}</strong> ({role || 'loading...'})</p>
          <button onClick={handleLogout} style={{ background: 'red', color: 'white' }}>
            Log Out
          </button>
          <div style={{ marginTop: '1rem' }}>
            📸 Weekly log upload coming soon
          </div>
        </div>
      )}
    </div>
  );
}
