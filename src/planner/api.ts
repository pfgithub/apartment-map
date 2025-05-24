export type Building = {
    id: string;
    label: string;
    relations: {
        halls: Hall[],
    }
};
export type Hall = {
    id: string,
    name: string,
    image: Image,
    description: string,

    relations: {
        rooms: Room[],
        connections: Connection[],
        building: Building,
    },
};
export type Connection = {
    seconds: number,
    relations: {
        from: Hall,
        to: Hall,
    }
};
export type Room = {
    id: string,
    name: string,
    image: Image,

    relations: {
        hall: Hall,
    },
};
export type Image = {url: string, width: number, height: number};