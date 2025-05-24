export type PlannerPlaceID = string & {__is_planner_node_id: true};
export type PlannerPlace = {
    name: string,
};
export type PlannerConnection = {
    from: PlannerPlaceID,
    to: PlannerPlaceID,
    seconds: number,
};
export type PlannerGraph = {
    places: Record<string, PlannerPlace>,
    routes: PlannerConnection[],
};
