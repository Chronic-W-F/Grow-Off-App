// pages/upload.js
import { storage } from '../firebase';
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  onAuthStateChanged,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

export default function Upload() {
  const [user, setUser] = useState(null);
  const [week, setWeek] = useState('');
  const [logText, setLogText] = useState('');
  const [images, setImages] = useState([]);
  const [role, setRole] = useState('');
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
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUpload = async () => {
    if (!week || !logText || images.length === 0) {
      alert('Please fill in all fields and select at least one image.');
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};

    // Upload all images
    const imageUrls = await Promise.all(
      Array.from(images).map(async (file) => {
        const path = `uploads/${user.uid}/week${week}/${file.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
      })
    );

    const newGrowLogs = { ...userData.growLogs, [week]: logText };
    const newImages = {
      ...userData.uploadedImages,
      [week]: [...(userData.uploadedImages?.[week] || []), ...imageUrls],
    };

    await setDoc(userRef, {
      ...userData,
      displayName: userData.displayName || user.email.split('@')[0],
      growLogs: newGrowLogs,
      uploadedImages: newImages,
      submittedWeeks: [...new Set([...(userData.submittedWeeks || []), week])],
    });

    alert('Week submission saved!');
    setWeek('');
    setLogText('');
    setImages([]);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Upload Weekly Entry</h1>

      <label>Week Number:</label>
      <input
        type="text"
        value={week}
        onChange={(e) => setWeek(e.target.value)}
        placeholder="e.g., 1"
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
