import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTheme } from 'next-themes';
import { User, LogOut, Settings, Moon, Sun, Trash2, Plus, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { profile, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loadingCats, setLoadingCats] = useState(false);

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

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setLoadingCats(true);

    const { data, error } = await supabase
      .from('categories')
      .insert([{ home_id: profile.home_id, name: newCategory.trim() }])
      .select()
      .single();
    
    if (data) {
      setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategory('');
    }
    setLoadingCats(false);
  };

  const handleDeleteCategory = async (id) => {
    if (confirm('¿Eliminar esta categoría? Los productos de esta categoría quedarán sin categoría asignada.')) {
      await supabase.from('categories').delete().eq('id', id);
      fetchCategories();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center">
          <Settings className="mr-3 text-teal-500" /> Ajustes
        </h1>
      </div>

      {/* Sección Perfil */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6 flex items-center">
          <User size={16} className="mr-2" /> Mi Cuenta
        </h2>
        
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center text-2xl font-bold uppercase">
            {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.full_name}</h3>
            <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full py-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center"
        >
          <LogOut size={18} className="mr-2" /> Cerrar Sesión
        </button>
      </section>

      {/* Sección Apariencia */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6 flex items-center">
          {theme === 'dark' ? <Moon size={16} className="mr-2" /> : <Sun size={16} className="mr-2" />} 
          Apariencia
        </h2>
        
        <div className="flex bg-gray-100 dark:bg-slate-900 rounded-xl p-1">
          <button 
            onClick={() => setTheme('light')}
            className={`flex-1 py-2 px-4 flex items-center justify-center rounded-lg font-medium transition-all ${theme === 'light' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500'}`}
          >
            <Sun size={18} className="mr-2" /> Claro
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={`flex-1 py-2 px-4 flex items-center justify-center rounded-lg font-medium transition-all ${theme === 'dark' ? 'bg-slate-700 shadow-sm text-teal-400' : 'text-gray-500'}`}
          >
            <Moon size={18} className="mr-2" /> Oscuro
          </button>
          <button 
            onClick={() => setTheme('system')}
            className={`flex-1 py-2 px-4 flex items-center justify-center rounded-lg font-medium transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-400' : 'text-gray-500'}`}
          >
            Auto
          </button>
        </div>
      </section>

      {/* Sección Categorías */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6 flex items-center">
          <Tag size={16} className="mr-2" /> Categorías de Inventario
        </h2>

        <form onSubmit={handleAddCategory} className="flex space-x-2 mb-6">
          <input 
            type="text" 
            placeholder="Nueva categoría..."
            required
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button 
            type="submit"
            disabled={loadingCats}
            className="px-4 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center"
          >
            <Plus size={20} />
          </button>
        </form>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 no-scrollbar">
          {categories.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No hay categorías. Crea una arriba.</p>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700">
                <span className="font-medium text-gray-800 dark:text-gray-200">{cat.name}</span>
                <button 
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  );
}
