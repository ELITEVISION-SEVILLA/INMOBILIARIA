import React, { useMemo } from 'react';
import { useStore } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Users, AlertCircle, Calendar } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { properties, tenants, expenses } = useStore();

  const stats = useMemo(() => {
    // Current Month calculations
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyIncome = tenants.reduce((acc, t) => {
      // Logic: Only count if contract is active. Simplified for demo.
      return acc + t.monthlyRent;
    }, 0);

    const monthlyExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((acc, e) => acc + e.amount, 0);

    const netProfit = monthlyIncome - monthlyExpenses;
    
    const rentedProps = properties.filter(p => p.status === 'Alquilado').length;
    const occupancyRate = properties.length > 0 ? (rentedProps / properties.length) * 100 : 0;

    return { monthlyIncome, monthlyExpenses, netProfit, occupancyRate };
  }, [properties, tenants, expenses]);

  const chartData = useMemo(() => {
    return tenants.map(t => ({
      name: t.name.split(' ')[0],
      rent: t.monthlyRent
    }));
  }, [tenants]);

  const alerts = useMemo(() => {
    const list = [];
    const now = new Date();
    
    tenants.forEach(t => {
      // Contract Expiry Alert (< 60 days)
      const endDate = new Date(t.contractEnd);
      const diffTime = Math.abs(endDate.getTime() - now.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays < 60 && endDate > now) {
        list.push({ type: 'expire', text: `Contrato de ${t.name} vence en ${diffDays} días`, priority: 'high' });
      }

      // CPI Adjustment Alert
      if ((now.getMonth() + 1) === t.cpiAdjustmentMonth) {
        list.push({ type: 'cpi', text: `Revisión IPC para ${t.name} este mes`, priority: 'medium' });
      }
    });
    return list;
  }, [tenants]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Panel Principal</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ingresos Mensuales" 
          value={`${stats.monthlyIncome}€`} 
          icon={TrendingUp} 
          color="text-green-600" 
          bg="bg-green-50"
        />
        <StatCard 
          title="Gastos Mensuales" 
          value={`${stats.monthlyExpenses}€`} 
          icon={TrendingDown} 
          color="text-red-600" 
          bg="bg-red-50"
        />
        <StatCard 
          title="Beneficio Neto" 
          value={`${stats.netProfit}€`} 
          icon={Wallet} 
          color="text-blue-600" 
          bg="bg-blue-50"
        />
        <StatCard 
          title="Ocupación" 
          value={`${stats.occupancyRate.toFixed(0)}%`} 
          icon={Users} 
          color="text-purple-600" 
          bg="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Ingresos por Inquilino</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="rent" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Alertas</h2>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{alerts.length}</span>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-slate-400 text-sm">No hay alertas pendientes.</p>
            ) : (
              alerts.map((alert, idx) => (
                <div key={idx} className={`p-3 rounded-lg flex items-start space-x-3 ${alert.priority === 'high' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                  {alert.type === 'expire' ? <AlertCircle size={18} className="text-red-500 mt-0.5" /> : <Calendar size={18} className="text-amber-500 mt-0.5" />}
                  <div>
                    <p className={`text-sm font-medium ${alert.priority === 'high' ? 'text-red-800' : 'text-amber-800'}`}>{alert.text}</p>
                    <p className="text-xs text-slate-500 mt-1">Acción requerida</p>
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

const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${bg}`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  </div>
);

export default Dashboard;
