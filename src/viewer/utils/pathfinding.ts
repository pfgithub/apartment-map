import { Root, HallID, ConnectionID } from '../types';

export interface PathResult {
  path: HallID[];
  totalSeconds: number;
}

export function findShortestPath(data: Root, startHallId: HallID, endHallId: HallID): PathResult | null {
  const distances: Record<HallID, number> = {};
  const previousNodes: Record<HallID, HallID | null> = {};
  const unvisited = new Set<HallID>(Object.keys(data.halls) as HallID[]);

  // Initialize distances
  for (const hallId of unvisited) {
    distances[hallId] = Infinity;
    previousNodes[hallId] = null;
  }
  distances[startHallId] = 0;

  while (unvisited.size > 0) {
    // Find node with smallest distance among unvisited
    let currentNode: HallID | null = null;
    let minDistance = Infinity;
    for (const hallId of unvisited) {
      if (distances[hallId] < minDistance) {
        minDistance = distances[hallId];
        currentNode = hallId;
      }
    }

    if (currentNode === null || distances[currentNode] === Infinity) {
      break; // No path or remaining nodes are unreachable
    }

    unvisited.delete(currentNode);

    if (currentNode === endHallId) {
      // Path found, reconstruct it
      const path: HallID[] = [];
      let current = endHallId;
      while (current !== null) {
        path.unshift(current);
        current = previousNodes[current]!;
      }
      return { path, totalSeconds: distances[endHallId] };
    }

    // For each neighbor of currentNode
    const hall = data.halls[currentNode];
    if (hall) {
        for (const connId of hall.relations.connections) {
            const connection = data.connections[connId as ConnectionID];
            if (connection && connection.relations.from === currentNode) { // Ensure it's an outgoing connection
                const neighborHallId = connection.relations.to;
                if (unvisited.has(neighborHallId)) { // Only consider unvisited neighbors
                    const newDist = distances[currentNode] + connection.seconds;
                    if (newDist < distances[neighborHallId]) {
                        distances[neighborHallId] = newDist;
                        previousNodes[neighborHallId] = currentNode;
                    }
                }
            }
        }
    }
  }
  return null; // No path found
}