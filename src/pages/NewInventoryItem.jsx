import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Plus } from 'lucide-react';

export default function NewInventoryItem() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('un');
  const [minQuantity, setMinQuantity] = useState(1);
  const [restockQuantity, setRestockQuantity] = useState(1);
  const [type, setType] = useState('permanente');

  useEffect(() => {
    if (profile?.home_id) {
      fetchCategories();
    }
  }, [profile]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('home_id', profile.home_id)
      .order('name');
    if (data) setCategories(data);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: newCategory.trim(), home_id: profile.home_id }])
      .select()
      .single();

    if (!error && data) {
      setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(data.id);
      setIsCreatingCategory(false);
      setNewCategory('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!categoryId) {
      setError('Por favor, selecciona una categoría');
      setLoading(false);
      return;
    }

    const status = quantity <= 0 ? 'Agotado' : quantity <= minQuantity ? 'Poco' : 'Suficiente';

    try {
      const { error: insertError } = await supabase
        .from('inventory_items')
        .insert([{
          home_id: profile.home_id,
          category_id: categoryId,
          name,
          quantity,
          unit,
          status,
          min_quantity: minQuantity,
          restock_quantity: restockQuantity,
          type,
          added_by: profile.id
        }]);

      if (insertError) throw insertError;
      
      // Auto-add to shopping list if status is Poco or Agotado
      if (status !== 'Suficiente') {
        await supabase.from('shopping_items').insert([{
          home_id: profile.home_id,
          name: name,
          is_purchased: false,
          week: 1,
          category_id: categoryId,
          quantity: restockQuantity ? `${restockQuantity} ${unit}` : null
        }]);
      }

      navigate('/inventory');
    } catch (err) {
      setError('Error al crear el producto');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Producto</h1>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-500 p-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del producto</label>
          <input
            type="text"
            required
            className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="Ej. Leche descremada"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
          {!isCreatingCategory ? (
            <div className="flex space-x-2">
              <select
                required
                className="flex-1 p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="" disabled>Selecciona una categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={() => setIsCreatingCategory(true)}
                className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/40"
              >
                <Plus size={20} />
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 p-3 border border-teal-500 rounded-xl bg-transparent dark:text-white outline-none"
                placeholder="Nueva categoría..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                autoFocus
              />
              <button 
                type="button"
                onClick={handleCreateCategory}
                className="px-4 bg-teal-600 text-white rounded-xl font-medium"
              >
                Crear
              </button>
              <button 
                type="button"
                onClick={() => setIsCreatingCategory(false)}
                className="px-4 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
              >
                X
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad actual</label>
            <input
              type="number"
              min="0"
              required
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidad</label>
            <select
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="un">Unidades</option>
              <option value="kg">Kilogramos (kg)</option>
              <option value="g">Gramos (g)</option>
              <option value="L">Litros (L)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="paq">Paquetes</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mínimo permitido (Alerta)</label>
            <p className="text-xs text-gray-500 mb-2">Si baja de esto, va a compras.</p>
            <input
              type="number"
              min="0"
              required
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              value={minQuantity}
              onChange={(e) => setMinQuantity(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad a reponer</label>
            <p className="text-xs text-gray-500 mb-2">Qué cantidad comprar al agotarse.</p>
            <input
              type="number"
              min="1"
              required
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              value={restockQuantity}
              onChange={(e) => setRestockQuantity(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de consumo</label>
          <div className="flex space-x-4 mt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" value="permanente" checked={type === 'permanente'} onChange={() => setType('permanente')} className="text-teal-600 focus:ring-teal-500" />
              <span className="dark:text-white text-sm">Permanente (siempre se repone)</span>
            </label>
          </div>
          <div className="flex space-x-4 mt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" value="una_vez" checked={type === 'una_vez'} onChange={() => setType('una_vez')} className="text-teal-600 focus:ring-teal-500" />
              <span className="dark:text-white text-sm">De una sola vez (se archiva al acabar)</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 mt-4"
        >
          {loading ? 'Guardando...' : 'Añadir Producto'}
        </button>

      </form>
    </div>
  );
}
