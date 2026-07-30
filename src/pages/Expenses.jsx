import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { TrendingDown, Calendar, Store, ArrowUpRight } from 'lucide-react';

export default function Expenses() {
  const { profile } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalMonth, setTotalMonth] = useState(0);

  useEffect(() => {
    if (profile?.home_id) {
      fetchExpenses();
    }
  }, [profile]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('purchases')
        .select('*')
        .eq('home_id', profile.home_id)
        .order('created_at', { ascending: false });

      if (data) {
        setPurchases(data);
        
        // Calculate this month's total
        const thisMonth = data.filter(p => new Date(p.created_at) >= startOfMonth);
        const total = thisMonth.reduce((sum, p) => sum + Number(p.total_amount), 0);
        setTotalMonth(total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center">
          <TrendingDown className="mr-3 text-purple-500" /> Gastos
        </h1>
      </div>

      {/* Tarjeta de Resumen */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <TrendingDown size={100} />
        </div>
        <h2 className="text-purple-100 font-medium mb-1 relative z-10">Total gastado este mes</h2>
        <div className="text-4xl font-extrabold relative z-10 flex items-baseline space-x-1">
          <span>$</span>
          <span>{totalMonth.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="mt-4 flex items-center text-sm font-medium bg-white/20 w-fit px-3 py-1 rounded-full relative z-10 backdrop-blur-sm">
          <Calendar size={14} className="mr-2" />
          {new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Historial de Compras</h3>
        
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-slate-800 rounded-2xl w-full"></div>
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700">
            No has registrado ninguna compra todavía.
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map(purchase => (
              <div key={purchase.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Store size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">{purchase.store_name}</h4>
                    <p className="text-sm text-gray-500">{formatDate(purchase.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-gray-900 dark:text-white text-lg">
                    ${Number(purchase.total_amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs font-medium text-rose-500 flex items-center justify-end">
                    Gasto <ArrowUpRight size={12} className="ml-1" />
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
