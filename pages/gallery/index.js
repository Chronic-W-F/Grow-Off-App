// pages/gallery/index.js
import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';

export default function JudgeGallery() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [contestantData, setContestantData] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        // Fetch the user's role from Firestore
        const rolesRef = collection(db, 'roles');
        const snapshot = await getDocs(rolesRef);
        const userRole = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .find((entry) => entry.id === user.uid)?.role;

        setRole(userRole || '');
        if (userRole !== 'judge' && userRole !== 'admin') {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (role === 'judge' || role === 'admin') {
      const fetchData = async () => {
        const postsRef = collection(db, 'contestantPosts');
        const snapshot = await getDocs(postsRef);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setContestantData(data);
      };

      fetchData();
    }
  }, [role]);

  if (!user || (role !== 'judge' && role !== 'admin')) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Judge Area</h1>
      <button onClick={() => router.push('/')} style={{ float: 'right' }}>
        Back to Home
      </button>
      {contestantData.length === 0 ? (
        <p>No contestant posts available.</p>
      ) : (
        contestantData.map((entry) => (
          <div key={entry.id} style={{ marginBottom: '2rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
            <h2>{entry.username || 'Unnamed Contestant'}</h2>
            <p>Week: {entry.week}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {entry.images?.map((url, idx) => (
                <img key={idx} src={url} alt={`img-${idx}`} style={{ width: '200px', borderRadius: '8px' }} />
              ))}
            </div>
            <textarea
              placeholder="Judge notes..."
              rows={4}
              style={{ width: '100%', marginTop: '1rem' }}
              defaultValue={entry.judgeNotes || ''}
            />
            <button style={{ marginTop: '0.5rem' }}>Save Notes</button>
          </div>
        ))
      )}
    </div>
  );
}
