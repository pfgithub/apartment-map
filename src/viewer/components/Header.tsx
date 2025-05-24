import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
            </svg>
            Campus Explorer
          </span>
        </Link>
        
        <nav className="space-x-3 sm:space-x-4 text-sm sm:text-base mt-2 sm:mt-0 order-last sm:order-none w-full sm:w-auto flex justify-center sm:justify-start flex-wrap">
          <Link to="/" className="hover:text-sky-200 transition-colors">Home</Link>
          <Link to="/all-buildings" className="hover:text-sky-200 transition-colors">Buildings</Link> {/* Add new link */}
          <Link to="/all-available-rooms" className="hover:text-sky-200 transition-colors">Rooms</Link>
          <Link to="/all-halls" className="hover:text-sky-200 transition-colors">Halls</Link>
          <Link to="/all-pois" className="hover:text-sky-200 transition-colors">POIs</Link>
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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
};

export default Header;