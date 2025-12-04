import React, { useState } from 'react';
import { useStore } from '../context/AppContext';
import { Tenant } from '../types';
import { Plus, Edit, Trash2, Mail, Bot, Sparkles, X, Loader2, UserPlus, Save } from 'lucide-react';
import { generateEmailDraft } from '../services/geminiService';

const Tenants: React.FC = () => {
  const { tenants, properties, addTenant, updateTenant, deleteTenant } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  
  // AI Modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedTenantForAi, setSelectedTenantForAi] = useState<Tenant | null>(null);
  const [aiTopic, setAiTopic] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const initialFormState: Omit<Tenant, 'id' | 'documents'> = {
    name: '',
    dni: '',
    email: '',
    phone: '',
    contractStart: '',
    contractEnd: '',
    monthlyRent: 0,
    cpiAdjustmentMonth: 1,
    propertyId: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const handleSave = (e: React.FormEvent, closeAfterSave: boolean) => {
    e.preventDefault();
    
    if (editingTenant) {
      updateTenant({ ...editingTenant, ...formData });
      closeModal();
    } else {
      addTenant({ id: Date.now().toString(), ...formData, documents: [] });
      
      if (closeAfterSave) {
        closeModal();
      } else {
        // Workflow para compañeros de piso:
        // Guardamos, pero mantenemos los datos del contrato (Inmueble, Fechas, Renta)
        // Solo limpiamos los datos personales para meter al siguiente inquilino rápidamente.
        setFormData(prev => ({
          ...prev,
          name: '',
          dni: '',
          email: '',
          phone: ''
          // Mantenemos propertyId, monthlyRent, contractStart, contractEnd
        }));
        
        // Pequeño feedback visual o alert opcional
        // (En una app real usaríamos un Toast, aquí un simple log o nada es suficiente si el form se vacía)
        const formStart = document.getElementById('tenant-form-top');
        if(formStart) formStart.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTenant(null);
    setFormData(initialFormState);
  };

  const openAiAssistant = (t: Tenant) => {
    setSelectedTenantForAi(t);
    setAiTopic('');
    setAiContext('');
    setAiResult('');
    setAiModalOpen(true);
  };

  const handleGenerateAi = async () => {
    if (!selectedTenantForAi) return;
    setAiLoading(true);
    const draft = await generateEmailDraft(selectedTenantForAi.name, aiTopic, aiContext);
    setAiResult(draft);
    setAiLoading(false);
  };

  const getPropertyName = (id: string | null) => {
    const p = properties.find(prop => prop.id === id);
    return p ? p.address : 'Sin asignar';
  };

  return (
    <div>
       <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Inquilinos</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition shadow-sm">
          <Plus size={20} className="mr-2" />
          Añadir Inquilino
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Inquilino</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Propiedad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Renta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contrato</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {tenants.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-900">{t.name}</div>
                      <div className="text-sm text-slate-500">{t.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {getPropertyName(t.propertyId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {t.monthlyRent}€/mes
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {t.contractEnd}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                   <button onClick={() => openAiAssistant(t)} className="text-purple-600 hover:text-purple-900 inline-flex items-center" title="Asistente IA">
                    <Sparkles size={18} className="mr-1" />
                  </button>
                  <button onClick={() => { setEditingTenant(t); setFormData(t); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-900">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => deleteTenant(t.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div id="tenant-form-top" className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{editingTenant ? 'Editar Inquilino' : 'Nuevo Inquilino'}</h2>
              <button onClick={closeModal}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            {/* Usamos un div en lugar de form para controlar los botones manualmente */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                   <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Ej: Ana López" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">DNI/NIE</label>
                   <input required type="text" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                   <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                   <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center">
                  <UserPlus size={16} className="mr-2" /> Datos del Contrato
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Propiedad</label>
                    <select required value={formData.propertyId || ''} onChange={e => setFormData({...formData, propertyId: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white">
                      <option value="">Seleccionar...</option>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Renta Mensual (€)</label>
                    <input required type="number" value={formData.monthlyRent} onChange={e => setFormData({...formData, monthlyRent: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Inicio Contrato</label>
                    <input required type="date" value={formData.contractStart} onChange={e => setFormData({...formData, contractStart: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fin Contrato</label>
                    <input required type="date" value={formData.contractEnd} onChange={e => setFormData({...formData, contractEnd: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={(e) => handleSave(e, true)} 
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex justify-center items-center"
                >
                  <Save size={18} className="mr-2" /> Guardar
                </button>
                
                {!editingTenant && (
                  <button 
                    onClick={(e) => handleSave(e, false)} 
                    className="flex-1 bg-white border border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition flex justify-center items-center"
                    title="Guarda este inquilino y limpia solo el nombre para añadir a su compañero de piso"
                  >
                    <UserPlus size={18} className="mr-2" /> Guardar y añadir otro
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl flex justify-between items-center text-white">
               <div className="flex items-center space-x-2">
                 <Bot size={24} />
                 <h2 className="text-xl font-bold">Asistente Mágico AI</h2>
               </div>
               <button onClick={() => setAiModalOpen(false)} className="text-white/80 hover:text-white"><X /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <p className="text-sm text-slate-600">
                La IA redactará un correo formal para <strong>{selectedTenantForAi?.name}</strong>.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tema del Correo</label>
                <input 
                  type="text" 
                  placeholder="Ej: Reclamación de impago, Revisión de IPC..." 
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Detalles Adicionales (Contexto)</label>
                <textarea 
                  rows={3}
                  placeholder="Ej: El mes de Octubre sigue pendiente. Si no paga en 3 días iniciaremos acciones legales."
                  value={aiContext}
                  onChange={e => setAiContext(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <button 
                onClick={handleGenerateAi} 
                disabled={aiLoading || !aiTopic}
                className="w-full py-2 bg-slate-900 text-white rounded-lg flex items-center justify-center space-x-2 hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {aiLoading ? <><Loader2 className="animate-spin" /> <span>Pensando...</span></> : <><Sparkles size={16} /> <span>Generar Borrador</span></>}
              </button>

              {aiResult && (
                <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Borrador Generado:</label>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm whitespace-pre-wrap font-mono text-slate-800">
                    {aiResult}
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button onClick={() => navigator.clipboard.writeText(aiResult)} className="text-xs text-blue-600 font-medium hover:underline">
                      Copiar al portapapeles
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;