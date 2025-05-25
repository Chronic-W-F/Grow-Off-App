// pages/gallery/index.js

import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export default function GalleryPage() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [images, setImages] = useState([]);
  const [logText, setLogText] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('1');
  const [growLogs, setGrowLogs] = useState({});
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        const data = snap.data();
        setRole(data?.role || '');
        setImages(data?.uploadedImages || []);
        setGrowLogs(data?.growLogs || {});
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          Authorization: 'Client-ID 06c0369bbcd9097',
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        const imgUrl = data.data.link;
        const deletehash = data.data.deletehash;

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          uploadedImages: arrayUnion({
            url: imgUrl,
            deletehash,
            week: selectedWeek,
            uploadedAt: new Date().toISOString(),
          }),
        });
        alert('Image uploaded');
        window.location.reload();
      } else {
        alert('Upload failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error.');
    }
  };

  const handleDelete = async (imgObj) => {
    const confirmDelete = confirm('Delete this image?');
    if (!confirmDelete || !user) return;

    try {
      await fetch(`https://api.imgur.com/3/image/${imgObj.deletehash}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Client-ID 06c0369bbcd9097',
        },
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        uploadedImages: arrayRemove(imgObj),
      });
      alert('Image deleted');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const handleSaveLog = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const updated = { ...growLogs, [selectedWeek]: logText };
    await updateDoc(userRef, {
      growLogs: updated,
    });
    alert('Grow log saved');
    setGrowLogs(updated);
    setLogText('');
  };

  const toggleExpanded = (week) => {
    setExpanded((prev) => ({
      ...prev,
      [week]: !prev[week],
    }));
  };

  if (!user || role !== 'contestant') {
    return <p className="p-6 text-center">Access denied.</p>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📤 Upload & Grow Log</h1>
        <a href="/" className="text-blue-600 underline hover:text-blue-800 text-sm">
          ← Back to Home
        </a>
      </div>

      <div className="mb-6">
        <label className="block mb-1 font-medium">Select Week</label>
        <select
          className="border p-2 rounded mb-4 w-full max-w-xs"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
        >
          {[...Array(12)].map((_, i) => (
            <option key={i} value={i + 1}>{`Week ${i + 1}`}</option>
          ))}
        </select>

        <input
          type="file"
          accept="image/*"
          className="mb-2"
          onChange={handleUpload}
        />

        <textarea
          className="w-full p-2 border rounded mb-2"
          placeholder="Write your grow log post for this week..."
          rows={4}
          value={logText}
          onChange={(e) => setLogText(e.target.value)}
        />

        <button
          onClick={handleSaveLog}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          💾 Save Grow Log
        </button>
      </div>

      {[...Array(12)].map((_, i) => {
        const week = (i + 1).toString();
        const weekImages = images.filter((img) => img.week === week);
        const post = growLogs?.[week] || '';

        return (
          <div key={week} className="mb-6">
            <p className="font-semibold text-lg mb-1 text-gray-700">Week {week}</p>
            <p className="whitespace-pre-line text-gray-800 mb-2 min-h-[2rem]">
              {post || <span className="italic text-gray-400">No log submitted.</span>}
            </p>

            {weekImages.length > 0 && (
              <div className="mb-2">
                <button
                  className="text-blue-600 underline mb-2"
                  onClick={() => toggleExpanded(week)}
                >
                  {expanded[week] ? 'Hide Photos' : 'Show Photos'}
                </button>

                {expanded[week] && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {weekImages.map((img, i) => (
                      <div key={i} className="relative">
                        <img
                          src={img.url}
                          alt={`Week ${img.week}`}
                          className="rounded shadow"
                        />
                        <button
                          className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded"
                          onClick={() => handleDelete(img)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
