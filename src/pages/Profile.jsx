import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Perfil</h1>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-semibold mb-2">{profile?.full_name}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{profile?.email}</p>
        
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 text-red-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
