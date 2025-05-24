import type { PlannerGraph } from "./types";

const data: PlannerGraph = await fetch("/planner.json").then(r => r.json());

// --- Data Structures ---
let nodeNames = {}; // Map ID to Name
let adjacencyList = {}; // Graph: { nodeId: [{ to: neighborId, cost: number }] }

// --- Dijkstra's Algorithm ---
function dijkstra(startNodeId, endNodeId) {
    const distances = {};
    const prev = {};
    const pq = new Set(); // Using Set as a simple priority queue for unvisited nodes

    for (const nodeId in adjacencyList) {
        distances[nodeId] = Infinity;
        prev[nodeId] = null;
        pq.add(nodeId);
    }
    distances[startNodeId] = 0;

    while (pq.size > 0) {
        // Get node with smallest distance from pq
        let u = null;
        for (const nodeId of pq) {
            if (u === null || distances[nodeId] < distances[u]) {
                u = nodeId;
            }
        }

        if (u === null || distances[u] === Infinity) break; // No path or remaining nodes unreachable
        if (u === endNodeId) break; // Reached destination

        pq.delete(u);

        (adjacencyList[u] || []).forEach(neighbor => {
            const alt = distances[u] + neighbor.cost;
            if (alt < distances[neighbor.to]) {
                distances[neighbor.to] = alt;
                prev[neighbor.to] = u;
            }
        });
    }

    // Reconstruct path
    const path = [];
    let current = endNodeId;
    if (prev[current] !== null || current === startNodeId) { // Path exists
        while (current !== null) {
            path.unshift(current);
            current = prev[current];
        }
    }

    if (path.length === 0 || path[0] !== startNodeId) { // No path found to endNodeId
        return { path: null, cost: Infinity };
    }

    return { path: path, cost: distances[endNodeId] };
}


// --- UI Functions ---
function populateSelect(selectElement) {
    selectElement.innerHTML = '<option value="">-- Select Location --</option>';
    Object.keys(nodeNames).forEach(nodeId => {
        const option = document.createElement('option');
        option.value = nodeId;
        option.textContent = nodeNames[nodeId];
        selectElement.appendChild(option);
    });
}

function addIntermediateStopElement() {
    const container = document.getElementById('intermediate-stops-container');
    const stopDiv = document.createElement('div');
    stopDiv.className = 'stop-item flex items-center space-x-2 mb-2';

    const select = document.createElement('select');
    select.className = 'intermediate-stop mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm';
    populateSelect(select);

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500';
    removeBtn.onclick = () => stopDiv.remove();

    stopDiv.appendChild(select);
    stopDiv.appendChild(removeBtn);
    container.appendChild(stopDiv);
}

function displayResults(pathNodeIds, totalCost) {
    const resultsDiv = document.getElementById('results-container');
    const pathP = document.getElementById('route-path');
    const costP = document.getElementById('route-cost');
    const errorP = document.getElementById('error-message');

    errorP.textContent = '';
    if (pathNodeIds && pathNodeIds.length > 0) {
        pathP.textContent = `Path: ${pathNodeIds.map(id => nodeNames[id]).join(' → ')}`;
        costP.textContent = `Total Cost: ${totalCost.toFixed(2)}`;
    } else {
        pathP.textContent = '';
        costP.textContent = '';
    }
    resultsDiv.classList.remove('hidden');
}

function displayError(message) {
    const resultsDiv = document.getElementById('results-container');
    const pathP = document.getElementById('route-path');
    const costP = document.getElementById('route-cost');
    const errorP = document.getElementById('error-message');

    pathP.textContent = '';
    costP.textContent = '';
    errorP.textContent = `Error: ${message}`;
    resultsDiv.classList.remove('hidden');
}

// --- Main Logic ---
{
    // 1. Preprocess data
    Object.keys(data.places).forEach(id => {
        nodeNames[id] = data.places[id].name;
        adjacencyList[id] = [];
    });
    data.routes.forEach(conn => {
        if (!adjacencyList[conn.from]) adjacencyList[conn.from] = [];
        adjacencyList[conn.from].push({ to: conn.to, cost: conn.cost });
    });

    // 2. Populate initial dropdowns
    const startSelect = document.getElementById('start-location');
    const endSelect = document.getElementById('end-location');
    populateSelect(startSelect);
    populateSelect(endSelect);

    // 3. Event Listeners
    document.getElementById('add-stop-btn').addEventListener('click', addIntermediateStopElement);

    document.getElementById('find-route-btn').addEventListener('click', () => {
        const startNodeId = startSelect.value;
        const endNodeId = endSelect.value;
        const intermediateStopElements = document.querySelectorAll('#intermediate-stops-container .intermediate-stop');
        const intermediateNodeIds = Array.from(intermediateStopElements)
            .map(select => select.value)
            .filter(value => value !== ""); // Filter out unselected intermediate stops

        if (!startNodeId || !endNodeId) {
            displayError("Please select a start and end location.");
            return;
        }

        document.getElementById('results-container').classList.add('hidden'); // Hide old results

        let fullPathNodeIds = [];
        let totalCost = 0;
        let currentStartNodeId = startNodeId;
        const waypoints = [startNodeId, ...intermediateNodeIds, endNodeId];

        if (waypoints.length < 2) {
            displayError("Route must have at least a start and end point.");
            return;
        }

        // Special case: start and end are the same, no intermediates
        if (waypoints.length === 2 && waypoints[0] === waypoints[1]) {
            displayResults([waypoints[0]], 0);
            return;
        }


        for (let i = 0; i < waypoints.length - 1; i++) {
            const segmentStart = waypoints[i];
            const segmentEnd = waypoints[i + 1];

            if (segmentStart === segmentEnd) { // Skipping segment if start and end are the same
                if (i === 0) { // Add start node if it's the very first segment being skipped
                    fullPathNodeIds.push(segmentStart);
                }
                continue;
            }

            const segmentResult = dijkstra(segmentStart, segmentEnd);

            if (!segmentResult.path || segmentResult.cost === Infinity) {
                displayError(`No path found from ${nodeNames[segmentStart]} to ${nodeNames[segmentEnd]}.`);
                return;
            }

            totalCost += segmentResult.cost;
            if (fullPathNodeIds.length === 0) {
                fullPathNodeIds.push(...segmentResult.path);
            } else {
                // Avoid duplicating the connection node
                fullPathNodeIds.push(...segmentResult.path.slice(1));
            }
        }
        // Handle case where only start and end are the same AND they were the only points
        if (fullPathNodeIds.length === 0 && waypoints.length > 0 && waypoints.every(wp => wp === waypoints[0])) {
            fullPathNodeIds.push(waypoints[0]);
        }


        if (fullPathNodeIds.length > 0) {
            displayResults(fullPathNodeIds, totalCost);
        } else if (waypoints.length === 2 && waypoints[0] === waypoints[1]) {
            // This case should be handled above, but as a fallback
            displayResults([waypoints[0]], 0);
        }
        else {
            displayError("Could not calculate a valid route. Check intermediate stops if they form a direct loop.");
        }
    });
}