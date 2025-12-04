import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Clave para guardar en el navegador (por si quieres sobreescribirla en el futuro)
const STORAGE_KEY = 'barrio_firebase_config';

// --- CONFIGURACIÓN PROPORCIONADA ---
// Se usa esta configuración por defecto para que funcione inmediatamente.
const DEFAULT_CONFIG = {
  apiKey: "AIzaSyCP3DZ-H0DtUwfRfTnboD2mmKdxLCgT2Vc",
  authDomain: "gestorinmo-app.firebaseapp.com",
  projectId: "gestorinmo-app",
  storageBucket: "gestorinmo-app.firebasestorage.app",
  messagingSenderId: "211235664828",
  appId: "1:211235664828:web:7c673acba67feab91f31b9"
};

let app;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Inicialización de Firebase
const loadFirebase = () => {
  let configToUse = DEFAULT_CONFIG;
  
  // Si en el futuro guardas otra configuración manualmente, tendrá prioridad
  const savedConfig = localStorage.getItem(STORAGE_KEY);
  if (savedConfig) {
    try {
      configToUse = JSON.parse(savedConfig);
    } catch (e) {
      console.error("Configuración guardada corrupta, usando por defecto");
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  try {
    // Evitar inicializar dos veces
    if (!getApps().length) {
      app = initializeApp(configToUse);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase conectado exitosamente a:", configToUse.projectId);
  } catch (e) {
    console.error("Error al iniciar Firebase:", e);
  }
};

// Ejecutar carga inicial
loadFirebase();

export { db, auth };

// Helpers
export const isConfigured = () => !!db && !!auth;

export const saveConfig = (configStr: string) => {
  try {
    let cleanStr = configStr.trim();
    if (cleanStr.includes('=')) {
      const parts = cleanStr.split('=');
      cleanStr = parts.slice(1).join('=');
    }
    cleanStr = cleanStr.replace(/;$/, '').trim();
    const jsonLike = cleanStr
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') 
      .replace(/'/g, '"');
    const finalStr = jsonLike.replace(/,(\s*[}\]])/g, '$1');

    JSON.parse(finalStr); // Validar
    localStorage.setItem(STORAGE_KEY, finalStr);
    return true;
  } catch (e) {
    console.error("Error al procesar la configuración:", e);
    return false;
  }
};

export const resetConfig = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};


// --- DATOS DE EJEMPLO (Mocks) ---
export const mockProperties = [
  {
    address: 'Calle Mayor 12, 3A',
    city: 'Madrid',
    type: 'Piso',
    status: 'Alquilado',
    purchasePrice: 250000,
    image: 'https://picsum.photos/400/300?random=1',
    documents: [
      { id: '1', name: 'Escritura Compraventa', type: 'Escritura', date: '2020-01-15' },
      { id: '2', name: 'Nota Simple', type: 'Otro', date: '2023-05-10' }
    ]
  },
  {
    address: 'Av. Diagonal 405',
    city: 'Barcelona',
    type: 'Local',
    status: 'Vacío',
    purchasePrice: 180000,
    image: 'https://picsum.photos/400/300?random=2',
    documents: [
      { id: '3', name: 'Licencia Actividad', type: 'Impuesto', date: '2021-03-20' }
    ]
  },
  {
    address: 'Plaza del Mercado 22',
    city: 'Valencia',
    type: 'Garaje',
    status: 'Alquilado',
    purchasePrice: 25000,
    image: 'https://picsum.photos/400/300?random=4',
    documents: []
  }
];

export const mockTenants = [
  {
    name: 'Juan Pérez',
    dni: '12345678A',
    email: 'juan.perez@email.com',
    phone: '600123456',
    contractStart: '2023-01-15',
    contractEnd: '2028-01-15',
    monthlyRent: 1200,
    cpiAdjustmentMonth: 1,
  },
  {
    name: 'María García',
    dni: '87654321B',
    email: 'maria.g@email.com',
    phone: '611223344',
    contractStart: '2023-06-01',
    contractEnd: '2024-06-01',
    monthlyRent: 850,
    cpiAdjustmentMonth: 6,
  }
];

export const mockExpenses = [
  { amount: 50, category: 'Comunidad', date: '2024-05-01', description: 'Mensualidad Mayo' },
  { amount: 150, category: 'Reparación', date: '2024-05-10', description: 'Arreglo grifo baño' },
  { amount: 80, category: 'Comunidad', date: '2024-05-01', description: 'Mensualidad Mayo' },
  { amount: 40, category: 'Seguro', date: '2024-01-01', description: 'Seguro anual (parte proporcional)' },
];