import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto p-6 lg:p-8 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
