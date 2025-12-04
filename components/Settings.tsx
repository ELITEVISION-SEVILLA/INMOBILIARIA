import React, { useState } from 'react';
import { useStore } from '../context/AppContext';
import { Database, CloudUpload, CheckCircle, Loader2, Save, AlertTriangle } from 'lucide-react';
import { saveConfig, resetConfig } from '../services/firebase';

const Settings: React.FC = () => {
  const { seedDatabase, isConfigured } = useStore();
  const [loading, setLoading] = useState(false);
  const [configJson, setConfigJson] = useState('');
  const [configError, setConfigError] = useState('');

  const handleSeed = async () => {
    if(window.confirm('¿Quieres cargar datos de ejemplo en tu base de datos de Firebase? Esto creará documentos nuevos.')) {
      setLoading(true);
      await seedDatabase();
      setLoading(false);
    }
  };

  const handleSaveConfig = () => {
    setConfigError('');
    if (!saveConfig(configJson)) {
      setConfigError('No se pudo procesar el código. Asegúrate de copiar todo el objeto { ... } o la línea const firebaseConfig = ...');
      return;
    }
    // Reload to apply
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>

      {/* Connection Status Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center mb-4">
          <Database className="text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold text-slate-800">Conexión a la Nube (Firebase)</h2>
        </div>

        {isConfigured ? (
          <div>
            <div className="flex items-center p-3 bg-green-50 text-green-700 rounded-lg mb-6 border border-green-100">
              <CheckCircle size={20} className="mr-2" />
              <span className="text-sm font-medium">Aplicación conectada correctamente a Firebase</span>
            </div>
            
            <p className="text-slate-600 mb-4 text-sm">
              Si necesitas cambiar de proyecto o corregir la configuración, pulsa el botón rojo.
            </p>
            <button 
              onClick={() => { if(confirm('¿Desconectar la base de datos actual?')) resetConfig(); }}
              className="text-red-600 hover:text-red-800 text-sm font-medium underline"
            >
              Desvincular Configuración Actual
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-start p-3 bg-amber-50 text-amber-800 rounded-lg mb-6 border border-amber-100">
              <AlertTriangle size={20} className="mr-2 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold mb-1">Configuración requerida</p>
                <p>Ve a Firebase Console &gt; Project Settings &gt; General &gt; SDK setup and configuration.</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Copia y pega el código de configuración de Firebase (<code>const firebaseConfig = ...</code> o solo el objeto <code>{'{...}'}</code>):
              </label>
              <textarea 
                rows={8}
                value={configJson}
                onChange={e => setConfigJson(e.target.value)}
                placeholder={'const firebaseConfig = {\n  apiKey: "...",\n  authDomain: "...",\n  ...\n};'}
                className="w-full font-mono text-xs border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {configError && <p className="text-red-600 text-sm font-medium">{configError}</p>}
              
              <button 
                onClick={handleSaveConfig}
                disabled={!configJson}
                className="flex items-center justify-center w-full px-4 py-2.5 bg-blue-600 text-white shadow-sm text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración y Conectar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Database Seeding Section (Only if configured) */}
      {isConfigured && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center mb-4">
            <CloudUpload className="text-slate-500 mr-2" />
            <h2 className="text-lg font-semibold text-slate-800">Datos de Prueba</h2>
          </div>
          
          <p className="text-sm text-slate-500 mb-4">
            Si acabas de crear tu proyecto en Firebase, la base de datos estará vacía. 
            Pulsa este botón para crear inmuebles e inquilinos de ejemplo automáticamente.
          </p>
          
          <button 
            onClick={handleSeed}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-slate-900 text-white shadow-sm text-sm font-medium rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudUpload className="mr-2 h-4 w-4" />}
            Cargar Datos de Ejemplo
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;