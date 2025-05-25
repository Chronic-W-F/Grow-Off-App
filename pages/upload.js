import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function UploadPage() {
  const [user, setUser] = useState(null);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [week, setWeek] = useState(1);
  const [growLog, setGrowLog] = useState('');
  const [editingLog, setEditingLog] = useState(false);
  const [logSaved, setLogSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const logs = userSnap.data().growLogs || {};
          setGrowLog(logs[week] || '');
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadLogForWeek = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const logs = userSnap.data().growLogs || {};
          setGrowLog(logs[week] || '');
        }
      }
    };
    loadLogForWeek();
  }, [week]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const handleUpload = async () => {
    if (!image || !user) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', image);

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
        const imgDeleteHash = data.data.deletehash;
        setUploadedUrl(imgUrl);

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          uploadedImages: arrayUnion({
            url: imgUrl,
            deletehash: imgDeleteHash,
            uploadedAt: new Date().toISOString(),
            week,
          }),
        });
      } else {
        alert('Imgur upload failed.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed. Try again.');
    }

    setUploading(false);
  };

  const handleSaveLog = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [`growLogs.${week}`]: growLog,
      });
      setEditingLog(false);
      setLogSaved(true);
      setTimeout(() => setLogSaved(false), 2000);
    } catch (err) {
      console.error('Error saving grow log:', err);
      alert('Could not save grow log.');
    }
  };

  if (user === undefined) {
    return (
      <div className="p-6 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p>Please log in to upload your photo.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-4">
        <a
          href="/"
          className="text-blue-600 underline hover:text-blue-800 text-sm"
        >
          ← Back to Home
        </a>
      </div>

      <h1 className="text-2xl font-bold mb-4">Upload Weekly Photo</h1>

      <label className="block mb-2 font-semibold">Week #</label>
      <select
        className="block mb-4 p-2 border rounded"
        value={week}
        onChange={(e) => setWeek(Number(e.target.value))}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            Week {i + 1}
          </option>
        ))}
      </select>

      <label className="block mb-2 font-semibold">Grow Log</label>
      <textarea
        className="w-full border p-2 rounded mb-2"
        rows={6}
        value={growLog}
        onChange={(e) => setGrowLog(e.target.value)}
        disabled={!editingLog}
        placeholder="Write something about your grow this week..."
      />

      {!editingLog ? (
        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded mb-4"
          onClick={() => setEditingLog(true)}
        >
          ✏️ Edit Grow Log
        </button>
      ) : (
        <button
          className="bg-green-600 text-white px-4 py-2 rounded mb-4"
          onClick={handleSaveLog}
        >
          💾 Save Grow Log
        </button>
      )}

      {logSaved && (
        <p className="text-green-600 text-sm mb-2">Grow log saved!</p>
      )}

      <input
        type="file"
        accept="image/*"
        className="mb-4"
        onChange={handleFileChange}
      />

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Upload to Imgur'}
      </button>

      {uploadedUrl && (
        <div className="mt-4">
          <p className="mb-2">Uploaded Image:</p>
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={uploadedUrl}
              alt="Uploaded"
              className="max-w-full rounded shadow"
            />
          </a>
        </div>
      )}
    </div>
  );
}
