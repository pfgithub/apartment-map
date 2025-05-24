export type HallGroup = {
    label: string, // "outside" | "apts" | "paths"
};
export type Hall = {
    group: HallGroup,
    shortcode: string,
    name: string,
    description: string,
    image: {url: string, width: number, height: number},
    units: number,

    connections: Connection[],
};
export type Connection = {
    to: Hall,
    seconds: number,
};