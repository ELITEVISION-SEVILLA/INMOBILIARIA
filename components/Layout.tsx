import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Wallet, LogOut, Menu, X, Settings } from 'lucide-react';
import { useStore } from '../context/AppContext';

const Layout: React.FC = () => {
  const { logout, user } = useStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/properties', icon: Building2, label: 'Inmuebles' },
    { to: '/tenants', icon: Users, label: 'Inquilinos' },
    { to: '/settings', icon: Settings, label: 'Configuración' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
            <div className="flex items-center space-x-2">
              <Building2 className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold tracking-wider">BARRIO</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="px-6 py-4">
             <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu Principal</div>
             <nav className="space-y-1">
               {navItems.map((item) => (
                 <NavLink
                   key={item.to}
                   to={item.to}
                   onClick={() => setSidebarOpen(false)}
                   className={({ isActive }) => `
                     flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                     ${isActive 
                       ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                       : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                   `}
                 >
                   <item.icon className="w-5 h-5 mr-3" />
                   {item.label}
                 </NavLink>
               ))}
             </nav>
          </div>

          <div className="mt-auto p-4 border-t border-slate-800">
            <div className="flex items-center mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                {user?.email[0].toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white truncate w-32">{user?.email}</p>
                <p className="text-xs text-slate-400">Propietario</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-slate-700">
            <Menu size={24} />
          </button>
          <span className="font-semibold text-slate-700">Inmobiliaria Barrio</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
