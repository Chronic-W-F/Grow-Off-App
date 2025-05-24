// pages/index.js
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
        // Load role from Firestore
        const roleDoc = await getDoc(doc(db, 'users', user.uid));
        if (roleDoc.exists()) {
          setRole(roleDoc.data().role);
        } else {
          console.warn('No role found in Firestore.');
          setRole('');
        }
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
    } catch (err) {
      console.error('Login failed:', err.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      {!user ? (
        <>
          <h1 className="text-xl mb-4">Grow-Off Login</h1>
          <input
            className="block w-full mb-2 p-2 border rounded"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="block w-full mb-4 p-2 border rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleLogin}
          >
            Login
          </button>
        </>
      ) : (
        <>
          <h1 className="text-xl mb-2">Welcome, {email}</h1>
          <p className="mb-4">Role: <strong>{role || 'Loading...'}</strong></p>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={handleLogout}
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}
