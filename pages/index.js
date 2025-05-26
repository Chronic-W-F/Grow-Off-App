// pages/my-gallery.js
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
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
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

  const openViewer = (images, index) => {
    setViewerImages(images);
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerImages([]);
    setViewerIndex(0);
  };

  const nextImage = () => {
    setViewerIndex((viewerIndex + 1) % viewerImages.length);
  };

  const prevImage = () => {
    setViewerIndex((viewerIndex - 1 + viewerImages.length) % viewerImages.length);
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
                  style={{ width: '200px', borderRadius: '8px', cursor: 'pointer' }}
                  onClick={() => openViewer(userData.uploadedImages[week], idx)}
                />
              ))}
          </div>
        </div>
      ))}

      {viewerOpen && (
        <div
          onClick={closeViewer}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push('/');
            }}
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              fontSize: '1.2rem',
              color: 'white',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >🏠 Home</button>

          <button onClick={(e) => { e.stopPropagation(); prevImage(); }} style={{ position: 'absolute', left: '2rem', fontSize: '2rem', color: 'white' }}>⬅</button>
          <img
            src={viewerImages[viewerIndex]}
            alt={`full-${viewerIndex}`}
            style={{ maxHeight: '80vh', maxWidth: '80vw', borderRadius: '10px' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={(e) => { e.stopPropagation(); nextImage(); }} style={{ position: 'absolute', right: '2rem', fontSize: '2rem', color: 'white' }}>➡</button>
        </div>
      )}
    </div>
  );
}
