export type PlannerPlaceShortcode = string & {__is_planner_shortcode: true};
export type PlannerPlace = {
    title: string,
    num_rooms: string,
};
export type PlannerConnection = {
    from: PlannerPlaceShortcode,
    to: PlannerPlaceShortcode,
    seconds: number,
};
export type PlannerGraph = {
    places: Record<string, PlannerPlace>,
    routes: PlannerConnection[],
};
