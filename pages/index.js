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
    <div class
