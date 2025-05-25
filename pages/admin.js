// pages/admin.js
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';

const ROLES = ['admin', 'judge', 'contestant'];

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [users, setUsers] = useState([]);
  const router = useRouter();

  // 🔐 Protect page: only allow admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        return;
      }

      setCurrentUser(user);

      const userDoc = await getDocs(collection(db, 'users'));
      const currentUserDoc = userDoc.docs.find(doc => doc.id === user.uid);
      const role = currentUserDoc?.data()?.role || '';

      setCurrentUserRole(role);

      if (role !== 'admin') {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 📥 Load all users
  useEffect(() => {
    const loadUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(list);
    };

    loadUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role: newRole });

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Role Manager</h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2 border">Display Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t">
              <td className="p-2 border">{user.displayName || '(No name)'}</td>
              <td className="p-2 border">{user.email}</td>
              <td className="p-2 border">
                <select
                  className="p-1 border rounded"
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                >
                  {ROLES.map((roleOption) => (
                    <option key={roleOption} value={roleOption}>
                      {roleOption}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
