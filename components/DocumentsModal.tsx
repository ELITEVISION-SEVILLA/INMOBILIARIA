import React, { useState } from 'react';
import { Property, PropertyDoc } from '../types';
import { useStore } from '../context/AppContext';
import { storage } from '../services/firebase'; // Importamos storage
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { X, FileText, Upload, Trash2, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface DocumentsModalProps {
  property: Property;
  onClose: () => void;
}

const DocumentsModal: React.FC<DocumentsModalProps> = ({ property, onClose }) => {
  const { updateProperty } = useStore();
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState<PropertyDoc['type']>('Otro');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Ya no limitamos el tamaño aquí para permitir archivos grandes
      // Firebase Storage maneja gigabytes sin problemas.
      setFileToUpload(file);
      
      // Sugerir nombre si está vacío
      if (!newDocName) {
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
        setNewDocName(nameWithoutExt);
      }
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;

    setIsUploading(true);
    let finalUrl = '';

    try {
      // Opción A: Si Storage está configurado (método ideal para archivos grandes)
      if (storage) {
        const storageRef = ref(storage, `documents/${property.id}/${Date.now()}_${fileToUpload.name}`);
        const snapshot = await uploadBytes(storageRef, fileToUpload);
        finalUrl = await getDownloadURL(snapshot.ref);
      } 
      // Opción B: Fallback a Base64 (Solo si no hay storage, para imágenes pequeñas/legacy)
      // Nota: Esto fallará si el archivo es > 1MB, por lo que Storage es prioritario.
      else {
        if (fileToUpload.size > 1000000) {
          throw new Error("Sin Firebase Storage configurado, el límite es 1MB. Por favor revisa la configuración.");
        }
        
        if (fileToUpload.type.startsWith('image/')) {
          finalUrl = await compressImage(fileToUpload);
        } else {
           // Lectura manual para PDFs pequeños en modo fallback
           finalUrl = await new Promise((resolve, reject) => {
             const reader = new FileReader();
             reader.onloadend = () => resolve(reader.result as string);
             reader.onerror = reject;
             reader.readAsDataURL(fileToUpload);
           });
        }
      }

      const newDoc: PropertyDoc = {
        id: Date.now().toString(),
        name: newDocName,
        type: newDocType,
        date: new Date().toISOString().split('T')[0],
        url: finalUrl
      };

      const updatedProperty = {
        ...property,
        documents: [...(property.documents || []), newDoc]
      };

      await updateProperty(updatedProperty);
      
      // Reset form
      setNewDocName('');
      setNewDocType('Otro');
      setFileToUpload(null);
      const fileInput = document.getElementById('doc-file-input') as HTMLInputElement;
      if(fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error("Error uploading:", error);
      alert(`Error al subir documento: ${error.message || 'Inténtalo de nuevo.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = (docId: string) => {
    if(!confirm("¿Seguro que quieres borrar este documento?")) return;
    
    // Nota: Para una limpieza completa deberíamos borrar también el archivo de Storage,
    // pero mantenemos la referencia simple para no complicar el código base.
    const updatedProperty = {
      ...property,
      documents: property.documents.filter(d => d.id !== docId)
    };
    updateProperty(updatedProperty);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Documentación</h2>
            <p className="text-sm text-slate-500">{property.address}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Add New Document Form */}
          <form onSubmit={handleAddDocument} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
              <Upload size={16} className="mr-2" /> Subir Nuevo Documento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <input 
                  required 
                  type="text" 
                  placeholder="Nombre del documento" 
                  value={newDocName}
                  onChange={e => setNewDocName(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 px-3 py-2 border" 
                />
              </div>
              <div>
                <select 
                  value={newDocType} 
                  onChange={e => setNewDocType(e.target.value as any)}
                  className="w-full text-sm rounded-lg border-slate-300 px-3 py-2 border bg-white"
                >
                  <option value="Escritura">Escritura</option>
                  <option value="Contrato">Contrato</option>
                  <option value="Impuesto">Impuesto</option>
                  <option value="Recibo">Recibo</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-4">
               <div className="flex-1">
                 <input 
                   id="doc-file-input"
                   type="file" 
                   // Aceptamos PDFs e imágenes
                   accept="image/*,application/pdf"
                   onChange={handleFileSelect}
                   className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                 />
                 {fileToUpload && (
                   <div className="mt-1 text-xs text-slate-500 flex items-center">
                      <span className="font-medium truncate max-w-[200px]">{fileToUpload.name}</span>
                      <span className="ml-2 bg-slate-200 px-1 rounded">{(fileToUpload.size / 1024 / 1024).toFixed(2)} MB</span>
                   </div>
                 )}
               </div>
               <button 
                 type="submit" 
                 disabled={!newDocName || isUploading || !fileToUpload}
                 className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap flex items-center"
               >
                 {isUploading ? <><Loader2 size={16} className="animate-spin mr-2"/> Subiendo...</> : 'Guardar'}
               </button>
            </div>
          </form>

          {/* Document List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Archivos Guardados</h3>
            {!property.documents || property.documents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
                No hay documentos subidos aún.
              </div>
            ) : (
              property.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                      <div className="flex items-center text-xs text-slate-500 space-x-2">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{doc.type}</span>
                        <span>• {doc.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {doc.url && (
                      <a 
                        href={doc.url} 
                        download={doc.name}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Abrir/Descargar"
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}
                    <button 
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsModal;