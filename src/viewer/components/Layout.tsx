import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <Outlet />
      </main>
      <footer className="bg-gray-700 text-white text-center p-4">
        © {new Date().getFullYear()} Campus Explorer
      </footer>
    </div>
  );
};

export default Layout;