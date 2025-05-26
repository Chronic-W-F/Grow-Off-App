// pages/upload.js
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRou// pages/my-gallery.js
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

export default function MyGallery() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [editWeek, setEditWeek] = useState(null);
  const [editLog, setEditLog] = useState('');
  const [editImages, setEditImages] = useState([]);
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
    });

    return () => unsubscribe();
  }, []);

  const uploadToImgur = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: 'Client-ID 06c0369bbcd9097',
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || !data.data?.link) throw new Error('Imgur upload failed');
    return data.data.link;
  };

  const handleEditSave = async (weekKey) => {
    const userRef = doc(db, 'users', user.uid);
    const imageUrls = editImages.length
      ? await Promise.all(
          Array.from(editImages).map((file) => uploadToImgur(file))
        )
      : userData.uploadedImages[weekKey] || [];

    const updatedLogs = {
      ...userData.growLogs,
      [weekKey]: editLog,
    };

    const updatedImages = {
      ...userData.uploadedImages,
      [weekKey]: imageUrls,
    };

    const newData = {
      growLogs: updatedLogs,
      uploadedImages: updatedImages,
    };

    await setDoc(userRef, newData, { merge: true });
    alert(`✅ Week ${weekKey} updated.`);
    setEditWeek(null);
    setEditLog('');
    setEditImages([]);

    const updatedSnap = await getDoc(userRef);
    if (updatedSnap.exists()) {
      setUserData(updatedSnap.data());
    }
  };

  if (!userData) return <div>Loading...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>My Grow Log Gallery</h1>
      {Object.keys(userData.growLogs || {}).map((week) => (
        <div
          key={week}
          style={{
            marginBottom: '2rem',
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '8px',
          }}
        >
          <h3>
            Week {week}{' '}
            {editWeek !== week && (
              <button onClick={() => {
                setEditWeek(week);
                setEditLog(userData.growLogs[week] || '');
              }}>✏ Edit</button>
            )}
          </h3>

          {editWeek === week ? (
            <>
              <textarea
                value={editLog}
                onChange={(e) => setEditLog(e.target.value)}
                rows={4}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setEditImages(e.target.files)}
              />
              <button onClick={() => handleEditSave(week)}>💾 Save</button>
              <button onClick={() => setEditWeek(null)} style={{ marginLeft: '1rem' }}>Cancel</button>
            </>
          ) : (
            <p><strong>Grow Log:</strong> {userData.growLogs[week]}</p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Array.isArray(userData.uploadedImages?.[week]) &&
              userData.uploadedImages[week].map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`img-${idx}`}
                  style={{ width: '200px', borderRadius: '8px' }}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
ter } from 'next/router';

export default function Upload() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [week, setWeek] = useState('');
  const [logText, setLogText] = useState('');
  const [images, setImages] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return router.push('/');
      setUser(currentUser);

      const roleSnap = await getDoc(doc(db, 'roles', currentUser.uid));
      const assignedRole = roleSnap.exists() ? roleSnap.data().role : 'contestant';
      setRole(assignedRole);

      if (assignedRole !== 'contestant') router.push('/');
    });
    return () => unsubscribe();
  }, []);

  const uploadToImgur = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: 'Client-ID 06c0369bbcd9097',
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || !data.data?.link) throw new Error('Imgur upload failed');
    return data.data.link;
  };

  const handleUpload = async () => {
    if (!week || !logText || images.length === 0) {
      alert('Please fill in all fields and select at least one image.');
      return;
    }

    const weekKey = String(week).trim();
    const userRef = doc(db, 'users', user.uid);

    try {
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists()
        ? userSnap.data()
        : {
            growLogs: {},
            uploadedImages: {},
            submittedWeeks: [],
          };

      console.log('👤 Existing user data:', userData);

      const imageUrls = await Promise.all(
        Array.from(images).map(async (file) => {
          const url = await uploadToImgur(file);
          console.log('📸 Imgur Uploaded:', url);
          return url;
        })
      );

      const updatedLogs = {
        ...userData.growLogs,
        [weekKey]: logText,
      };

      const updatedImages = {
        ...userData.uploadedImages,
        [weekKey]: imageUrls,
      };

      const updatedWeeks = Array.from(
        new Set([...(userData.submittedWeeks || []), weekKey])
      ).map((w) => String(w));

      const newData = {
        displayName: userData.displayName || user.email.split('@')[0],
        growLogs: updatedLogs,
        uploadedImages: updatedImages,
        submittedWeeks: updatedWeeks,
      };

      console.log('💾 Writing to Firestore:', newData);
      await setDoc(userRef, newData, { merge: true });

      alert(`✅ Week ${weekKey} submitted successfully.`);
      setWeek('');
      setLogText('');
      setImages([]);
    } catch (err) {
      console.error('🔥 Upload failed:', err);
      alert('Upload failed. Check console for details.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Upload Weekly Entry</h1>
      <label>Week Number:</label>
      <input
        type="text"
        value={week}
        onChange={(e) => setWeek(e.target.value)}
        placeholder="e.g., 4"
        style={{ display: 'block', marginBottom: '1rem' }}
      />

      <label>Grow Log Notes:</label>
      <textarea
        value={logText}
        onChange={(e) => setLogText(e.target.value)}
        rows={4}
        style={{ display: 'block', width: '100%', marginBottom: '1rem' }}
        placeholder="What happened this week?"
      />

      <label>Upload Photos:</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setImages(e.target.files)}
        style={{ display: 'block', marginBottom: '1rem' }}
      />

      <button onClick={handleUpload}>Submit Week</button>
    </div>
  );
}
