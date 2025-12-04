export interface PropertyDoc {
  id: string;
  name: string;
  type: 'Escritura' | 'Contrato' | 'Recibo' | 'Impuesto' | 'Otro';
  date: string;
  url?: string; // Base64 for demo purposes
}

export interface Property {
  id: string;
  address: string;
  city: string;
  type: 'Piso' | 'Casa' | 'Local' | 'Garaje';
  status: 'Alquilado' | 'Vacío';
  purchasePrice: number;
  image: string; // Base64 or URL
  documents: PropertyDoc[];
}

export interface Tenant {
  id: string;
  name: string;
  dni: string;
  email: string;
  phone: string;
  contractStart: string;
  contractEnd: string;
  monthlyRent: number;
  cpiAdjustmentMonth: number; // 1-12
  propertyId: string | null;
}

export interface Expense {
  id: string;
  propertyId: string;
  amount: number;
  category: 'Reparación' | 'Comunidad' | 'Seguro' | 'Impuestos' | 'Otros';
  date: string;
  description: string;
}

export interface User {
  uid: string;
  email: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  occupancyRate: number;
}