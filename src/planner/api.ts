export type BuildingID = string & {__is_building_id: true};
export type HallID = string & {__is_hall_id: true};
export type ConnectionID = string & {__is_connection_id: true};
export type RoomID = string & {__is_room_id: true};
export type Root = {
    buildings: Record<BuildingID, Building>,
    halls: Record<HallID, Hall>,
    connections: Record<ConnectionID, Connection>,
    rooms: Record<RoomID, Room>,
};
export type Building = {
    id: BuildingID,
    label: string;
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
        connections: ConnectionID[],
        building: BuildingID[],
    },
};
export type Connection = {
    id: ConnectionID,
    seconds: number,
    relations: {
        from: HallID,
        to: HallID,
    }
};
export type Room = {
    id: RoomID,
    name: string,
    price: number,
    available: boolean,
    image: Image,

    relations: {
        hall: HallID,
    },
};
export type Image = {url: string, width: number, height: number};

/*
Create a web application to browse halls and rooms. Fetch the data from /root.json. Use tailwind CSS for styling.

The app should have:

    A homepage where you can see all the available rooms

    Individual room pages for each room

    Individual hall pages for each hall

    Search to find any room or hall

    Navigation to get directions from any hall to a different hall
*/