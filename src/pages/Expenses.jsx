import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { TrendingDown, Calendar, Store, ChevronDown, ChevronUp, PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Expenses() {
  const { profile } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalMonth, setTotalMonth] = useState(0);

  // Estado para los acordeones (semanas y eventos expandidos)
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    if (profile?.home_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Fetch events for names
      const { data: eventsData } = await supabase
        .from('shopping_events')
        .select('id, name')
        .eq('home_id', profile.home_id);
      
      const eventsMap = {};
      if (eventsData) {
        eventsData.forEach(e => eventsMap[e.id] = e.name);
      }
      setEvents(eventsMap);

      // Fetch purchases
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

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Agrupar compras
  const groupPurchases = () => {
    const groups = {
      weeks: { 1: [], 2: [], 3: [], 4: [] },
      events: {}
    };

    purchases.forEach(p => {
      if (p.event_id) {
        if (!groups.events[p.event_id]) groups.events[p.event_id] = [];
        groups.events[p.event_id].push(p);
      } else if (p.week) {
        if (!groups.weeks[p.week]) groups.weeks[p.week] = [];
        groups.weeks[p.week].push(p);
      } else {
        // En caso de que no tenga semana ni evento (compras antiguas)
        groups.weeks[1].push(p);
      }
    });

    return groups;
  };

  const grouped = groupPurchases();

  const getPurchaseTitle = (purchase) => {
    if (purchase.items_summary && purchase.items_summary.length > 0) {
      const names = purchase.items_summary.map(i => i.name).join(', ');
      return names.length > 40 ? names.substring(0, 40) + '...' : names;
    }
    return purchase.store_name || 'Varios';
  };

  const renderPurchaseList = (list) => {
    if (!list || list.length === 0) return null;
    
    return (
      <div className="space-y-4 mt-4 px-2">
        {list.map(purchase => (
          <div key={purchase.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3 overflow-hidden pr-3">
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <PackageOpen size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white truncate">{getPurchaseTitle(purchase)}</h4>
                  <p className="text-xs text-gray-500">{formatDate(purchase.created_at)}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-extrabold text-gray-900 dark:text-white">
                  Bs {Number(purchase.total_amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Items summary (burbujas pequeñas si hay detalles extras como cantidades) */}
            {purchase.items_summary && purchase.items_summary.some(i => i.quantity) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {purchase.items_summary.filter(i => i.quantity).map((item, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                    {item.name} ({item.quantity})
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSection = (id, title, colorClass, list) => {
    if (!list || list.length === 0) return null;
    
    const isExpanded = expandedSections[id];
    const totalGroup = list.reduce((sum, p) => sum + Number(p.total_amount), 0);

    return (
      <div key={id} className="mb-4">
        <button 
          onClick={() => toggleSection(id)}
          className="w-full bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50 focus:outline-none"
        >
          <div className="flex items-center">
            <span className={cn("w-3 h-10 rounded-full mr-4", colorClass)}></span>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bs {totalGroup.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 dark:text-gray-300">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {isExpanded && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-200">
            {renderPurchaseList(list)}
          </div>
        )}
      </div>
    );
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
          <span>Bs</span>
          <span>{totalMonth.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="mt-4 flex items-center text-sm font-medium bg-white/20 w-fit px-3 py-1 rounded-full relative z-10 backdrop-blur-sm">
          <Calendar size={14} className="mr-2" />
          {new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-slate-800 rounded-2xl w-full"></div>
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700">
            No has registrado ninguna compra todavía.
          </div>
        ) : (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(w => 
              renderSection(`week-${w}`, `Semana ${w}`, 'bg-purple-500', grouped.weeks[w])
            )}

            {Object.entries(grouped.events).map(([eventId, eventPurchases]) => 
              renderSection(`event-${eventId}`, `Evento: ${events[eventId] || 'Eliminado'}`, 'bg-rose-500', eventPurchases)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
