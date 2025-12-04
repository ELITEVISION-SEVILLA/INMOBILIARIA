import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property, Tenant, Expense, User } from '../types';
import { db, auth, isConfigured, mockProperties, mockTenants, mockExpenses } from '../services/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";

interface AppContextType {
  user: User | null;
  properties: Property[];
  tenants: Tenant[];
  expenses: Expense[];
  loading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addProperty: (property: Property) => void;
  updateProperty: (property: Property) => void;
  deleteProperty: (id: string) => void;
  addTenant: (tenant: Tenant) => void;
  updateTenant: (tenant: Tenant) => void;
  deleteTenant: (id: string) => void;
  addExpense: (expense: Expense) => void;
  seedDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [configured, setConfigured] = useState(isConfigured());

  // 1. Auth Listener
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({ uid: currentUser.uid, email: currentUser.email || '' });
      } else {
        setUser(null);
        setProperties([]);
        setTenants([]);
        setExpenses([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Listeners (Real-time Sync)
  useEffect(() => {
    if (!user || !db) return;

    const unsubProps = onSnapshot(collection(db, "properties"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
      setProperties(data);
    }, (error) => console.error("Error fetching properties:", error));

    const unsubTenants = onSnapshot(collection(db, "tenants"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
      setTenants(data);
    }, (error) => console.error("Error fetching tenants:", error));

    const unsubExpenses = onSnapshot(collection(db, "expenses"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(data);
    }, (error) => console.error("Error fetching expenses:", error));

    return () => {
      unsubProps();
      unsubTenants();
      unsubExpenses();
    };
  }, [user]);

  // Auth Functions
  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase no configurado");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Error al iniciar sesión. Verifica tus credenciales.");
      throw error;
    }
  };

  const logout = async () => {
    if (auth) await signOut(auth);
  };

  // Database Actions - Properties
  const addProperty = async (p: Property) => {
    if (!db) return;
    const { id, ...data } = p;
    await addDoc(collection(db, "properties"), data);
  };

  const updateProperty = async (p: Property) => {
    if (!db) return;
    const { id, ...data } = p;
    const ref = doc(db, "properties", id);
    await updateDoc(ref, data as any);
  };

  const deleteProperty = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, "properties", id));
  };

  // Database Actions - Tenants
  const addTenant = async (t: Tenant) => {
    if (!db) return;
    const { id, ...data } = t;
    await addDoc(collection(db, "tenants"), data);
  };

  const updateTenant = async (t: Tenant) => {
    if (!db) return;
    const { id, ...data } = t;
    const ref = doc(db, "tenants", id);
    await updateDoc(ref, data as any);
  };

  const deleteTenant = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, "tenants", id));
  };

  // Database Actions - Expenses
  const addExpense = async (e: Expense) => {
    if (!db) return;
    const { id, ...data } = e;
    await addDoc(collection(db, "expenses"), data);
  };

  const seedDatabase = async () => {
    if (!user || !db) return;
    setLoading(true);
    try {
      const propIds: string[] = [];
      for (const p of mockProperties) {
        const docRef = await addDoc(collection(db, "properties"), p);
        propIds.push(docRef.id);
      }

      if (propIds.length >= 2) {
        await addDoc(collection(db, "tenants"), { ...mockTenants[0], propertyId: propIds[0] });
        await addDoc(collection(db, "tenants"), { ...mockTenants[1], propertyId: propIds[1] });
      }

      if (propIds.length >= 3) {
        await addDoc(collection(db, "expenses"), { ...mockExpenses[0], propertyId: propIds[0] });
        await addDoc(collection(db, "expenses"), { ...mockExpenses[1], propertyId: propIds[0] });
        await addDoc(collection(db, "expenses"), { ...mockExpenses[2], propertyId: propIds[1] });
        await addDoc(collection(db, "expenses"), { ...mockExpenses[3], propertyId: propIds[2] });
      }
      
      alert("Base de datos en la nube cargada con éxito!");
    } catch (e) {
      console.error(e);
      alert("Error al cargar datos. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{
      user, properties, tenants, expenses, loading, isConfigured: configured,
      login, logout,
      addProperty, updateProperty, deleteProperty,
      addTenant, updateTenant, deleteTenant,
      addExpense,
      seedDatabase
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useStore must be used within AppProvider");
  return context;
};