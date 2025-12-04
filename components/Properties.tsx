import React, { useState } from 'react';
import { useStore } from '../context/AppContext';
import { Property } from '../types';
import { Plus, MapPin, Euro, Trash2, Edit, X, Home, Building, Car, FileText, Loader2 } from 'lucide-react';
import FinancialModal from './FinancialModal';
import DocumentsModal from './DocumentsModal';
import { compressImage } from '../utils/imageCompressor';

const Properties: React.FC = () => {
  const { properties, addProperty, deleteProperty, updateProperty } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Modals for specific features
  const [selectedFinancialProp, setSelectedFinancialProp] = useState<Property | null>(null);
  const [selectedDocsProp, setSelectedDocsProp] = useState<Property | null>(null);

  const initialFormState: Omit<Property, 'id' | 'documents'> = {
    address: '',
    city: '',
    type: 'Piso',
    status: 'Vacío',
    purchasePrice: 0,
    image: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleEdit = (p: Property) => {
    setEditingProp(p);
    setFormData({
      address: p.address,
      city: p.city,
      type: p.type,
      status: p.status,
      purchasePrice: p.purchasePrice,
      image: p.image,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProp) {
      updateProperty({ ...editingProp, ...formData });
    } else {
      addProperty({
        id: Date.now().toString(),
        ...formData,
        documents: [], // Initialize empty
        image: formData.image || `https://picsum.photos/400/300?random=${Date.now()}`
      });
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProp(null);
    setFormData(initialFormState);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file);
        setFormData(prev => ({ ...prev, image: compressed }));
      } catch (error) {
        console.error("Error compressing image", error);
        alert("Error al procesar la imagen");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Piso': return <Building size={18} />;
      case 'Casa': return <Home size={18} />;
      case 'Garaje': return <Car size={18} />;
      default: return <Building size={18} />;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Mis Inmuebles</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={20} className="mr-2" />
          Nuevo Inmueble
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow">
            <div className="h-48 overflow-hidden relative">
              <img src={p.image} alt={p.address} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 right-3">
                 <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-sm ${p.status === 'Alquilado' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                   {p.status}
                 </span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{p.address}</h3>
                   <p className="text-sm text-slate-500 flex items-center">
                     <MapPin size={14} className="mr-1" /> {p.city}
                   </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                  {getIcon(p.type)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                 <button onClick={() => setSelectedFinancialProp(p)} className="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                   <Euro size={16} className="mr-1.5" /> Gastos
                 </button>
                 <button onClick={() => setSelectedDocsProp(p)} className="flex items-center justify-center px-3 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
                   <FileText size={16} className="mr-1.5" /> Docs
                 </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end items-center space-x-2">
                  <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-blue-500 rounded-full transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deleteProperty(p.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-full transition-colors">
                    <Trash2 size={16} />
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{editingProp ? 'Editar Inmueble' : 'Nuevo Inmueble'}</h2>
              <button onClick={closeModal}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
                   <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                   <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full border rounded-lg px-3 py-2 bg-white">
                     <option>Piso</option>
                     <option>Casa</option>
                     <option>Local</option>
                     <option>Garaje</option>
                   </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Precio Compra</label>
                   <input required type="number" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                   <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full border rounded-lg px-3 py-2 bg-white">
                     <option>Alquilado</option>
                     <option>Vacío</option>
                   </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Imagen</label>
                <div className="flex items-center space-x-2">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                  {isCompressing && <Loader2 size={18} className="animate-spin text-blue-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-1">La imagen se optimizará automáticamente.</p>
              </div>
              <button 
                type="submit" 
                disabled={isCompressing}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-70"
              >
                {isCompressing ? 'Optimizando...' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedFinancialProp && (
        <FinancialModal property={selectedFinancialProp} onClose={() => setSelectedFinancialProp(null)} />
      )}

      {selectedDocsProp && (
        <DocumentsModal property={selectedDocsProp} onClose={() => setSelectedDocsProp(null)} />
      )}
    </div>
  );
};

export default Properties;