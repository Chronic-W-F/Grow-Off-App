// pages/my-gallery.js
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';

export default function MyGallery() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return router.push('/');
      setUser(currentUser);

      const roleSnap = await getDoc(doc(db, 'roles', currentUser.uid));
      const assignedRole = roleSnap.exists() ? roleSnap.data().role : 'contestant';
      setRole(assignedRole);

      if (assignedRole !== 'contestant') {
        router.push('/');
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading || !userData) return <div>Loading...</div>;

  const { growLogs = {}, uploadedImages = {} } = userData;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>My Grow Log Gallery</h1>

      {Object.keys(growLogs).length === 0 ? (
        <p>No grow logs submitted yet.</p>
      ) : (
        Object.keys(growLogs).map((week) => (
          <div
            key={week}
            style={{
              marginBottom: '2rem',
              padding: '1rem',
              border: '1px solid #ccc',
              borderRadius: '8px',
            }}
          >
            <h3>Week {week}</h3>
            <p>
              <strong>Grow Log:</strong> {growLogs[week]}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {Array.isArray(uploadedImages[week]) &&
                uploadedImages[week].map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`img-${idx}`}
                    style={{ width: '200px', borderRadius: '8px' }}
                  />
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
