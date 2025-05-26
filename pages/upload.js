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
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleUpload = async () => {
    if (!week || !logText || images.length === 0) {
      alert('Please fill in all fields and select at least one image.');
      return;
    }

    if (isNaN(week) || parseInt(week) < 1 || parseInt(week) > 12) {
      alert('Please enter a valid week number between 1 and 12.');
      return;
    }

    const weekKey = String(week).trim();
    const userRef = doc(db, 'users', user.uid);
    setIsSubmitting(true);

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
        images.map(async (file) => {
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
      setPreviewUrls([]);
    } catch (err) {
      console.error('🔥 Upload failed:', err);
      alert('Upload failed. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Upload Weekly Entry</h1>

      <label>Week Number:</label>
      <input
        type="number"
        value={week}
        onChange={(e) => setWeek(e.target.value)}
        placeholder="e.g., 4"
        style={{ display: 'block', marginBottom: '1rem' }}
        min="1"
        max="12"
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
        onChange={handleImageChange}
        style={{ display: 'block', marginBottom: '1rem' }}
      />

      {previewUrls.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
          {previewUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`preview-${idx}`}
              style={{ width: '120px', borderRadius: '8px' }}
            />
          ))}
        </div>
      )}

      <button onClick={handleUpload} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Week'}
      </button>
    </div>
  );
}
