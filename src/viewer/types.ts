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
    name: string,
    description: string,
    image?: Image,

    relations: {
        halls: HallID[],
    }
};
export type Hall = {
    id: HallID,
    name: string,
    image?: Image,
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
    image?: Image,

    price: number,
    available: boolean,
    layout: {
        bedrooms: number,
        bathrooms: number,
        has_kitchen?: boolean,
        has_balcony?: boolean,
        has_window?: boolean,
        has_storage?: boolean,
        square_meters?: number,
    },

    relations: {
        hall: HallID,
    },
};
export type PointOfInterest = {
    id: PointOfInterestID,
    name: string,
    description: string,
    image?: Image,

    relations: {
        hall: HallID,
    }
};
export type Image = {
    uuid: string,
    alt: string,
    width: number,
    height: number,
    thumbhash: string,
};
