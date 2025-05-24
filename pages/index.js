// pages/index.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // First time login — create Firestore doc
          await setDoc(userRef, {
            role: 'contestant',
            displayName: user.email.split('@')[0],
            email: user.email,
            joinedAt: new Date(),
            active: true,
            submittedWeeks: [],
          });
        }

        const freshSnap = await getDoc(userRef);
        const data = freshSnap.data();

        setRole(data?.role || '');
        setDisplayName(data?.displayName || '');
      } else {
        setUser(null);
        setRole('');
        setDisplayName('');
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
          <h1 className="text-xl mb-2">Welcome, {displayName || email}</h1>
          <p className="mb-2">Role: <strong>{role || 'Loading...'}</strong></p>
          <p className="mb-4 text-sm text-gray-500">Email: {email}</p>
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
