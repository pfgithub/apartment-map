import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchIcon from '../icons/SearchIcon';
import AppIcon from '../icons/AppIcon';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm(''); // Clear search term after navigation
    }
  };

  return (
    <header className="bg-sky-700 text-white p-4 shadow-md sticky top-0 z-20">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <Link to="/" className="text-3xl font-bold hover:text-sky-200 transition-colors mb-2 sm:mb-0">
          <span className="flex items-center">
            <AppIcon />
            Campus Explorer
          </span>
        </Link>
        
        <nav className="space-x-3 sm:space-x-4 text-sm sm:text-base mt-2 sm:mt-0 order-last sm:order-none w-full sm:w-auto flex justify-center sm:justify-start flex-wrap">
          <Link to="/" className="hover:text-sky-200 transition-colors">Home</Link>
          <Link to="/buildings" className="hover:text-sky-200 transition-colors">Buildings</Link>
          <Link to="/rooms" className="hover:text-sky-200 transition-colors">Rooms</Link> {/* Path changed */}
          <Link to="/halls" className="hover:text-sky-200 transition-colors">Halls</Link>
          <Link to="/pois" className="hover:text-sky-200 transition-colors">POIs</Link>
          <Link to="/map" className="hover:text-sky-200 transition-colors">Map</Link>
        </nav>

        <form onSubmit={handleSearch} className="mt-3 sm:mt-0 flex w-full sm:w-auto max-w-xs sm:max-w-sm">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search anything..."
            className="px-3 py-1.5 rounded-l-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400 flex-grow"
          />
          <button type="submit" className="bg-sky-600 hover:bg-sky-500 px-4 py-1.5 rounded-r-md transition-colors">
            <SearchIcon />
          </button>
        </form>
      </div>
    </header>
  );
};

export default Header;