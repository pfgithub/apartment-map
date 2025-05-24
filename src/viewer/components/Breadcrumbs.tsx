import React from 'react';
import { Link } from 'react-router-dom';
import { useRoute } from '../contexts/RouteContext'; // Assuming breadcrumbs are managed via RouteContext

const Breadcrumbs: React.FC = () => {
  const { breadcrumbs } = useRoute(); // Get breadcrumbs from context

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="breadcrumb" className="bg-gray-100 px-4 py-2 border-b border-gray-300">
      <ol className="container mx-auto flex space-x-2 text-sm text-gray-600">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            {crumb.link ? (
              <Link to={crumb.link} className="hover:text-blue-600 hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-gray-800 font-medium">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;