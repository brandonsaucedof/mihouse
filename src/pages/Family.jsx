import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Users, Copy, CheckCircle2 } from 'lucide-react';

export default function Family() {
  const { profile } = useAuth();
  const [homeInfo, setHomeInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile?.home_id) {
      fetchFamilyData();
    }
  }, [profile?.home_id]);

  const fetchFamilyData = async () => {
    try {
      const { data: home } = await supabase
        .from('homes')
        .select('*')
        .eq('id', profile.home_id)
        .single();
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('home_id', profile.home_id);

      setHomeInfo(home);
      setMembers(profiles || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (homeInfo?.invite_code) {
      navigator.clipboard.writeText(homeInfo.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="p-4 animate-pulse">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
          <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Familia</h1>
          <p className="text-gray-500 dark:text-gray-400">{homeInfo?.name}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Código de Invitación
        </h2>
        <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
          <span className="font-mono text-xl font-bold tracking-widest text-gray-900 dark:text-white">
            {homeInfo?.invite_code}
          </span>
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
          >
            {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
            <span className="text-sm font-medium">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Comparte este código con los miembros de tu hogar para que puedan unirse.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Miembros ({members.length})
        </h2>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                  {member.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center">
                    {member.full_name}
                    {member.id === profile.id && (
                      <span className="ml-2 text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full font-medium">
                        Tú
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                member.role === 'admin' 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}>
                {member.role === 'admin' ? 'Admin' : 'Miembro'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
