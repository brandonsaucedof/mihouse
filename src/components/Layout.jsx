import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, PackageSearch, ShoppingCart, PieChart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout() {
  const navItems = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/inventory', icon: PackageSearch, label: 'Inventario' },
    { to: '/shopping', icon: ShoppingCart, label: 'Compras' },
    { to: '/expenses', icon: PieChart, label: 'Gastos' },
    { to: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 md:pb-0 md:pl-20">
      {/* Sidebar for Desktop / Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 w-full bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 z-50 md:left-0 md:top-0 md:w-20 md:border-t-0 md:border-r md:flex md:flex-col justify-between py-2 md:py-8">
        <div className="flex md:flex-col justify-around md:justify-start items-center h-16 md:h-auto md:space-y-8 px-2 md:px-0">
          
          <div className="hidden md:flex items-center justify-center mb-4">
            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
              MH
            </div>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center w-16 h-12 md:w-full md:h-16 rounded-xl transition-colors relative group",
                    isActive 
                      ? "text-teal-600 dark:text-teal-400" 
                      : "text-gray-500 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-700"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn("w-6 h-6 transition-transform", isActive && "transform scale-110")} />
                    <span className="text-[10px] mt-1 font-medium md:hidden">{item.label}</span>
                    {isActive && (
                      <span className="absolute top-0 right-1/2 translate-x-1/2 w-1 h-1 rounded-full bg-teal-500 md:hidden" />
                    )}
                    {isActive && (
                      <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-teal-500" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto p-4 md:p-8 animate-in fade-in duration-300">
        <Outlet />
      </main>
    </div>
  );
}
