import type { PlannerGraph } from "./types";

const data: PlannerGraph = await fetch("/planner.json").then(r => r.json());

// --- Data Structures ---
let nodeNames: { [id: string]: string } = {}; // Map ID to Name
let adjacencyList: { [nodeId: string]: { to: string, cost: number }[] } = {}; // Graph

// --- Dijkstra's Algorithm ---
function dijkstra(startNodeId: string, endNodeId: string): { path: string[] | null, cost: number } {
    const distances: { [nodeId: string]: number } = {};
    const prev: { [nodeId: string]: string | null } = {};
    const pq = new Set<string>(); // Using Set as a simple priority queue for unvisited nodes

    for (const nodeId in adjacencyList) {
        distances[nodeId] = Infinity;
        prev[nodeId] = null;
        pq.add(nodeId);
    }
    // Ensure startNodeId and endNodeId are in the graph from adjacencyList keys
    if (!(startNodeId in adjacencyList)) { // or nodeNames to cover isolated nodes
         // console.warn(`Start node ${startNodeId} not in graph for Dijkstra.`);
    }
    distances[startNodeId] = 0;


    while (pq.size > 0) {
        let u: string | null = null;
        for (const nodeId of pq) {
            if (u === null || distances[nodeId] < distances[u!]) {
                u = nodeId;
            }
        }

        if (u === null || distances[u] === Infinity) break;
        if (u === endNodeId) break;

        pq.delete(u);

        (adjacencyList[u] || []).forEach(neighbor => {
            const alt = distances[u!] + neighbor.cost;
            if (alt < distances[neighbor.to]) {
                distances[neighbor.to] = alt;
                prev[neighbor.to] = u;
            }
        });
    }

    const path: string[] = [];
    let current: string | null = endNodeId;
    if (prev[current] !== null || current === startNodeId) {
        while (current !== null) {
            path.unshift(current);
            current = prev[current];
        }
    }

    if (path.length === 0 || path[0] !== startNodeId || distances[endNodeId] === Infinity) {
        return { path: null, cost: Infinity };
    }

    return { path: path, cost: distances[endNodeId] };
}


// --- UI Functions ---
const waypointsContainer = document.getElementById('waypoints-container') as HTMLDivElement | null;

function populateSelect(selectElement: HTMLSelectElement) {
    selectElement.innerHTML = '<option value="">-- Select Location --</option>';
    Object.keys(nodeNames).sort((a, b) => nodeNames[a].localeCompare(nodeNames[b])).forEach(nodeId => { // Sort names alphabetically
        const option = document.createElement('option');
        option.value = nodeId;
        option.textContent = nodeNames[nodeId];
        selectElement.appendChild(option);
    });
}

function createWaypointElement(valueToSelect = ''): HTMLDivElement {
    const waypointDiv = document.createElement('div');
    waypointDiv.className = 'waypoint-item flex items-center space-x-2 mb-2';

    const select = document.createElement('select');
    select.className = 'waypoint-select mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm';
    populateSelect(select);
    if (valueToSelect) {
        select.value = valueToSelect;
    }

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'waypoint-controls flex space-x-1 flex-shrink-0'; // flex-shrink-0 to prevent buttons from shrinking

    const moveUpBtn = document.createElement('button');
    moveUpBtn.type = "button";
    moveUpBtn.innerHTML = '↑';
    moveUpBtn.title = 'Move Up';
    moveUpBtn.className = 'move-up-btn px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';
    moveUpBtn.onclick = () => {
        if (waypointDiv.parentNode && waypointDiv.previousElementSibling) {
            waypointDiv.parentNode.insertBefore(waypointDiv, waypointDiv.previousElementSibling);
            updateWaypointControls();
        }
    };

    const moveDownBtn = document.createElement('button');
    moveDownBtn.type = "button";
    moveDownBtn.innerHTML = '↓';
    moveDownBtn.title = 'Move Down';
    moveDownBtn.className = 'move-down-btn px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';
    moveDownBtn.onclick = () => {
        if (waypointDiv.parentNode && waypointDiv.nextElementSibling) {
            waypointDiv.parentNode.insertBefore(waypointDiv.nextElementSibling, waypointDiv);
            updateWaypointControls();
        }
    };

    const removeBtn = document.createElement('button');
    removeBtn.type = "button";
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'remove-btn px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed';
    removeBtn.onclick = () => {
        if (waypointsContainer && waypointsContainer.children.length > 2) {
            waypointDiv.remove();
            updateWaypointControls();
        }
    };

    controlsDiv.appendChild(moveUpBtn);
    controlsDiv.appendChild(moveDownBtn);
    controlsDiv.appendChild(removeBtn);

    waypointDiv.appendChild(select);
    waypointDiv.appendChild(controlsDiv);
    return waypointDiv;
}

function addWaypointToContainer() {
    if (waypointsContainer) {
        const newWaypointElement = createWaypointElement();
        waypointsContainer.appendChild(newWaypointElement);
        updateWaypointControls();
    }
}

function updateWaypointControls() {
    if (!waypointsContainer) return;
    const items = Array.from(waypointsContainer.children);
    items.forEach((item, index) => {
        const select = item.querySelector('.waypoint-select') as HTMLSelectElement;
        const moveUpBtn = item.querySelector('.move-up-btn') as HTMLButtonElement;
        const moveDownBtn = item.querySelector('.move-down-btn') as HTMLButtonElement;
        const removeBtn = item.querySelector('.remove-btn') as HTMLButtonElement;

        if (!select || !moveUpBtn || !moveDownBtn || !removeBtn) return;

        if (select.options.length > 0) { // Ensure default option exists
            if (items.length === 2) {
                if (index === 0) select.options[0].textContent = '-- Start Location --';
                else if (index === 1) select.options[0].textContent = '-- End Location --';
            } else {
                select.options[0].textContent = '-- Select Location --';
            }
        }
        
        moveUpBtn.disabled = (index === 0);
        moveDownBtn.disabled = (index === items.length - 1);
        removeBtn.disabled = (items.length <= 2);
    });
}


function displayResults(pathNodeIds: string[], totalCost: number) {
    const resultsDiv = document.getElementById('results-container') as HTMLDivElement;
    const pathP = document.getElementById('route-path') as HTMLParagraphElement;
    const costP = document.getElementById('route-cost') as HTMLParagraphElement;
    const errorP = document.getElementById('error-message') as HTMLParagraphElement;

    errorP.textContent = '';
    if (pathNodeIds && pathNodeIds.length > 0) {
        pathP.textContent = `Path: ${pathNodeIds.map(id => nodeNames[id] || 'Unknown').join(' → ')}`;
        costP.textContent = `Total Cost: ${totalCost.toFixed(2)}`;
    } else {
        pathP.textContent = '';
        costP.textContent = '';
    }
    resultsDiv.classList.remove('hidden');
}

function displayError(message: string) {
    const resultsDiv = document.getElementById('results-container') as HTMLDivElement;
    const pathP = document.getElementById('route-path') as HTMLParagraphElement;
    const costP = document.getElementById('route-cost') as HTMLParagraphElement;
    const errorP = document.getElementById('error-message') as HTMLParagraphElement;

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
        if (!adjacencyList[id]) adjacencyList[id] = []; // Ensure all places are in adj list, even if no outgoing routes
    });
    data.routes.forEach(conn => {
        if (!adjacencyList[conn.from]) adjacencyList[conn.from] = [];
        adjacencyList[conn.from].push({ to: conn.to, cost: conn.cost });
        if (!adjacencyList[conn.to]) adjacencyList[conn.to] = []; // Ensure 'to' nodes are also in adj list keys
    });


    // 2. Populate initial waypoints
    if (waypointsContainer) {
        waypointsContainer.appendChild(createWaypointElement());
        waypointsContainer.appendChild(createWaypointElement());
        updateWaypointControls();
    } else {
        console.error("Waypoints container not found!");
    }

    // 3. Event Listeners
    const addWaypointBtn = document.getElementById('add-waypoint-btn');
    if (addWaypointBtn) {
        addWaypointBtn.addEventListener('click', addWaypointToContainer);
    }

    const findRouteBtn = document.getElementById('find-route-btn');
    if (findRouteBtn) {
        findRouteBtn.addEventListener('click', () => {
            const resultsDiv = document.getElementById('results-container') as HTMLDivElement;
            const errorP = document.getElementById('error-message') as HTMLParagraphElement;
            const pathP = document.getElementById('route-path') as HTMLParagraphElement;
            const costP = document.getElementById('route-cost') as HTMLParagraphElement;

            resultsDiv.classList.add('hidden');
            if (errorP) errorP.textContent = '';
            if (pathP) pathP.textContent = '';
            if (costP) costP.textContent = '';

            if (!waypointsContainer) {
                displayError("Waypoint container UI element not found.");
                return;
            }

            const waypointSelectElements = waypointsContainer.querySelectorAll('.waypoint-select');
            const waypoints = Array.from(waypointSelectElements)
                .map(select => (select as HTMLSelectElement).value);

            if (waypoints.length < 2) {
                displayError("Please add at least two waypoints (a start and an end).");
                return;
            }

            if (waypoints.some(wp => wp === "")) {
                displayError("Please ensure all waypoints have a location selected.");
                return;
            }

            let fullPathNodeIds: string[] = [];
            let totalCost = 0;

            if (waypoints.every(wp => wp === waypoints[0])) {
                displayResults([waypoints[0]], 0);
                return;
            }

            for (let i = 0; i < waypoints.length - 1; i++) {
                const segmentStart = waypoints[i];
                const segmentEnd = waypoints[i + 1];

                if (segmentStart === segmentEnd) {
                    if (fullPathNodeIds.length === 0 && i === 0) { // Only add if it's the very first node and path is empty
                        fullPathNodeIds.push(segmentStart);
                    }
                    // If segmentStart is already the last node of fullPathNodeIds, we don't need to add it again.
                    // This is implicitly handled as we only add to fullPathNodeIds if it's empty or from segmentResult.
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
                    if (fullPathNodeIds[fullPathNodeIds.length - 1] === segmentResult.path[0]) {
                        fullPathNodeIds.push(...segmentResult.path.slice(1));
                    } else {
                         // This implies a discontinuity, potentially from an unhandled skipped segment scenario or bad data
                         // If previous segment was A->A, fullPath is [A]. Next is A->B, path is A,X,B. Slice(1) -> X,B. Correct.
                        displayError(`Path continuity error. Expected segment to start from ${nodeNames[fullPathNodeIds[fullPathNodeIds.length - 1]]}, but it started from ${nodeNames[segmentResult.path[0]]}.`);
                        return;
                    }
                }
            }

            if (fullPathNodeIds.length > 0) {
                displayResults(fullPathNodeIds, totalCost);
            } else if (waypoints.length > 0 && waypoints.every(wp => wp === waypoints[0])) {
                // This case is already handled at the beginning of the click handler.
                // Redundant here, but kept for logical completeness if the top check was missed.
                displayResults([waypoints[0]], 0);
            } else {
                // If no error was set by a failed segment, but path is still empty.
                // This might happen if all segments were A->A types and the logic to build fullPathNodeIds for that was insufficient.
                // Example: [A,A,B,B]. Should be A->B. If calculation gives empty, this is a fallback.
                // Current logic: 1st A,A => fullPath = [A]. 2nd A,B => dijkstra(A,B) ... path = [A, ...B]. So this should be fine.
                if (errorP && !errorP.textContent) { // Check if errorP is not null before accessing textContent
                     displayError("Could not calculate a route from the given waypoints. Ensure they form a connectable sequence.");
                }
            }
        });
    }
}