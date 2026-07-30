import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { PackageSearch, ShoppingCart, PieChart, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Dashboard() {
  const { profile } = useAuth();
  const [homeName, setHomeName] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [stats, setStats] = useState({
    totalSpent: 0,
    itemsToBuy: 0,
    itemsInInventory: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.home_id) {
      fetchDashboardData();
    }
  }, [profile, currentMonth]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Get Home Name
      const { data: home } = await supabase
        .from('homes')
        .select('name')
        .eq('id', profile.home_id)
        .single();
      
      if (home) setHomeName(home.name);

      // 2. Get active inventory count
      const { count: inventoryCount } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true })
        .eq('home_id', profile.home_id)
        .eq('is_archived', false);

      // 3. Get shopping items to buy
      const { count: shoppingCount } = await supabase
        .from('shopping_items')
        .select('*', { count: 'exact', head: true })
        .eq('home_id', profile.home_id)
        .eq('is_purchased', false);

      // 4. Get total spent for current month
      const startOfMonth = new Date(new Date().getFullYear(), currentMonth, 1).toISOString();
      const endOfMonth = new Date(new Date().getFullYear(), currentMonth + 1, 0, 23, 59, 59).toISOString();
      
      const { data: purchases } = await supabase
        .from('purchases')
        .select('total_amount')
        .eq('home_id', profile.home_id)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

      const totalSpent = purchases?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

      setStats({
        totalSpent,
        itemsToBuy: shoppingCount || 0,
        itemsInInventory: inventoryCount || 0
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => (prev === 0 ? 11 : prev - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => (prev === 11 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          ¡Hola, {profile?.full_name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center space-x-2">
          <span>{homeName}</span>
          <Link to="/family" className="text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center">
            <Users size={14} className="ml-2 mr-1" /> Familia
          </Link>
        </p>
      </header>

      {/* Selector de Mes */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
          <ChevronLeft className="text-gray-600 dark:text-gray-300" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[120px] text-center">
          {months[currentMonth]}
        </h2>
        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
          <ChevronRight className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Resumen de Gastos */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-6 rounded-3xl shadow-lg text-white">
        <h3 className="text-teal-100 font-medium mb-2">Total gastado en {months[currentMonth]}</h3>
        {loading ? (
          <div className="h-12 w-32 bg-teal-400/50 animate-pulse rounded-lg"></div>
        ) : (
          <p className="text-5xl font-bold tracking-tight">
            ${stats.totalSpent.toLocaleString('es-CL')}
          </p>
        )}
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/shopping" className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <ShoppingCart size={24} />
            </div>
          </div>
          <div>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 dark:bg-slate-700 animate-pulse rounded mb-1"></div>
            ) : (
              <h4 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.itemsToBuy}
              </h4>
            )}
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Por comprar</p>
          </div>
        </Link>

        <Link to="/inventory" className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <PackageSearch size={24} />
            </div>
          </div>
          <div>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 dark:bg-slate-700 animate-pulse rounded mb-1"></div>
            ) : (
              <h4 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.itemsInInventory}
              </h4>
            )}
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En inventario</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
