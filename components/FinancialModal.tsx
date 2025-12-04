import React, { useState, useMemo, useRef } from 'react';
import { Property, Expense } from '../types';
import { useStore } from '../context/AppContext';
import { X, Plus, Trash2, Calendar, Camera, Sparkles, Loader2 } from 'lucide-react';
import { analyzeReceiptImage } from '../services/geminiService';
import { compressImage } from '../utils/imageCompressor';

interface FinancialModalProps {
  property: Property;
  onClose: () => void;
}

const FinancialModal: React.FC<FinancialModalProps> = ({ property, onClose }) => {
  const { expenses, addExpense, tenants } = useStore();
  const [activeTab, setActiveTab] = useState<'summary' | 'add'>('summary');
  
  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Reparación');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const propertyExpenses = useMemo(() => 
    expenses.filter(e => e.propertyId === property.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [expenses, property.id]);

  const totalExpenses = propertyExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Calculate revenue
  const propertyRevenue = tenants
    .filter(t => t.propertyId === property.id)
    .reduce((acc, t) => acc + (t.monthlyRent * 12), 0); 

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense: Expense = {
      id: Date.now().toString(),
      propertyId: property.id,
      amount: parseFloat(amount),
      category: category as any,
      description,
      date
    };
    addExpense(newExpense);
    setAmount('');
    setDescription('');
    setActiveTab('summary');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      // Compress first to speed up upload to Gemini and save bandwidth
      const compressedBase64 = await compressImage(file, 1024, 0.8);
      
      const data = await analyzeReceiptImage(compressedBase64);
      
      if (data.amount) setAmount(data.amount.toString());
      if (data.description) setDescription(data.description);
      if (data.date) setDate(data.date);
      if (data.category) setCategory(data.category);
      
      alert("¡Datos extraídos con éxito! Por favor verifica que sean correctos.");
    } catch (err) {
      console.error(err);
      alert("No se pudo leer la factura. Por favor introduce los datos manualmente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Control Financiero</h2>
            <p className="text-sm text-slate-500">{property.address}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Resumen & Historial
          </button>
          <button 
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'add' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Registrar Gasto
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'summary' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <p className="text-xs text-green-600 font-semibold uppercase">Ingresos Anuales (Est.)</p>
                  <p className="text-2xl font-bold text-green-700">{propertyRevenue}€</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-xs text-red-600 font-semibold uppercase">Gastos Totales</p>
                  <p className="text-2xl font-bold text-red-700">{totalExpenses}€</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Historial de Gastos</h3>
                {propertyExpenses.length === 0 ? (
                   <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">No hay gastos registrados.</div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Concepto</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cat.</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {propertyExpenses.map(exp => (
                          <tr key={exp.id}>
                            <td className="px-4 py-2 text-sm text-slate-600">{exp.date}</td>
                            <td className="px-4 py-2 text-sm text-slate-900 font-medium">{exp.description}</td>
                            <td className="px-4 py-2 text-sm text-slate-500">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                {exp.category}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-red-600 font-medium">-{exp.amount}€</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto py-4">
              
              {/* AI Scanner Button */}
              <div className="mb-6">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 disabled:opacity-70"
                >
                  {isAnalyzing ? (
                    <><Loader2 className="animate-spin mr-2" /> Analizando Recibo...</>
                  ) : (
                    <><Camera className="mr-2" /> Escanear Factura con IA <Sparkles size={16} className="ml-2 text-yellow-300" /></>
                  )}
                </button>
                <p className="text-center text-xs text-slate-500 mt-2">
                  Sube una foto y la IA rellenará los campos automáticamente.
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">O introduce manualmente</span>
                </div>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <input required type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border" placeholder="Ej: Reparación caldera" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Monto (€)</label>
                    <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                    <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border">
                    <option>Reparación</option>
                    <option>Comunidad</option>
                    <option>Seguro</option>
                    <option>Impuestos</option>
                    <option>Otros</option>
                  </select>
                </div>
                <button type="submit" className="w-full flex items-center justify-center py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                  <Plus size={18} className="mr-2" />
                  Guardar Gasto
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialModal;