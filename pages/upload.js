// pages/upload.js
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

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
    if (!response.ok) throw new Error(data?.data?.error || 'Imgur upload failed');
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

      const currentImages = Array.isArray(userData.uploadedImages?.[weekKey])
        ? userData.uploadedImages[weekKey]
        : [];

      const updatedImages = {
        ...userData.uploadedImages,
        [weekKey]: [...currentImages, ...imageUrls],
      };

      const updatedWeeks = Array.from(
        new Set([...(userData.submittedWeeks || []), weekKey])
      );

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
