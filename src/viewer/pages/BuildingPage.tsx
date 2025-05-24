import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import ImageDisplay from '../components/ImageDisplay';
import type { BuildingID, HallID } from '../types';

const BuildingPage: React.FC = () => {
  const { id } = useParams<{ id: BuildingID }>();
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();

  const building = id ? data.buildings[id] : null;

  useEffect(() => {
    if (building) {
      setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Buildings', link: '/all-buildings' }, // Updated link
        { label: building.name }
      ]);
    } else {
       setBreadcrumbs([
         { label: 'Home', link: '/' },
         { label: 'Buildings', link: '/all-buildings' } // Fallback if building not found
        ]);
    }
  }, [setBreadcrumbs, building]);

  if (!building) return <p className="text-center py-10">Building not found.</p>;


  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
      <div className="md:flex md:space-x-8">
        <div className="md:w-1/3 mb-6 md:mb-0">
          <ImageDisplay image={building.image} className="w-full h-auto rounded-lg shadow-md" />
        </div>
        <div className="md:w-2/3">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-sky-700">{building.name}</h1>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">{building.description}</p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Halls in this Building</h2>
        {building.relations.halls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {building.relations.halls.map(hallId => {
              const hall = data.halls[hallId as HallID];
              return hall ? (
                <Link 
                  key={hallId} 
                  to={`/halls/${hall.id}`} 
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 hover:shadow-sm"
                >
                  <h3 className="text-lg font-medium text-sky-600 hover:underline">{hall.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{hall.description}</p>
                </Link>
              ) : null;
            })}
          </div>
        ) : <p className="text-gray-500 italic">No halls listed for this building.</p>}
      </div>
    </div>
  );
};

export default BuildingPage;