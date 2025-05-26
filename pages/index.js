// pages/gallery/index.js
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';

export default function JudgeGallery() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log('✅ Logged in UID:', currentUser.uid);
        setUser(currentUser);

        const rolesRef = collection(db, 'roles');
        const snapshot = await getDocs(rolesRef);
        const rolesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('📦 Roles List:', rolesList);

        let userRole = rolesList.find((entry) => entry.id === currentUser.uid)?.role;

        // 🛡 Full God Mode fallback (admin + judge)
        const isFallbackAdmin = currentUser.email === 'admin@demo.com';
        const isFallbackJudge = currentUser.email === 'judge1@demo.com';
        const defaultRole = isFallbackAdmin
          ? 'admin'
          : isFallbackJudge
          ? 'judge'
          : 'contestant';

        if (!userRole) {
          console.log('🆕 No role found, creating default role:', defaultRole);
          const roleDoc = doc(db, 'roles', currentUser.uid);
          await updateDoc(roleDoc, { role: defaultRole }).catch(async () => {
            await setDoc(roleDoc, { role: defaultRole });
          });
          userRole = defaultRole;
        }

        console.log('🎯 Matched Role:', userRole);
        setRole(userRole);
        setLoading(false);
      } else {
        console.log('❌ No user, redirecting to home...');
        setUser(null);
        setRole('none');
        setLoading(false);
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (role === 'judge' || role === 'admin') {
      const fetchData = async () => {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsersData(users);
      };

      fetchData();
    } else if (role && role !== 'judge' && role !== 'admin') {
      router.push('/');
    }
  }, [role]);

  const handleNoteChange = async (userId, week, note) => {
    const userRef = doc(db, 'users', userId);
    const user = usersData.find((u) => u.id === userId);
    const currentNotes = user.judgeNotes || {};
    const updatedNotes = { ...currentNotes, [week]: note };

    await updateDoc(userRef, {
      judgeNotes: updatedNotes,
    });

    setUsersData((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, judgeNotes: updatedNotes } : u))
    );
  };

  if (loading || !user || role === null) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Judge Area</h1>
      <button onClick={() => router.push('/')} style={{ float: 'right' }}>
        Back to Home
      </button>

      {Array.isArray(usersData) && usersData.length > 0 ? (
        usersData.map((user) => (
          <div key={user.id} style={{ marginBottom: '3rem' }}>
            <h2>{user.displayName || 'Unnamed Contestant'}</h2>

            {user.growLogs &&
              Object.keys(user.growLogs).map((week) => (
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
                    <strong>Grow Log:</strong> {user.growLogs[week]}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {user.uploadedImages?.[week]?.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`img-${idx}`}
                        style={{ width: '200px', borderRadius: '8px' }}
                      />
                    ))}
                  </div>

                  <textarea
                    placeholder="Judge notes..."
                    rows={3}
                    style={{ width: '100%', marginTop: '1rem' }}
                    defaultValue={user.judgeNotes?.[week] || ''}
                    onBlur={(e) => handleNoteChange(user.id, week, e.target.value)}
                  />
                </div>
              ))}
          </div>
        ))
      ) : (
        <p>No contestant data available.</p>
      )}
    </div>
  );
}
