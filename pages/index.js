import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const roles = {
  admin: 'admin',
  judge: 'judge',
  contestant: 'contestant',
  tech: 'tech',
};

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setRole('contestant'); // This is a placeholder; real roles will come from Firestore
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
    try {
      await signOut(auth);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-4">Grow-Off App</h1>

      {!user ? (
        <div className="space-y-4 max-w-md">
          <input
            className="border p-2 w-full"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="border p-2 w-full"
            placeholder="Password"
            type="password"
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
          <p className="mb-4">
            Logged in as: <strong>{user.email}</strong> ({role})
          </p>
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
          {role === roles.tech && (
            <p className="mt-4">🛠️ Developer tools (hidden in production)</p>
          )}
        </div>
      )}
    </div>
  );
}
