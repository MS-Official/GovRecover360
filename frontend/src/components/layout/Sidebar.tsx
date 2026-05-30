import { Fragment, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMenuItemsByRole } from '../../utils/permissions';
import { ROLE_DISPLAY_NAMES } from '../../utils/constants';
import {
  HomeIcon, UsersIcon, ExclamationTriangleIcon, HeartIcon,
  DocumentChartBarIcon, ClipboardDocumentListIcon, SparklesIcon,
  UserPlusIcon, FolderIcon, ClipboardDocumentCheckIcon,
  ClockIcon, CheckBadgeIcon, BriefcaseIcon, BanknotesIcon,
  CubeIcon, TruckIcon, ChartBarIcon, MapIcon, HomeModernIcon,
  MapPinIcon, DocumentTextIcon, MagnifyingGlassIcon, ServerIcon,
  Bars3Icon, XMarkIcon, ChevronLeftIcon,
} from '@heroicons/react/24/outline';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HomeIcon, UsersIcon, ExclamationTriangleIcon, HeartIcon,
  DocumentChartBarIcon, ClipboardDocumentListIcon, SparklesIcon,
  UserPlusIcon, FolderIcon, ClipboardDocumentCheckIcon,
  ClockIcon, CheckBadgeIcon, BriefcaseIcon, BanknotesIcon,
  CubeIcon, TruckIcon, ChartBarIcon, MapIcon, HomeModernIcon,
  MapPinIcon, DocumentTextIcon, MagnifyingGlassIcon, ServerIcon,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const menuItems = getMenuItemsByRole(user.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === `/${user.role}`) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gov-700 text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
      </button>

      <div
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-gov-800 text-white transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gov-700">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <ShieldIcon />
              </div>
              <div>
                <p className="font-bold text-sm">GovRecover</p>
                <p className="text-xs text-gov-300">360</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <ShieldIcon />
              </div>
            </div>
          )}
          <button
            onClick={onToggle}
            className="hidden lg:block p-1 rounded hover:bg-gov-700 transition-colors"
          >
            <ChevronLeftIcon className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon];
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-gov-600 text-white'
                    : 'text-gov-200 hover:bg-gov-700 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gov-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gov-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.full_name}</p>
                <p className="text-xs text-gov-300 truncate">{ROLE_DISPLAY_NAMES[user.role]}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="mt-3 w-full px-3 py-2 text-sm text-gov-300 hover:text-white hover:bg-gov-700 rounded-lg transition-colors text-left"
            >
              Sign Out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5 text-gov-600" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
  );
}
