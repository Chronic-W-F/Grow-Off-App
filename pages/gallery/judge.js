// pages/gallery/judge.js

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

export default function JudgeView() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [contestants, setContestants] = useState([]);
  const [notes, setNotes] = useState({});
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const userRole = userData?.role || '';
        setRole(userRole);

        if (userRole === 'judge' || userRole === 'admin') {
          const snapshot = await getDocs(collection(db, 'users'));
          const allUsers = snapshot.docs.map((docSnap) => ({
            uid: docSnap.id,
            ...docSnap.data(),
          }));

          const filtered = allUsers.filter((u) => u.role === 'contestant');
          setContestants(filtered);
        } else {
          alert('Access denied. Judges and admins only.');
          router.push('/');
        }
      } else {
        setUser(null);
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleNoteChange = (uid, week, text) => {
    setNotes((prev) => ({
      ...prev,
      [uid]: {
        ...(prev[uid] || {}),
        [week]: text,
      },
    }));
  };

  const saveNote = async (uid, week) => {
    const userRef = doc(db, 'users', uid);
    const weekKey = `judgeNotes.${week}`;
    try {
      await updateDoc(userRef, {
        [weekKey]: notes[uid]?.[week] || '',
      });
      alert(`Note saved for week ${week}`);
    } catch (err) {
      console.error('Error saving judge note:', err);
      alert('Failed to save note');
    }
  };

  if (!user || (role !== 'judge' && role !== 'admin')) return null;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">👨‍⚖️ Judge View: All Contestants</h1>

      {contestants.map((c) => (
        <div key={c.uid} className="mb-10 border rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-1">{c.displayName || c.email}</h2>
          <p className="text-sm text-gray-500 mb-4">{c.email}</p>

          <div className="bg-yellow-50 p-3 rounded border mb-4">
            <h3 className="font-semibold mb-2">🌱 Grow Log Entries:</h3>
            {[...Array(12)].map((_, i) => {
              const week = (i + 1).toString();
              const entry = c.growLogs && typeof c.growLogs === 'object' ? c.growLogs[week] : '';
              return (
                <div key={week} className="mb-4">
                  <p className="font-semibold text-sm text-gray-600 mb-1">Week {week}</p>
                  <p className="whitespace-pre-line text-gray-800 mb-2 min-h-[2rem]">
                    {entry ? entry : <span className="italic text-gray-400">No log submitted.</span>}
                  </p>

                  <textarea
                    rows={3}
                    placeholder="Your notes for this week..."
                    className="w-full p-2 border rounded mb-2"
                    value={notes[c.uid]?.[week] || ''}
                    onChange={(e) => handleNoteChange(c.uid, week, e.target.value)}
                  />
                  <button
                    onClick={() => saveNote(c.uid, week)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    💾 Save Judge Note
                  </button>
                </div>
              );
            })}
          </div>

          {c.uploadedImages && c.uploadedImages.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">📸 Uploaded Images:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {c.uploadedImages.map((img, i) => (
                  <div key={i} className="relative">
                    <img
                      src={img.url}
                      alt={`Week ${img.week}`}
                      className="rounded shadow"
                    />
                    <div className="absolute top-1 left-1 bg-black text-white text-xs px-2 py-0.5 rounded">
                      Week {img.week}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
