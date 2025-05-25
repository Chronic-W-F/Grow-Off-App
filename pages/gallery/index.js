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
  const [editing, setEditing] = useState({});
  const [expanded, setExpanded] = useState({});
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

  const toggleExpanded = (uid, week) => {
    setExpanded((prev) => ({
      ...prev,
      [uid]: {
        ...(prev[uid] || {}),
        [week]: !prev[uid]?.[week],
      },
    }));
  };

  const toggleEdit = (uid, week, currentText = '') => {
    setEditing((prev) => ({
      ...prev,
      [uid]: {
        ...(prev[uid] || {}),
        [week]: !prev[uid]?.[week],
      },
    }));
    setNotes((prev) => ({
      ...prev,
      [uid]: {
        ...(prev[uid] || {}),
        [week]: currentText,
      },
    }));
  };

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
      setEditing((prev) => ({
        ...prev,
        [uid]: {
          ...(prev[uid] || {}),
          [week]: false,
        },
      }));
    } catch (err) {
      console.error('Error saving judge note:', err);
      alert('Failed to save note');
    }
  };

  if (!user || (role !== 'judge' && role !== 'admin')) return null;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">👨‍⚖️ Judge View: All Contestants</h1>
        <a href="/" className="text-blue-600 underline hover:text-blue-800 text-sm">
          ← Back to Home
        </a>
      </div>

      {contestants.map((c) => (
        <div key={c.uid} className="mb-10 border rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-1">{c.displayName || c.email}</h2>
          <p className="text-sm text-gray-500 mb-4">{c.email}</p>

          {[...Array(12)].map((_, i) => {
            const week = (i + 1).toString();
            const entry = c.growLogs?.[week] || '';
            const weekImages = (c.uploadedImages || []).filter((img) => img.week === week);
            const judgeNote = c.judgeNotes?.[week] || '';

            return (
              <div key={week} className="mb-6">
                <p className="font-semibold text-lg text-gray-700 mb-1">Week {week}</p>
                <p className="whitespace-pre-line text-gray-800 mb-2 min-h-[2rem]">
                  {entry || <span className="italic text-gray-400">No log submitted.</span>}
                </p>

                {weekImages.length > 0 && (
                  <div className="mb-2">
                    <button
                      className="text-blue-600 underline mb-2"
                      onClick={() => toggleExpanded(c.uid, week)}
                    >
                      {expanded[c.uid]?.[week] ? 'Hide Photos' : 'Show Photos'}
                    </button>

                    {expanded[c.uid]?.[week] && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {weekImages.map((img, i) => (
                          <div key={i} className="relative">
                            <img
                              src={img.url}
                              alt={`Week ${img.week}`}
                              className="rounded shadow"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!editing[c.uid]?.[week] ? (
                  <div className="mb-2">
                    <p className="text-gray-600">
                      <strong>Note:</strong> {judgeNote || <em className="text-gray-400">No note submitted.</em>}
                    </p>
                    <button
                      onClick={() => toggleEdit(c.uid, week, judgeNote)}
                      className="text-blue-600 underline text-sm mt-1"
                    >
                      ✏️ Edit Note
                    </button>
                  </div>
                ) : (
                  <div className="mb-2">
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
                      💾 Save Note
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
