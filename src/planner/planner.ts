import type { PlannerGraph } from "./types";

const data: PlannerGraph = await fetch("/planner.json").then(r => r.json());

// --- Data Structures ---
let nodeNames: { [id: string]: string } = {}; // Map ID to Name
let adjacencyList: { [nodeId: string]: { to: string, seconds: number }[] } = {}; // Graph

// --- Dijkstra's Algorithm ---
function dijkstra(startNodeId: string, endNodeId: string): { path: string[] | null, seconds: number } {
    const distances: { [nodeId: string]: number } = {};
    const prev: { [nodeId: string]: string | null } = {};
    const pq = new Set<string>(); // Using Set as a simple priority queue for unvisited nodes

    for (const nodeId in adjacencyList) {
        distances[nodeId] = Infinity;
        prev[nodeId] = null;
        pq.add(nodeId);
    }
    if (!(startNodeId in adjacencyList)) {
        // console.warn(`Start node ${startNodeId} not in graph for Dijkstra.`);
    }
    distances[startNodeId] = 0;


    while (pq.size > 0) {
        let u: string | null = null;
        // Find node with smallest distance in pq
        for (const nodeId of pq) {
            if (u === null || distances[nodeId] < distances[u!]) {
                u = nodeId;
            }
        }

        if (u === null || distances[u] === Infinity) break; // All remaining nodes are inaccessible
        if (u === endNodeId) break; // Reached destination

        pq.delete(u);

        (adjacencyList[u] || []).forEach(neighbor => {
            const alt = distances[u!] + neighbor.seconds;
            if (alt < distances[neighbor.to]) {
                distances[neighbor.to] = alt;
                prev[neighbor.to] = u;
            }
        });
    }

    const path: string[] = [];
    let current: string | null = endNodeId;
    if (prev[current] !== null || current === startNodeId) { // Check if path exists
        while (current !== null) {
            path.unshift(current);
            current = prev[current];
        }
    }

    if (path.length === 0 || path[0] !== startNodeId || distances[endNodeId] === Infinity) {
        return { path: null, seconds: Infinity };
    }

    return { path: path, seconds: distances[endNodeId] };
}


// --- UI Functions ---
const waypointsContainer = document.getElementById('waypoints-container') as HTMLDivElement | null;

function populateSelect(selectElement: HTMLSelectElement) {
    selectElement.innerHTML = '<option value="">-- Select Location --</option>';
    Object.keys(nodeNames).sort((a, b) => nodeNames[a].localeCompare(nodeNames[b])).forEach(nodeId => {
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
        select.value = valueToSelect; // If valueToSelect is not a valid option, it defaults to the first one
    }
    select.onchange = () => {
        updateUrlWithWaypoints();
    };

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'waypoint-controls flex space-x-1 flex-shrink-0';

    const moveUpBtn = document.createElement('button');
    moveUpBtn.type = "button";
    moveUpBtn.innerHTML = '↑';
    moveUpBtn.title = 'Move Up';
    moveUpBtn.className = 'move-up-btn px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';
    moveUpBtn.onclick = () => {
        if (waypointDiv.parentNode && waypointDiv.previousElementSibling) {
            waypointDiv.parentNode.insertBefore(waypointDiv, waypointDiv.previousElementSibling);
            updateWaypointControls();
            updateUrlWithWaypoints();
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
            updateUrlWithWaypoints();
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
            updateUrlWithWaypoints();
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
        updateUrlWithWaypoints();
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

        if (select.options.length > 0 && select.options[0]) {
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

function displayResults(pathNodeIds: string[], totalSeconds: number) {
    const resultsDiv = document.getElementById('results-container') as HTMLDivElement;
    const pathP = document.getElementById('route-path') as HTMLParagraphElement;
    const secondsP = document.getElementById('route-seconds') as HTMLParagraphElement;
    const errorP = document.getElementById('error-message') as HTMLParagraphElement;

    if (errorP) errorP.textContent = '';
    if (pathNodeIds && pathNodeIds.length > 0) {
        if (pathP) pathP.textContent = `Path: ${pathNodeIds.map(id => nodeNames[id] || 'Unknown').join(' → ')}`;
        if (secondsP) secondsP.textContent = `Total Seconds: ${totalSeconds.toFixed(0)}`;
    } else {
        if (pathP) pathP.textContent = '';
        if (secondsP) secondsP.textContent = '';
    }
    if (resultsDiv) resultsDiv.classList.remove('hidden');
}

function displayError(message: string) {
    const resultsDiv = document.getElementById('results-container') as HTMLDivElement;
    const pathP = document.getElementById('route-path') as HTMLParagraphElement;
    const secondsP = document.getElementById('route-seconds') as HTMLParagraphElement;
    const errorP = document.getElementById('error-message') as HTMLParagraphElement;

    if (pathP) pathP.textContent = '';
    if (secondsP) secondsP.textContent = '';
    if (errorP) errorP.textContent = `Error: ${message}`;
    if (resultsDiv) resultsDiv.classList.remove('hidden');
}

// --- URL Persistence Functions ---
function updateUrlWithWaypoints() {
    if (!waypointsContainer) return;

    const waypointSelects = Array.from(waypointsContainer.querySelectorAll('.waypoint-select')) as HTMLSelectElement[];
    const waypointIds = waypointSelects.map(select => select.value);

    const params = new URLSearchParams(window.location.search);
    params.set('waypoints', waypointIds.join('-')); // Will create "id1,id2" or "id1," or ",id2" or ","

    const newQueryString = params.toString();
    // Only push new state if the query string actually changes
    if (window.location.search.substring(1) !== newQueryString) {
         history.replaceState(null, '', window.location.pathname + (newQueryString ? '?' + newQueryString : ''));
    }
}

function loadWaypointsFromUrl() {
    if (!waypointsContainer) return;

    const params = new URLSearchParams(window.location.search);
    const waypointsParam = params.get('waypoints');
    let initialWaypointIds: string[] = [];

    if (waypointsParam !== null) { // Check for null, as an empty string (e.g. ?waypoints=) is valid
        initialWaypointIds = waypointsParam.split('-');
    }

    // Ensure at least two waypoints are created
    if (initialWaypointIds.length === 0) {
        waypointsContainer.appendChild(createWaypointElement(''));
        waypointsContainer.appendChild(createWaypointElement(''));
    } else if (initialWaypointIds.length === 1) {
        waypointsContainer.appendChild(createWaypointElement(initialWaypointIds[0]));
        waypointsContainer.appendChild(createWaypointElement(''));
    } else { // 2 or more waypoints from URL
        initialWaypointIds.forEach(id => {
            // If id is an empty string, it will correctly select the "-- Select Location --" option
            waypointsContainer.appendChild(createWaypointElement(id));
        });
    }
}

// --- Main Logic ---
{
    // 1. Preprocess data
    Object.keys(data.places).forEach(id => {
        nodeNames[id] = data.places[id].name;
        if (!adjacencyList[id]) adjacencyList[id] = [];
    });
    data.routes.forEach(conn => {
        if (!adjacencyList[conn.from]) adjacencyList[conn.from] = [];
        adjacencyList[conn.from].push({ to: conn.to, seconds: conn.seconds });
        if (!adjacencyList[conn.to]) adjacencyList[conn.to] = [];
    });

    // 2. Initialize UI: Load waypoints from URL or set defaults
    if (waypointsContainer) {
        loadWaypointsFromUrl(); // Creates waypoint elements based on URL
        updateWaypointControls(); // Updates button states and select labels
        updateUrlWithWaypoints(); // Canonicalize URL (e.g., if defaults were applied)
    } else {
        console.error("Waypoints container not found!");
    }

    // 3. Event Listeners
    const addWaypointBtn = document.getElementById('add-waypoint-btn');
    if (addWaypointBtn) {
        addWaypointBtn.addEventListener('click', addWaypointToContainer); // addWaypointToContainer now calls updateUrlWithWaypoints
    }

    const findRouteBtn = document.getElementById('find-route-btn');
    if (findRouteBtn) {
        findRouteBtn.addEventListener('click', () => {
            const resultsDiv = document.getElementById('results-container') as HTMLDivElement;
            const errorP = document.getElementById('error-message') as HTMLParagraphElement;
            const pathP = document.getElementById('route-path') as HTMLParagraphElement;
            const secondsP = document.getElementById('route-seconds') as HTMLParagraphElement;

            if (resultsDiv) resultsDiv.classList.add('hidden');
            if (errorP) errorP.textContent = '';
            if (pathP) pathP.textContent = '';
            if (secondsP) secondsP.textContent = '';

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
            
            // Handle case where all waypoints are the same single location
            if (waypoints.every(wp => wp === waypoints[0])) {
                displayResults([waypoints[0]], 0);
                return;
            }

            let fullPathNodeIds: string[] = [];
            let totalSeconds = 0;

            for (let i = 0; i < waypoints.length - 1; i++) {
                const segmentStart = waypoints[i];
                const segmentEnd = waypoints[i + 1];

                if (segmentStart === segmentEnd) {
                    // If it's the first segment and path is empty, add the start node.
                    if (fullPathNodeIds.length === 0 && i === 0) {
                        fullPathNodeIds.push(segmentStart);
                    }
                    // Otherwise, if start is same as end, this segment adds 0 seconds and no new nodes to path
                    // (unless it's already added as the end of the previous segment).
                    continue;
                }

                const segmentResult = dijkstra(segmentStart, segmentEnd);

                if (!segmentResult.path || segmentResult.seconds === Infinity) {
                    displayError(`No path found from ${nodeNames[segmentStart] || 'Unknown'} to ${nodeNames[segmentEnd] || 'Unknown'}.`);
                    return;
                }

                totalSeconds += segmentResult.seconds;
                if (fullPathNodeIds.length === 0) {
                    fullPathNodeIds.push(...segmentResult.path);
                } else {
                    // Ensure continuity: last node of fullPath should be first node of new segmentResult.path
                    if (fullPathNodeIds[fullPathNodeIds.length - 1] === segmentResult.path[0]) {
                        fullPathNodeIds.push(...segmentResult.path.slice(1));
                    } else {
                         // This case should ideally not happen if segments are A->A, B->B, B->C etc.
                         // It implies a mismatch, e.g. fullPath ends in X, segmentResult starts with Y.
                        displayError(`Path continuity error. Expected segment to connect from ${nodeNames[fullPathNodeIds[fullPathNodeIds.length - 1]]}, but new segment started from ${nodeNames[segmentResult.path[0]]}.`);
                        return;
                    }
                }
            }
            
            if (fullPathNodeIds.length > 0) {
                displayResults(fullPathNodeIds, totalSeconds);
            } else if (waypoints.length > 0 && waypoints.every(wp => wp === waypoints[0])) {
                // This case is handled at the top of the click handler, but as a fallback:
                displayResults([waypoints[0]], 0);
            } else {
                 // This state might be reached if waypoints were e.g. ["A", "A"] and loop was skipped
                 // but the top "every" check somehow didn't catch it or if no error was set
                 // and fullPathNodeIds remained empty.
                if (errorP && !errorP.textContent) {
                     displayError("Could not calculate a route. Please check your waypoints.");
                }
            }
        });
    }
}