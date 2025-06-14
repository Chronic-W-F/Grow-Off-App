// pages/index.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { useRouter } from 'next/router';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';

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
  const [role, setRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const rolesRef = collection(db, 'roles');
        const snapshot = await getDocs(rolesRef);
        const rolesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        let userRole = rolesList.find((entry) => entry.id === currentUser.uid)?.role;

        const isFallbackAdmin = currentUser.email === 'admin@demo.com';
        const isFallbackJudge = currentUser.email === 'judge1@demo.com';
        const defaultRole = isFallbackAdmin
          ? 'admin'
          : isFallbackJudge
          ? 'judge'
          : 'contestant';

        if (!userRole) {
          const roleDoc = doc(db, 'roles', currentUser.uid);
          await updateDoc(roleDoc, { role: defaultRole }).catch(async () => {
            await setDoc(roleDoc, { role: defaultRole });
          });
          userRole = defaultRole;
        }

        setRole(userRole);
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Grow-Off App Home</h1>

      {!user ? (
        <>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: 'block', marginBottom: '1rem' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: 'block', marginBottom: '1rem' }}
          />
          <button onClick={handleLogin}>Login</button>
        </>
      ) : (
        <>
          <p>Logged in as: {user.email}</p>
          <p>Role: {role}</p>
          <button onClick={handleLogout}>Logout</button>

          {(role === 'judge' || role === 'admin') && (
            <button
              style={{ marginLeft: '1rem' }}
              onClick={() => router.push('/gallery')}
            >
              Judge Area
            </button>
          )}

          {role === 'contestant' && (
            <>
              <button onClick={() => router.push('/upload')}>Upload Week</button>
              <button onClick={() => router.push('/my-gallery')}>My Gallery</button>
            </>
          )}
        </>
      )}
    </div>
  );
}
