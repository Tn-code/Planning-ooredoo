import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { getUserRole, setUserRole, listUsers, ROLES } from "../utils/roles";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const result = await getUserRole(currentUser.uid);
        if (result.success) {
          setRole(result.data.role);
          setUserData(result.data);
        } else {
          const allUsers = await listUsers();
          const defaultRole = !allUsers.success || allUsers.data.length === 0 ? ROLES.ADMIN : ROLES.MANAGER;
          await setUserRole(currentUser.uid, defaultRole, { email: currentUser.email });
          setRole(defaultRole);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, role, userData, loading };
}
