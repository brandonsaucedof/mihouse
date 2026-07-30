import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Users, LogOut } from 'lucide-react';

export default function Setup() {
  const navigate = useNavigate();
  const { user, profile, fetchProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('choice'); // 'choice', 'create', 'join'
  const [homeName, setHomeName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Si ya tiene un hogar asignado, mandarlo al dashboard
  useEffect(() => {
    if (profile?.home_id) {
      navigate('/');
    }
  }, [profile, navigate]);

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateHome = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const code = generateInviteCode();

    try {
      // 1. Crear el hogar
      const { data: homeData, error: homeError } = await supabase
        .from('homes')
        .insert([{ name: homeName, invite_code: code }])
        .select()
        .single();

      if (homeError) throw homeError;

      // 2. Actualizar el perfil del usuario (admin)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ home_id: homeData.id, role: 'admin' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await fetchProfile(user.id); // Recargar perfil
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al crear el hogar');
      setLoading(false);
    }
  };

  const handleJoinHome = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Buscar hogar por código
      const { data: homeData, error: homeError } = await supabase
        .from('homes')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (homeError || !homeData) throw new Error('Código de invitación inválido');

      // 2. Actualizar perfil del usuario (member)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ home_id: homeData.id, role: 'member' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await fetchProfile(user.id);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al unirse al hogar');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl relative">
        <button 
          onClick={handleSignOut}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          title="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>

        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Configura tu Hogar
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {profile?.full_name ? `¡Hola ${profile.full_name}!` : 'Bienvenido'} Crea un hogar nuevo o únete a uno existente.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-500 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {mode === 'choice' && (
          <div className="space-y-4 mt-8">
            <button
              onClick={() => setMode('create')}
              className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-teal-500 rounded-xl text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
            >
              <Home className="h-6 w-6" />
              <span className="font-semibold text-lg">Crear nuevo hogar</span>
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Users className="h-6 w-6" />
              <span className="font-semibold text-lg">Unirse a un hogar</span>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form className="mt-8 space-y-6" onSubmit={handleCreateHome}>
            <div>
              <label htmlFor="homeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de tu Hogar
              </label>
              <input
                id="homeName"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-slate-700 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                placeholder="Ej. Casa de los García"
                value={homeName}
                onChange={(e) => setHomeName(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setMode('choice')}
                className="w-1/3 py-3 px-4 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 flex justify-center py-3 px-4 border border-transparent font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creando...' : 'Crear Hogar'}
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form className="mt-8 space-y-6" onSubmit={handleJoinHome}>
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código de Invitación
              </label>
              <input
                id="inviteCode"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-slate-700 focus:outline-none focus:ring-teal-500 focus:border-teal-500 uppercase font-mono text-center text-lg tracking-widest"
                placeholder="XXXXXX"
                maxLength={6}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setMode('choice')}
                className="w-1/3 py-3 px-4 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading || inviteCode.length !== 6}
                className="w-2/3 flex justify-center py-3 px-4 border border-transparent font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Verificando...' : 'Unirse'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
