import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function ContestantGallery() {
  const [user, setUser] = useState(undefined);
  const [imagesByWeek, setImagesByWeek] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return setUser(null);
      setUser(firebaseUser);

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const images = data.uploadedImages || [];

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

  const toggleWeek = (week) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [week]: !prev[week],
    }));
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (user === undefined) return <p className="p-6 text-center">Loading...</p>;
  if (!user) return <p className="p-6 text-center">Please log in to view your gallery.</p>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Grow Log</h1>

      {Object.keys(imagesByWeek)
        .sort((a, b) => Number(a) - Number(b))
        .map((week) => {
          const images = imagesByWeek[week];
          const lastUploaded = images
            .map((img) => img.uploadedAt)
            .sort()
            .slice(-1)[0];

          return (
            <div key={week} className="mb-6 border rounded overflow-hidden shadow-sm">
              <div
                onClick={() => toggleWeek(week)}
                className="cursor-pointer bg-gray-100 px-4 py-3 flex justify-between items-center"
              >
                <div className="font-semibold">
                  Week {week}
                  {lastUploaded && (
                    <span className="text-sm text-gray-500 block sm:inline sm:ml-2">
                      Last updated: {formatDate(lastUploaded)}
                    </span>
                  )}
                </div>
                <div className="text-sm text-blue-600">
                  {expandedWeeks[week] ? '− Hide' : '+ Show'}
                </div>
              </div>

              {expandedWeeks[week] && (
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-white">
                  {images.map((img, i) => (
                    <img
                      key={i}
                      src={img.url}
                      alt={`Week ${week}`}
                      className="rounded shadow cursor-pointer hover:scale-105 transition"
                      onClick={() => setSelectedImage(img.url)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full View"
            className="max-h-[90vh] max-w-[90vw] rounded shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
