import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import RoutePlannerPanel from './RoutePlannerPanel';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow relative"> {/* Added relative for panel positioning context */}
        <main className="container mx-auto p-4">
          <Outlet />
        </main>
        <RoutePlannerPanel /> {/* Added */}
      </div>
      <footer className="bg-gray-700 text-white text-center p-4">
        Footer
      </footer>
    </div>
  );
};

export default Layout;