import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { 
  BarChart3, 
  CheckSquare, 
  LayoutDashboard, 
  LogOut, 
  Settings, 
  Target, 
  Users,
  Menu,
  ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['employee', 'manager', 'admin'] },
    { name: 'My Goals', href: '/goals/new', icon: Target, roles: ['employee'] },
    { name: 'Track Progress', href: '/goals/track', icon: BarChart3, roles: ['employee'] },
    { name: 'Team Approvals', href: '/manager/approvals', icon: CheckSquare, roles: ['manager'] },
    { name: 'HR Admin', href: '/admin', icon: Settings, roles: ['admin'] },
  ];

  const filteredNav = navigation.filter(item => item.roles.includes(user?.role || ''));

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
          <span className="font-bold text-xl tracking-tight text-slate-900">AtomQuest</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredNav.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
              {location.pathname === item.href && (
                <motion.div layoutId="nav-pill" className="ml-auto w-1 h-4 bg-blue-600 rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 uppercase">
              {user?.name.substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start mt-2 text-slate-600 hover:text-red-600 hover:bg-red-50"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-slate-900 capitalize">
            {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full uppercase border border-blue-100">
              Active Cycle: FY26 Q1
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
