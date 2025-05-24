import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useRoute, type RouteItem } from '../contexts/RouteContext';
import ImageDisplay from '../components/ImageDisplay';
import type { PointOfInterestID, HallID, PointOfInterest } from '../types';

// Actions Component for POI Page
const PoiActions: React.FC<{ poi: PointOfInterest }> = ({ poi }) => {
  const { addItemToRoute, removeItemFromRoute, isItemInRoute } = useRoute();
  if (!poi) return null;

  const routeItem: RouteItem = { id: poi.id, type: 'poi' };
  const itemInRoute = isItemInRoute(routeItem);

  const handleToggleRoute = () => {
    if (itemInRoute) {
      removeItemFromRoute(routeItem);
    } else {
      addItemToRoute(routeItem);
    }
  };

  return (
    <div className="mb-6 text-right">
      <button
        onClick={handleToggleRoute}
        className={`px-4 py-2 rounded-md font-semibold text-white inline-flex items-center
                    ${itemInRoute ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
                    transition-colors shadow hover:shadow-md`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
          {itemInRoute ? (
             <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          ) : (
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          )}
        </svg>
        {itemInRoute ? 'Remove from Route' : 'Add to Route'}
      </button>
    </div>
  );
};


const PointOfInterestPage: React.FC = () => {
  const { id } = useParams<{ id: PointOfInterestID }>();
  const { data, loading, error } = useData();
  const { setBreadcrumbs } = useRoute();

  const poi = data && id ? data.points_of_interest[id] : null;
  const hall = poi ? data?.halls[poi.relations.hall as HallID] : null;
  const building = hall ? data?.buildings[hall.relations.building] : null;


  useEffect(() => {
    if (poi && hall && building) {
      setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Buildings', link: `/all-buildings`}, // Updated link
        { label: building.name, link: `/buildings/${building.id}` },
        { label: hall.name, link: `/halls/${hall.id}` },
        { label: poi.name }
      ]);
    } else if (poi && hall) {
       setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Halls', link: `/all-halls`}, 
        { label: hall.name, link: `/halls/${hall.id}` },
        { label: poi.name }
      ]);
    } else if (poi) {
        setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'POIs', link: '/all-pois' },
        { label: poi.name }
      ]);
    } else {
      setBreadcrumbs([{ label: 'Home', link: '/' }]);
    }
  }, [setBreadcrumbs, poi, hall, building]);


  if (loading) return <p className="text-center py-10">Loading point of interest details...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!poi) return <p className="text-center py-10">Point of Interest not found.</p>;

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
      <PoiActions poi={poi} />
      <div className="md:flex md:space-x-8">
        <div className="md:w-1/3 mb-6 md:mb-0">
          <ImageDisplay image={poi.image} className="w-full h-auto rounded-lg shadow-md" />
        </div>
        <div className="md:w-2/3">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-sky-700">{poi.name}</h1>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">{poi.description}</p>

          {hall && (
            <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="text-xl font-semibold mb-1 text-gray-700">Location</h3>
              <p className="text-gray-600">
                Located in Hall: <Link to={`/halls/${hall.id}`} className="text-sky-600 hover:underline font-medium">{hall.name}</Link>
                {building && (
                    <>
                        , within Building: <Link to={`/buildings/${building.id}`} className="text-sky-600 hover:underline font-medium">{building.name}</Link>
                    </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PointOfInterestPage;