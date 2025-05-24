export type BuildingID = string & {__is_building_id: true};
export type HallID = string & {__is_hall_id: true};
export type ConnectionID = string & {__is_connection_id: true};
export type RoomID = string & {__is_room_id: true};
export type PointOfInterestID = string & {__is_point_of_interest_id: true};
export type Root = {
    buildings: Record<BuildingID, Building>,
    halls: Record<HallID, Hall>,
    connections: Record<ConnectionID, Connection>,
    rooms: Record<RoomID, Room>,
    points_of_interest: Record<PointOfInterestID, PointOfInterest>,
};
export type Building = {
    id: BuildingID,
    description: string,
    image: Image,

    relations: {
        halls: HallID[],
    }
};
export type Hall = {
    id: HallID,
    name: string,
    image: Image,
    description: string,

    relations: {
        rooms: RoomID[],
        reverse_connections: ConnectionID[],
        connections: ConnectionID[],
        building: BuildingID,
    },
};
export type Connection = {
    // one-way connection
    id: ConnectionID,
    name: string,

    seconds: number,
    relations: {
        from: HallID,
        to: HallID,
    },
};
export type Room = {
    id: RoomID,
    name: string,
    description: string,
    image: Image,

    price: number,
    available: boolean,
    layout: {
        bedrooms: number,
        bathrooms: number,
        has_kitchen: boolean,
        has_balcony: boolean,
        has_window: boolean,
    },

    relations: {
        hall: HallID,
    },
};
export type PointOfInterest = {
    id: PointOfInterestID,
    name: string,
    description: string,
    image: Image,

    relations: {
        hall: HallID,
    }
};
export type Image = {url: string, alt: string, width: number, height: number};

/*
Based on the data, create a web application to browse halls and rooms. Fetch the data from /root.json. Use tailwind CSS for styling.

The app should have:

    A homepage where you can browse the available rooms

    Individual pages for each room, hall, building, and point of interest

    Search to find a room, hall, building, or point of interest

    Navigation to get directions from any hall to a different hall
*/