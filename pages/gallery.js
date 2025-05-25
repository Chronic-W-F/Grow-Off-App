import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function ContestantGallery() {
  const [user, setUser] = useState(undefined);
  const [imagesByWeek, setImagesByWeek] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return setUser(null);
      setUser(firebaseUser);

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const images = data.uploadedImages || [];

        // Group by week
        const grouped = {};
        for (const img of images) {
          const week = img.week || 0;
          if (!grouped[week]) grouped[week] = [];
          grouped[week].push(img);
        }

        setImagesByWeek(grouped);
      }
    });

    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return <p className="p-6 text-center">Loading...</p>;
  }

  if (!user) {
    return <p className="p-6 text-center">Please log in to view your gallery.</p>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Grow Log</h1>

      {Object.keys(imagesByWeek)
        .sort((a, b) => Number(a) - Number(b))
        .map((week) => (
          <div key={week} className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Week {week}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imagesByWeek[week].map((img, index) => (
                <img
                  key={index}
                  src={img.url}
                  alt={`Week ${week}`}
                  className="rounded shadow cursor-pointer hover:scale-105 transition"
                  onClick={() => setSelectedImage(img.url)}
                />
              ))}
            </div>
          </div>
        ))}

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="Full View" className="max-h-[90vh] max-w-[90vw] rounded shadow-lg" />
        </div>
      )}
    </div>
  );
}
