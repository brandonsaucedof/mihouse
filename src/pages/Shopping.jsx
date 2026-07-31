import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Plus, Check, Trash2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Shopping() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // '1', '2', '3', '4' para semanas. UUID para eventos.
  const [activeTab, setActiveTab] = useState('1'); 
  
  const [newItem, setNewItem] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newCategory, setNewCategory] = useState('');
  
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEventName, setNewEventName] = useState('');

  const location = useLocation();

  useEffect(() => {
    if (profile?.home_id) {
      fetchEvents();
      fetchCategories();
      fetchShoppingList();
    }
  }, [profile, activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const addName = params.get('add');
    const addCat = params.get('cat');
    if (addName) {
      setNewItem(addName);
      if (addCat) setNewCategory(addCat);
      
      // Clean up URL without reload
      navigate('/shopping', { replace: true });
    }
  }, [location, navigate]);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('shopping_events')
      .select('*')
      .eq('home_id', profile.home_id)
      .order('created_at');
    if (data) setEvents(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('home_id', profile.home_id)
      .order('name');
    if (data) setCategories(data);
  };

  const fetchShoppingList = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('shopping_items')
        .select(`
          *,
          category:categories(name)
        `)
        .eq('home_id', profile.home_id)
        .order('created_at', { ascending: false });

      if (['1', '2', '3', '4'].includes(activeTab)) {
        query = query.eq('week', parseInt(activeTab)).is('event_id', null);
      } else {
        query = query.eq('event_id', activeTab);
      }
      
      const { data } = await query;
      if (data) setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEventName.trim()) return;

    const { data, error } = await supabase
      .from('shopping_events')
      .insert([{ home_id: profile.home_id, name: newEventName.trim() }])
      .select()
      .single();

    if (data) {
      setEvents([...events, data]);
      setActiveTab(data.id);
      setIsCreatingEvent(false);
      setNewEventName('');
    }
  };

  const deleteEvent = async (eventId) => {
    if (confirm('¿Eliminar este evento y todos sus productos de la lista?')) {
      await supabase.from('shopping_events').delete().eq('id', eventId);
      setEvents(events.filter(e => e.id !== eventId));
      setActiveTab('1');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const isWeek = ['1', '2', '3', '4'].includes(activeTab);
    const insertData = {
      home_id: profile.home_id,
      name: newItem.trim(),
      quantity: newQuantity.trim() || null,
      expected_price: null,
      category_id: newCategory || null,
      is_purchased: false,
      week: isWeek ? parseInt(activeTab) : null,
      event_id: isWeek ? null : activeTab
    };

    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .insert([insertData])
        .select(`
          *,
          category:categories(name)
        `)
        .single();

      if (!error && data) {
        setItems([data, ...items]);
        setNewItem('');
        setNewQuantity('');
        setNewCategory('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePurchased = async (id, currentStatus) => {
    const original = [...items];
    setItems(items.map(i => i.id === id ? { ...i, is_purchased: !currentStatus } : i));
    
    const { error } = await supabase
      .from('shopping_items')
      .update({ is_purchased: !currentStatus })
      .eq('id', id);
      
    if (error) setItems(original);
  };

  const deleteItem = async (id) => {
    const original = [...items];
    setItems(items.filter(i => i.id !== id));
    
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', id);
      
    if (error) setItems(original);
  };

  const purchasedCount = items.filter(i => i.is_purchased).length;

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const catName = item.category?.name || 'Sin categoría';
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center">
          <ShoppingCart className="mr-3 text-rose-500" /> Lista Compras
        </h1>
      </div>

      {/* Selector de Semana / Eventos */}
      <div className="flex space-x-2 bg-gray-200/50 dark:bg-slate-800/50 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {['1', '2', '3', '4'].map(w => (
          <button
            key={w}
            onClick={() => setActiveTab(w)}
            className={cn(
              "flex-shrink-0 py-2 px-4 text-sm font-medium rounded-lg transition-all min-w-[80px]",
              activeTab === w ? "bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-rose-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            )}
          >
            Semana {w}
          </button>
        ))}
        {events.map(ev => (
          <div key={ev.id} className="relative flex-shrink-0 group">
            <button
              onClick={() => setActiveTab(ev.id)}
              className={cn(
                "py-2 px-4 text-sm font-medium rounded-lg transition-all h-full",
                activeTab === ev.id ? "bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              )}
            >
              🎉 {ev.name}
            </button>
            {activeTab === ev.id && (
              <button 
                onClick={() => deleteEvent(ev.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 z-10"
                title="Eliminar Evento"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
        
        {!isCreatingEvent ? (
          <button
            onClick={() => setIsCreatingEvent(true)}
            className="flex-shrink-0 flex items-center py-2 px-4 text-sm font-medium rounded-lg transition-all text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/30"
          >
            <Plus size={16} className="mr-1" /> Evento
          </button>
        ) : (
          <form onSubmit={handleCreateEvent} className="flex-shrink-0 flex items-center space-x-1">
            <input 
              type="text" 
              autoFocus
              placeholder="Ej. Cumpleaños..."
              className="py-1.5 px-3 text-sm rounded-lg bg-white dark:bg-slate-700 dark:text-white border border-gray-300 dark:border-slate-600 outline-none focus:ring-1 focus:ring-teal-500 w-32"
              value={newEventName}
              onChange={e => setNewEventName(e.target.value)}
            />
            <button type="submit" className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              <Check size={16} />
            </button>
            <button type="button" onClick={() => setIsCreatingEvent(false)} className="p-1.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
              X
            </button>
          </form>
        )}
      </div>

      {/* Añadir Item Form */}
      <form onSubmit={handleAddItem} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 space-y-3">
        <input
          type="text"
          placeholder={['1','2','3','4'].includes(activeTab) ? "Nombre del producto..." : "Añadir al evento..."}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          required
        />
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Cant. (ej. 2kg)"
            className="w-1/2 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
            value={newQuantity}
            onChange={e => setNewQuantity(e.target.value)}
          />
          <select 
            className="flex-1 px-2 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
          >
            <option value="">Sin Categoría</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <button 
          type="submit" 
          disabled={!newItem.trim()}
          className="w-full py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors flex justify-center items-center disabled:opacity-50"
        >
          <Plus size={18} className="mr-2" /> Añadir
        </button>
      </form>

      {/* Lista Agrupada */}
      {loading ? (
        <div className="space-y-3 animate-pulse mt-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 bg-white dark:bg-slate-800 rounded-2xl w-full border border-gray-100 dark:border-slate-700"></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
          No hay compras planificadas aquí.
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {Object.entries(groupedItems).map(([catName, catItems]) => (
            <div key={catName}>
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 pl-1">
                {catName}
              </h2>
              <div className="space-y-2">
                {catItems.map(item => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl shadow-sm border transition-all",
                      item.is_purchased 
                        ? "bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700/50 opacity-70" 
                        : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-700"
                    )}
                  >
                    <div className="flex items-center space-x-3 flex-1 cursor-pointer overflow-hidden" onClick={() => togglePurchased(item.id, item.is_purchased)}>
                      <div className={cn(
                        "w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center transition-colors border-2",
                        item.is_purchased ? "bg-rose-500 border-rose-500" : "border-gray-300 dark:border-slate-500"
                      )}>
                        {item.is_purchased && <Check size={14} className="text-white" />}
                      </div>
                      
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className={cn(
                          "font-medium text-base truncate transition-all",
                          item.is_purchased ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"
                        )}>
                          {item.name}
                        </span>
                        
                        {(item.quantity || item.expected_price) && (
                          <div className={cn(
                            "text-xs flex items-center space-x-2",
                            item.is_purchased ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"
                          )}>
                            {item.quantity && <span>{item.quantity}</span>}
                            {item.quantity && item.expected_price && <span>•</span>}
                            {item.expected_price && <span>Bs {item.expected_price}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors ml-2 flex-shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checkout Bar */}
      {purchasedCount > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-0 right-0 md:left-20 px-4 md:px-8 z-40 max-w-3xl mx-auto w-full animate-in slide-in-from-bottom-5">
          <div className="bg-gray-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-gray-800 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="bg-rose-500 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold">
                {purchasedCount}
              </div>
              <span className="font-medium text-sm md:text-base">ítems en el carrito</span>
            </div>
            
            <Link 
              to="/shopping/checkout"
              className="flex items-center space-x-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
            >
              <span>Finalizar</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
