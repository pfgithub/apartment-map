import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-blue-200">Campus Explorer</Link>
        <nav className="space-x-4 mt-2 sm:mt-0">
          <Link to="/" className="hover:text-blue-200">Home</Link>
          <Link to="/navigate" className="hover:text-blue-200">Directions</Link>
        </nav>
        <form onSubmit={handleSearch} className="mt-2 sm:mt-0 flex">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="px-3 py-1 rounded-l text-gray-800 focus:outline-none"
          />
          <button type="submit" className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-r">
            Search
          </button>
        </form>
      </div>
    </header>
  );
};

export default Header;