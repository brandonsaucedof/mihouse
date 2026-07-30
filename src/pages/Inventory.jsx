import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Plus, PackageSearch, Search, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Inventory() {
  const { profile } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activos'); // 'activos' o 'archivados'
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (profile?.home_id) {
      fetchInventory();
    }
  }, [profile, activeTab]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const isArchived = activeTab === 'archivados';
      const { data } = await supabase
        .from('inventory_items')
        .select(`
          *,
          category:categories(name)
        `)
        .eq('home_id', profile.home_id)
        .eq('is_archived', isArchived)
        .order('name');
      
      if (data) {
        setItems(data);
        
        // Group by category
        const grouped = data.reduce((acc, item) => {
          const catName = item.category?.name || 'Sin categoría';
          if (!acc[catName]) acc[catName] = [];
          acc[catName].push(item);
          return acc;
        }, {});
        setCategories(grouped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (item, delta) => {
    const newQty = Math.max(0, Number(item.quantity) + delta);
    let newStatus = 'Suficiente';
    if (newQty <= 0) newStatus = 'Agotado';
    else if (newQty <= item.min_quantity) newStatus = 'Poco';

    let isArchived = item.is_archived;
    if (item.type === 'una_vez' && newQty <= 0) {
      isArchived = true;
    }

    // Actualización optimista
    const originalItems = [...items];
    setItems(items.map(i => i.id === item.id ? { ...i, quantity: newQty, status: newStatus, is_archived: isArchived } : i));
    
    // Regrupar optimista
    setCategories(prev => {
      const newCats = { ...prev };
      const catName = item.category?.name || 'Sin categoría';
      if (newCats[catName]) {
        if (isArchived && activeTab === 'activos') {
          newCats[catName] = newCats[catName].filter(i => i.id !== item.id);
        } else {
          newCats[catName] = newCats[catName].map(i => i.id === item.id ? { ...i, quantity: newQty, status: newStatus, is_archived: isArchived } : i);
        }
      }
      return newCats;
    });

    try {
      await supabase
        .from('inventory_items')
        .update({ quantity: newQty, status: newStatus, is_archived: isArchived })
        .eq('id', item.id);

      // Auto agregar a compras
      if (newStatus !== 'Suficiente') {
        const { data: existing } = await supabase
          .from('shopping_items')
          .select('id')
          .eq('home_id', profile.home_id)
          .eq('name', item.name)
          .eq('is_purchased', false)
          .maybeSingle();
        
        if (!existing) {
          await supabase.from('shopping_items').insert([{
            home_id: profile.home_id,
            name: item.name,
            is_purchased: false,
            week: 1
          }]);
        }
      }
    } catch (err) {
      setItems(originalItems); // revert on error
    }
  };

  const deleteItem = async (id) => {
    if (confirm('¿Estás seguro de eliminar este producto del inventario?')) {
      await supabase.from('inventory_items').delete().eq('id', id);
      fetchInventory();
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Suficiente': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Poco': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Agotado': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredCategories = Object.keys(categories).reduce((acc, cat) => {
    const filteredItems = categories[cat].filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase())
    );
    if (filteredItems.length > 0) acc[cat] = filteredItems;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center">
          <PackageSearch className="mr-3 text-teal-500" /> Inventario
        </h1>
        <Link 
          to="/inventory/new" 
          className="flex items-center justify-center w-10 h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-md transition-transform hover:scale-105"
        >
          <Plus />
        </Link>
      </div>

      <div className="flex space-x-2 bg-gray-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('activos')}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
            activeTab === 'activos' ? "bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          )}
        >
          Activos
        </button>
        <button
          onClick={() => setActiveTab('archivados')}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
            activeTab === 'archivados' ? "bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          )}
        >
          Archivados
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar producto..." 
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse mt-6">
          <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
          <div className="h-24 bg-gray-200 dark:bg-slate-800 rounded-xl w-full"></div>
        </div>
      ) : Object.keys(filteredCategories).length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No hay productos aquí.
        </div>
      ) : (
        <div className="space-y-8 mt-6">
          {Object.entries(filteredCategories).map(([catName, catItems]) => (
            <div key={catName}>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 pl-2 border-l-4 border-teal-500">
                {catName}
              </h2>
              <div className="space-y-3">
                {catItems.map(item => (
                  <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{item.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Stock mínimo: {item.min_quantity} {item.unit}
                      </p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-4">
                      <div className="flex items-center space-x-3 bg-gray-50 dark:bg-slate-900 p-1 rounded-xl">
                        <button onClick={() => updateQuantity(item, -1)} className="p-2 text-gray-500 hover:text-rose-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                          <Minus size={16} />
                        </button>
                        <span className="font-bold w-12 text-center dark:text-white">
                          {item.quantity} {item.unit}
                        </span>
                        <button onClick={() => updateQuantity(item, 1)} className="p-2 text-gray-500 hover:text-emerald-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      <button onClick={() => deleteItem(item.id)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
