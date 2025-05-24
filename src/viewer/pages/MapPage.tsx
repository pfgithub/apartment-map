// src/viewer/pages/MapPage.tsx
import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { useRoute, type RouteItem } from '../contexts/RouteContext';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import CytoscapeComponent from 'react-cytoscapejs';
import type { ElementDefinition } from 'cytoscape';
import type { HallID } from '../types';

cytoscape.use(fcose);

/*
When updating this file, remember that CytoscapeComponent must never rerender! It must be initialized once and
then only updated afterwards.
*/

const MapPage: React.FC = () => {
  const { data } = useData();
  const { setBreadcrumbs, calculatedRouteSegmentsForMap, addItemToRoute, removeItemFromRoute, isItemInRoute } = useRoute();
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', link: '/' },
      { label: 'Campus Map' }
    ]);
  }, [setBreadcrumbs]);

  const elements = useMemo<ElementDefinition[]>(() => {
    if (!data) return [];

    const eles: ElementDefinition[] = [];

    // Add building nodes (parents)
    Object.values(data.buildings).forEach(building => {
      eles.push({
        data: { id: building.id, label: building.name, type: 'building' },
        classes: 'building'
      });
    });

    // Add hall nodes (children of buildings)
    Object.values(data.halls).forEach(hall => {
      eles.push({
        data: {
          id: hall.id,
          label: hall.name,
          parent: hall.relations.building,
          type: 'hall',
          name: hall.name // For dynamic sizing based on name length
        },
        classes: 'hall'
      });
    });

    // Add connection edges
    Object.values(data.connections).forEach(connection => {
      eles.push({
        data: {
          id: connection.id,
          source: connection.relations.from,
          target: connection.relations.to,
          label: `${connection.seconds}s`,
          type: 'connection'
        },
        classes: 'connection'
      });
    });

    return eles;
  }, [data]);

  // Memoize the layout configuration
  const layout = useMemo(() => ({
    name: 'fcose',
    quality: 'default',
    animate: true,
    animationDuration: 500,
    fit: true,
    padding: 50,
    nodeDimensionsIncludeLabels: true,
    nodeSeparation: 85, // Increased for better separation
    idealEdgeLength: (_edge: any) => 120, // Increased for better spread
    nestingFactor: 1.5, // Increased for more space around compounds
    gravity: 0.1,
    numIter: 2500, // Default is 2500
    tile: true,
    packComponents: true,
  }), []); // Empty dependency array means this object is created once

  // Memoize the stylesheet
  const stylesheet = useMemo<cytoscape.StylesheetStyle[]>(() => [
    {
      selector: 'node', // General node style (fallback)
      style: {
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-family': 'sans-serif',
      }
    },
    {
      selector: '.building',
      style: {
        'background-color': 'rgb(219 234 254)', // Tailwind blue-100
        'border-color': 'rgb(59 130 246)', // Tailwind blue-500
        'border-width': 2,
        'shape': 'round-rectangle',
        'label': 'data(label)',
        'text-valign': 'top',
        'padding': '20px',
        'color': 'rgb(30 64 175)', // Tailwind blue-800
        'font-size': '14px',
      }
    },
    {
      selector: '.hall',
      style: {
        'background-color': 'rgb(147 197 253)', // Tailwind blue-300
        'border-color': 'rgb(30 64 175)', // Tailwind blue-800
        'border-width': 1.5,
        'width': (ele: cytoscape.NodeSingular) => Math.max(40, (ele.data('name')?.length || 5) * 6 + 20), // Dynamic width based on label
        'height': 30,
        'label': 'data(label)',
        'font-size': '10px',
        'color': 'rgb(17 24 39)', // Tailwind gray-900
        'z-index': 10, // Halls on top of building shape but under their labels
      }
    },
    {
      selector: '.hall:hover',
      style: {
        'background-color': 'rgb(59 130 246)', // Tailwind blue-500
        'border-color': 'rgb(29 78 216)', // Tailwind blue-700
        'text-outline-color': 'rgb(59 130 246)',
      }
    },
    {
      selector: '.connection',
      style: {
        'width': 1.5,
        'line-color': 'rgb(156 163 175)', // Tailwind gray-400
        'target-arrow-color': 'rgb(156 163 175)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 1.2,
      }
    },
    {
      selector: '.highlighted-route-node',
      style: {
        'background-color': 'rgb(250 204 21)', // Tailwind yellow-400
        'border-color': 'rgb(245 158 11)', // Tailwind yellow-600
        'border-width': 3,
        'z-compound-depth': 'top',
        'z-index': 999,
        'text-outline-color': 'rgb(250 204 21)',
      }
    },
    {
      selector: '.highlighted-route-edge',
      style: {
        'line-color': 'rgb(234 88 12)', // Tailwind orange-600
        'target-arrow-color': 'rgb(234 88 12)',
        'width': 3.5,
        'z-compound-depth': 'top',
        'z-index': 998,
      }
    },
    { // Style for the flash effect when a hall is added to the route
      selector: '.flash-added',
      style: {
        'overlay-color': 'rgb(34 197 94)', // Tailwind green-500
        'overlay-opacity': 0.6,
        'overlay-padding': '8px',
        'transition-property': 'overlay-opacity, overlay-padding',
        'transition-duration': '0.15s', // Duration of the flash visual effect itself
        'transition-timing-function': 'ease-out',
        'z-index': 9999, // Ensure flash is on top
      }
    }
  ], []); // Empty dependency array means this array is created once

  // Memoize the cy initialization callback
  const initCy = useCallback((cyInstance: cytoscape.Core) => {
    cyRef.current = cyInstance;
  }, []); // cyRef itself is stable, so empty dependency array

  useEffect(() => {
    const cy = cyRef.current;
    if (cy) {
      const hallTapHandler = (event: cytoscape.EventObject) => {
        const hallNode = event.target;
        const hallId = hallNode.id() as HallID;

        const routeItem: RouteItem = { id: hallId, type: 'hall' };
        if (isItemInRoute(routeItem)) {
          removeItemFromRoute(routeItem);
        } else {
          addItemToRoute(routeItem);
        }

        hallNode.flashClass('flash-added', 300); // Flash for 300ms
      };

      cy.on('tap', 'node.hall', hallTapHandler);

      return () => {
        // Ensure cy instance is valid and not destroyed before calling off
        if (cy && !cy.destroyed()) {
          cy.off('tap', 'node.hall', hallTapHandler);
        }
      };
    }
  }, [addItemToRoute, removeItemFromRoute, isItemInRoute]); // All of these are stable.

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return; // Ensure cy instance is valid

    // Clear previous highlights
    cy.elements().removeClass('highlighted-route-node').removeClass('highlighted-route-edge');

    if (!calculatedRouteSegmentsForMap || calculatedRouteSegmentsForMap.length === 0) {
      return;
    }

    calculatedRouteSegmentsForMap.forEach(segment => {
      if (segment.path && segment.path.length > 0) {
        // Highlight nodes in the segment
        segment.path.forEach(hallId => {
          cy.getElementById(hallId).addClass('highlighted-route-node');
        });

        // Highlight edges in the segment
        for (let i = 0; i < segment.path.length - 1; i++) {
          const sourceHallId = segment.path[i];
          const targetHallId = segment.path[i + 1];
          // Ensure elements exist before trying to add class
          const edge = cy.edges(`[source = "${sourceHallId}"][target = "${targetHallId}"]`);
          if (edge.length > 0) { // Check if edge exists
            edge.addClass('highlighted-route-edge');
          }
          // Also handle reverse direction if connections are bidirectional but modeled as one-way in data
          const reverseEdge = cy.edges(`[source = "${targetHallId}"][target = "${sourceHallId}"]`);
          if (reverseEdge.length > 0) {
            reverseEdge.addClass('highlighted-route-edge');
          }
        }
      }
    });
  }, [calculatedRouteSegmentsForMap]);

  if (!data) {
    return <p className="text-center py-10">Loading map data...</p>;
  }

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Campus Map</h1>
      </header>
      <div className="w-full bg-gray-50 shadow-lg rounded-lg p-1 sm:p-2 border border-gray-200">
        <CytoscapeComponent
          elements={elements}
          style={{ width: '100%', height: '75vh' }}
          layout={layout} // Now uses memoized layout
          stylesheet={stylesheet} // Now uses memoized stylesheet
          cy={initCy} // Now uses memoized callback
          minZoom={0.2}
          maxZoom={2.5}
          autoungrabify={true}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Note: Map layout is auto-generated. Click on a hall to add it to your route.
      </p>
    </div>
  );
};

export default MapPage;