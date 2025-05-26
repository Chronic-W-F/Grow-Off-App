// pages/dev/roles.js
import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

export default function RoleAutoFixer() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const rolesSnap = await getDocs(collection(db, 'roles'));

      const usersData = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const rolesData = rolesSnap.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data().role;
        return acc;
      }, {});

      setUsers(usersData);
      setRoles(rolesData);
      setLoading(false);
    };

    load();
  }, []);

  const autoFixRoles = async () => {
    const promises = users.map(async (user) => {
      if (!roles[user.id]) {
        const email = user.email || '';
        const fallbackRole =
          email === 'admin@demo.com'
            ? 'admin'
            : email === 'judge1@demo.com'
            ? 'judge'
            : 'contestant';

        const roleDoc = doc(db, 'roles', user.id);
        await updateDoc(roleDoc, { role: fallbackRole }).catch(async () => {
          await setDoc(roleDoc, { role: fallbackRole });
        });
      }
    });

    await Promise.all(promises);
    alert('Roles fixed for users with missing roles. Refresh to verify.');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Auto Fix Missing Roles</h1>
      {loading ? (
        <p>Loading users and roles...</p>
      ) : (
        <>
          <p>Total users: {users.length}</p>
          <p>Roles loaded: {Object.keys(roles).length}</p>
          <button onClick={autoFixRoles}>Run Auto Fix</button>
        </>
      )}
    </div>
  );
}
