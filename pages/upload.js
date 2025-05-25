// pages/upload.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function UploadPage() {
  const [user, setUser] = useState(null);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

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
        setUploadedUrl(imgUrl);

        // Optional: save image URL to Firestore under user's doc
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          uploadedImages: arrayUnion({
            url: imgUrl,
            uploadedAt: new Date().toISOString(),
          }),
        });
      } else {
        alert('Upload failed.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed.');
    }

    setUploading(false);
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p>Please log in to upload your photo.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Weekly Photo</h1>

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
            <img src={uploadedUrl} alt="Uploaded" className="max-w-full rounded shadow" />
          </a>
        </div>
      )}
    </div>
  );
}
