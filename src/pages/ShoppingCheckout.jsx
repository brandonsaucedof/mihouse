import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Store } from 'lucide-react';

export default function ShoppingCheckout() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [storeName, setStoreName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  useEffect(() => {
    if (profile?.home_id) {
      fetchPurchasedItems();
    }
  }, [profile]);

  const fetchPurchasedItems = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('home_id', profile.home_id)
        .eq('is_purchased', true)
        .order('created_at');
      
      if (data) setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSaving(true);

    try {
      // Build items summary and determine week/event
      const firstItem = items[0];
      const purchaseWeek = firstItem?.week || null;
      const purchaseEventId = firstItem?.event_id || null;

      const itemsSummary = items.map(i => ({
        name: i.name,
        quantity: i.quantity || '',
        expected_price: i.expected_price || null
      }));

      // 1. Create Purchase record
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          home_id: profile.home_id,
          total_amount: Number(totalAmount),
          store_name: storeName.trim() || 'Supermercado',
          week: purchaseWeek,
          event_id: purchaseEventId,
          items_summary: itemsSummary
        }]);

      if (purchaseError) throw purchaseError;

      // 2. Replenish inventory (Auto-update status)
      // We check if the purchased item exists in inventory_items by name, and if so, set quantity = min_quantity + 1, status = 'Suficiente', is_archived = false
      
      for (const item of items) {
        const isEventItem = item.event_id != null;

        // Try to find the item in inventory
        const { data: invItem } = await supabase
          .from('inventory_items')
          .select('id, min_quantity, type')
          .eq('home_id', profile.home_id)
          .ilike('name', item.name)
          .maybeSingle();

        if (invItem) {
          // Si el item existe, reponerlo al mínimo + 1 o al menos 1
          const newQty = Math.max(Number(invItem.min_quantity) + 1, 1);
          await supabase
            .from('inventory_items')
            .update({ 
              quantity: newQty, 
              status: 'Suficiente', 
              is_archived: isEventItem ? true : false,
              type: isEventItem ? 'una_vez' : invItem.type
            })
            .eq('id', invItem.id);
        } else {
          // Si no existe, lo creamos
          await supabase
            .from('inventory_items')
            .insert([{
              home_id: profile.home_id,
              name: item.name,
              quantity: 1,
              status: 'Suficiente',
              min_quantity: 1,
              added_by: profile.id,
              is_archived: isEventItem ? true : false,
              type: isEventItem ? 'una_vez' : 'permanente'
            }]);
        }
      }

      // 3. Delete items from shopping_items since they are now bought
      const itemIds = items.map(i => i.id);
      await supabase.from('shopping_items').delete().in('id', itemIds);

      // 4. Redirect to Shopping instead of Expenses
      navigate('/shopping');
    } catch (err) {
      console.error(err);
      alert('Hubo un error al procesar la compra.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Cargando carrito...</div>;

  if (items.length === 0) {
    return (
      <div className="space-y-6 text-center py-12">
        <h2 className="text-2xl font-bold">No hay ítems en el carrito</h2>
        <p className="text-gray-500">Marca productos como comprados en la lista de compras para hacer el checkout.</p>
        <Link to="/shopping" className="inline-block px-6 py-3 bg-teal-600 text-white rounded-xl font-medium">Volver a compras</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resumen de Compra</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Productos Comprados ({items.length})
        </h2>
        <ul className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-2">
          {items.map(item => (
            <li key={item.id} className="flex flex-col text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl">
              <div className="flex items-center space-x-3">
                <CheckCircle2 size={16} className="text-teal-500 flex-shrink-0" />
                <span className="font-medium truncate">{item.name}</span>
              </div>
              {(item.quantity || item.expected_price) && (
                <div className="text-sm text-gray-500 dark:text-gray-400 ml-7 mt-1">
                  {item.quantity && <span>{item.quantity}</span>}
                  {item.quantity && item.expected_price && <span> • </span>}
                  {item.expected_price && <span>Bs {item.expected_price}</span>}
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="border-t border-gray-100 dark:border-slate-700 pt-6">
          <form onSubmit={handleCheckout} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lugar de Compra (Supermercado)
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Ej. Walmart, Lider, Jumbo..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 dark:text-white transition-all"
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monto Total Gastado
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Bs</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 dark:text-white transition-all text-2xl font-bold"
                  value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !totalAmount}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 mt-4 flex justify-center items-center"
            >
              {saving ? 'Registrando...' : 'Registrar Compra y Reponer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
