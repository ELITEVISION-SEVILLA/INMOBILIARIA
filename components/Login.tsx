import React, { useState } from 'react';
import { useStore } from '../context/AppContext';
import { Building2, Loader2, ArrowRight, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const Login: React.FC = () => {
  const { login, isConfigured } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    
    try {
      await login(email, password);
      // Success is handled by AppContext redirect via ProtectedRoute
    } catch (err: any) {
      console.error(err);
      setError('Error de autenticación. Verifica que el usuario exista en Firebase Authentication.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block w-1/2 relative bg-slate-900">
        <img 
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
          alt="Building" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        <div className="absolute bottom-10 left-10 text-white p-6">
          <h1 className="text-4xl font-bold mb-2">INMOBILIARIA BARRIO</h1>
          <p className="text-lg text-slate-300">Gestión inteligente para propietarios modernos.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start">
               <div className="bg-blue-600 p-2 rounded-lg text-white mb-4 inline-block">
                 <Building2 size={32} />
               </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido de nuevo</h2>
            <p className="mt-2 text-sm text-slate-500">Accede a tu panel de control en la nube</p>
          </div>

          {!isConfigured ? (
             <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-center">
               <h3 className="text-amber-800 font-bold text-lg mb-2">Configuración Necesaria</h3>
               <p className="text-amber-700 text-sm mb-4">
                 Para empezar a usar la aplicación, necesitas conectarla a tu base de datos de Firebase.
               </p>
               <Link 
                 to="/settings" 
                 className="inline-flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
               >
                 <Settings size={18} className="mr-2" />
                 Configurar Base de Datos
               </Link>
             </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoggingIn}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all transform active:scale-[0.98]"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" /> : <span className="flex items-center">Entrar <ArrowRight className="ml-2 w-4 h-4" /></span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;