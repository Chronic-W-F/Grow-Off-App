// pages/gallery.js

import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export default function GalleryPage() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState({});
  const [editing, setEditing] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        const data = snap.data();
        setRole(data?.role || '');

        if (data?.role === 'judge' || data?.role === 'admin') {
          const usersSnapshot = await db.collection('users').get();
          const usersData = usersSnapshot.docs
            .filter((doc) => doc.data().role === 'contestant')
            .map((doc) => ({ id: doc.id, ...doc.data() }));
          setAllUsers(usersData);
        }
      } else {
        setUser(null);
        setRole('');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleNoteChange = (userId, week, value) => {
    setSelectedNotes((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [week]: value,
      },
    }));
  };

  const saveJudgeNote = async (userId, week) => {
    const note = selectedNotes[userId]?.[week] || '';
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    const data = snap.data();
    const existingNotes = data?.judgeNotes || {};
    const updated = {
      ...existingNotes,
      [week]: note,
    };
    await updateDoc(userRef, {
      judgeNotes: updated,
    });
    alert('Note saved');
    setEditing((prev) => ({ ...prev, [userId]: { ...prev[userId], [week]: false } }));
  };

  if (!user || (role !== 'judge' && role !== 'admin')) {
    return <p className="p-6 text-center">Access denied.</p>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">👨‍⚖️ Judge View: All Contestants</h1>
        <a href="/" className="text-blue-600 underline hover:text-blue-800 text-sm">
          ← Back to Home
        </a>
      </div>

      {allUsers.map((contestant) => (
        <div key={contestant.id} className="mb-12 border p-4 rounded bg-white shadow">
          <h2 className="text-lg font-bold mb-1">{contestant.displayName || 'Unnamed Contestant'}</h2>
          <p className="text-sm text-gray-500 mb-4">{contestant.email}</p>

          {[...Array(12)].map((_, i) => {
            const week = (i + 1).toString();
            const log = contestant.growLogs?.[week] || '';
            const images = (contestant.uploadedImages || []).filter((img) => img.week === week);
            const note = contestant.judgeNotes?.[week] || '';
            const isEditing = editing[contestant.id]?.[week];

            return (
              <div key={week} className="mb-6 bg-yellow-50 p-4 rounded">
                <p className="font-semibold text-md mb-1">Week {week}</p>
                <p className="mb-2 text-gray-700 min-h-[2rem]">
                  {log || <em className="text-gray-400">No log submitted.</em>}
                </p>

                {isEditing ? (
                  <>
                    <textarea
                      className="w-full p-2 border rounded mb-2"
                      rows={3}
                      value={selectedNotes[contestant.id]?.[week] || note}
                      onChange={(e) => handleNoteChange(contestant.id, week, e.target.value)}
                    />
                    <button
                      onClick={() => saveJudgeNote(contestant.id, week)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      💾 Save Judge Note
                    </button>
                  </>
                ) : (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600 min-h-[2rem]">
                      {note || <em className="text-gray-400">No judge note submitted.</em>}
                    </p>
                    <button
                      onClick={() => setEditing((prev) => ({
                        ...prev,
                        [contestant.id]: { ...prev[contestant.id], [week]: true },
                      }))}
                      className="text-blue-600 underline text-sm"
                    >
                      Edit Note
                    </button>
                  </div>
                )}

                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                    {images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={`Week ${week}`}
                        className="rounded shadow"
                      />
                    ))}
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
