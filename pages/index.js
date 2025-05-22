// Grow-Off App – Starter Code (Next.js + Tailwind + Firebase Setup)

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const roles = {
  admin: 'admin',
  judge: 'judge',
  contestant: 'contestant',
  tech: 'tech',
};

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        // TODO: Fetch role from Firestore or mock for now
        setRole('contestant');
      } else {
        setUser(null);
        setRole('');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-4">Grow-Off App</h1>
      {!user ? (
        <div className="space-y-4">
          <input
            className="border p-2 w-full"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="border p-2 w-full"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Log In
          </button>
        </div>
      ) : (
        <div>
          <p className="mb-4">Logged in as: <strong>{user.email}</strong> ({role})</p>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Log Out
          </button>

          {role === roles.contestant && (
            <p className="mt-4">📸 Weekly log upload coming soon</p>
          )}

          {role === roles.judge && (
            <p className="mt-4">🧑‍⚖️ End-of-competition scoring panel coming soon</p>
          )}

          {role === roles.admin && (
            <p className="mt-4">⚙️ Admin dashboard coming soon</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
