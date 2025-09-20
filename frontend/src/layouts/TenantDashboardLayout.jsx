import React, { useState } from 'react';
import TenantSidebar from '../components/TenantSidebar';


const TenantDashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <div className="min-h-screen flex bg-gray-300">
      <TenantSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main
        className={`flex-1 overflow-y-auto transition-all duration-300 p-4 ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-16'
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default TenantDashboardLayout;
