import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/-/g, ' '))
    .slice(0, 3);

  return (
    <header className="min-h-16 bg-white border-b border-gray-200 flex items-center justify-between gap-4 pl-16 pr-6 lg:px-8 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-semibold text-gray-900">GovRecover360</h1>
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gov-100 text-gov-700">
            Disaster Recovery Command Platform
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 capitalize truncate">
          {breadcrumbs.length ? breadcrumbs.map((crumb, idx) => (
            <span key={`${crumb}-${idx}`} className="truncate">
              {idx > 0 && <span className="mx-2 text-gray-300">/</span>}
              {crumb}
            </span>
          )) : <span>Dashboard</span>}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-end">
        <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          Local Docker Demo
        </span>
        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          Demo Mode
        </span>
        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gov-100 text-gov-700">
          {ROLE_LABELS[user.role]}
        </span>

        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <BellIcon className="h-6 w-6 text-gray-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gov-500 flex items-center justify-center text-white text-sm font-bold">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">{user.full_name}</span>
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-50' : ''}`}
                  >
                    Profile
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-50' : ''}`}
                  >
                    Settings
                  </button>
                )}
              </Menu.Item>
              <div className="border-t border-gray-100">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={`w-full text-left px-4 py-2 text-sm text-red-600 ${active ? 'bg-red-50' : ''}`}
                    >
                      Sign Out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}
