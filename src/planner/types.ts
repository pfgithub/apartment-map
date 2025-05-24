export type PlannerNodeID = string & {__is_planner_node_id: true};
export type PlannerNode = {
    name: string,
};
export type PlannerConnection = {
    from: PlannerNodeID,
    to: PlannerNodeID,
    seconds: number,
};
export type PlannerGraph = {
    places: Record<string, PlannerNode>,
    routes: PlannerConnection[],
};
