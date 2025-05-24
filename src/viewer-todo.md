Make these changes:

- localStorage Persistence for Route Planner: In RouteContext (or a dedicated RouteItemsContext), persist the routeItems to localStorage. This way, a user's planned route won't be lost if they refresh the page.
- Add an error boundary around <Outlet /> in Layout.tsx
- Abstract Card Component:    Components like BuildingCard, HallCard, PoiCard, RoomCard share significant structural similarities (image, title, description, link). Create a BaseCard component to encapsulate this common structure and styling, accepting props for content and potentially slots for actions.

Reusable "Add to Route" Button/Hook:

    The logic for adding/removing items from the route (seen in HallCard, PoiCard, RoomCard, and the *Actions components on detail pages) is repetitive. Create a reusable AddToRouteButton component or a custom hook (useRouteItemActions) to handle this logic.

Reusable "Empty State" / "No Data" Component:

    The UI for displaying "no items found" (e.g., in AllBuildingsPage, SearchPage) could be a generic EmptyState component that accepts an icon, title, and message.

CarouselSection Enhancements:

    Add "Previous" and "Next" arrow buttons for navigation.

    Improve accessibility (ARIA attributes for carousels, keyboard navigation).

    Ensure key prop uses stable IDs from items if available, rather than just index.


Splitting Large Components:

    RoutePlannerPanel.tsx is quite large. Break it down into smaller, more manageable sub-components (e.g., RouteItemList, DirectionsDisplay, RouteControls).

    AllRoomsPage.tsx (with its filter logic) could also benefit from breaking down the filter UI and display logic if it grows more.

Image Thumbhash:

    Add support for a thumbhash while the image is loading

Filtering and Sorting on "All" Pages:

    AllRoomsPage has good filtering. Extend similar (perhaps simpler) filtering and sorting capabilities to AllBuildingsPage, AllHallsPage, AllPoisPage.

    Store filter states in URL query parameters so filtered views can be bookmarked/shared.

    