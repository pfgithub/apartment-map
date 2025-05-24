import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import RoutePlannerPanel from './RoutePlannerPanel';
import Breadcrumbs from './Breadcrumbs'; // Import Breadcrumbs

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <Breadcrumbs /> {/* Add Breadcrumbs component here */}
      <div className="flex-grow relative">
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
        <RoutePlannerPanel />
      </div>
      <footer className="bg-gray-800 text-gray-300 text-center p-6">
        <div className="container mx-auto">
          <p>Brought to you by NovaWays™: Find Your Way™</p>
          <p><a href="/viewerprompt.txt" className="underline">Source Code</a></p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;