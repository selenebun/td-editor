var cols;
var rows;
var ts = 24;            // tile size
var zoomDefault = ts;

var grid;               // tile type (0 = empty, 1 = wall, 2 = path, 3 = tower)
var paths;              // direction to travel

var exit;
var spawnpoints = [];

var selected = 'empty';


// Misc functions

// Draw an arrow
function arrow() {
    stroke(0);
    var length = 0.7 * ts;
    var back = 0.1 * ts;
    var width = 0.5 * ts;
    line(-length / 2, 0, length / 2, 0);
    line(-length / 2, 0, -back, -width / 2);
    line(-length / 2, 0, -back, width / 2);
}

// Return map string
function exportMap() {
    // Convert spawnpoints into a JSON-friendly format
    var spawns = [];
    for (var i = 0; i < spawnpoints.length; i++) {
        var s = spawnpoints[i];
        spawns.push([s.x, s.y]);
    }
    return JSON.stringify({
        // Grids
        grid: grid,
        paths: paths,
        // Important tiles
        exit: [exit.x, exit.y],
        spawnpoints: spawns,
        // Misc
        cols: cols,
        rows: rows
    });
}

// Return walkability map
function getWalkMap() {
    var walkMap = [];
    for (var x = 0; x < cols; x++) {
        walkMap[x] = [];
        for (var y = 0; y < rows; y++) {
            walkMap[x][y] = walkable(x, y);
        }
    }
    return walkMap;
}

// Load a map from a map string
function importMap(str) {
    try {
        var m = JSON.parse(str);

        // Grids
        grid = m.grid;
        paths = m.paths;
        // Important tiles
        exit = createVector(m.exit[0], m.exit[1]);
        spawnpoints = [];
        for (var i = 0; i < m.spawnpoints.length; i++) {
            var s = m.spawnpoints[i];
            spawnpoints.push(createVector(s[0], s[1]));
        }
        // Misc
        cols = m.cols;
        rows = m.rows;

        resizeFit();
    } catch (err) {}
}

// Recalculate pathfinding maps
// Algorithm from https://www.redblobgames.com/pathfinding/tower-defense/
function recalculate() {
    if (!exit) return;
    walkMap = getWalkMap();
    var frontier = [];
    var target = vts(exit);
    frontier.push(target);
    var cameFrom = {};
    cameFrom[target] = null;

    // Fill cameFrom and distance for every tile
    while (frontier.length !== 0) {
        var current = frontier.shift();
        var t = stv(current);
        var adj = neighbors(walkMap, t.x, t.y, true);

        for (var i = 0; i < adj.length; i++) {
            var next = adj[i];
            if (next in cameFrom) continue;
            frontier.push(next);
            cameFrom[next] = current;
        }
    }

    // Generate usable maps
    var newPaths = buildArray(cols, rows, 0);
    var keys = Object.keys(cameFrom);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var current = stv(key);

        // Generate path direction for every tile
        var val = cameFrom[key];
        if (val !== null) {
            // Subtract vectors to determine direction
            var next = stv(val);
            var dir = next.sub(current);
            // Fill tile with direction
            if (dir.x < 0) newPaths[current.x][current.y] = 1;
            if (dir.y < 0) newPaths[current.x][current.y] = 2;
            if (dir.x > 0) newPaths[current.x][current.y] = 3;
            if (dir.y > 0) newPaths[current.x][current.y] = 4;
        }
    }

    // Preserve old paths on path tiles
    for (var x = 0; x < cols; x++) {
        for (var y = 0; y < rows; y++) {
            if (grid[x][y] === 2) newPaths[x][y] = paths[x][y];
        }
    }

    paths = newPaths;
}

// Clear grid
function resetMap(tile) {
    grid = buildArray(cols, rows, tile);
    paths = buildArray(cols, rows, 0);

    exit = null;
    spawnpoints = [];
}

// Changes tile size to fit everything onscreen
function resizeFit() {
    var div = document.getElementById('sketch-holder');
    var ts1 = floor(div.offsetWidth / cols);
    var ts2 = floor(div.offsetHeight / rows);
    ts = Math.min(ts1, ts2);
    resizeCanvas(cols * ts, rows * ts, true);
    updateStatus();
}

// Resizes cols, rows, and canvas based on tile size
function resizeMax() {
    var div = document.getElementById('sketch-holder');
    cols = floor(div.offsetWidth / ts);
    rows = floor(div.offsetHeight / ts);
    resizeCanvas(cols * ts, rows * ts, true);
    updateStatus();
}

// Update map status display
function updateStatus() {
    document.getElementById('dim').innerHTML = 'Dimensions: ' + cols +
    'x' + rows;
}

// User drawing on map
function userDraw() {
    if (!mouseInMap()) return;
    var p = gridPos(mouseX, mouseY);
    var g = grid[p.x][p.y];
    switch (selected) {
        case 'down':
            if (g === 0 || g === 2) paths[p.x][p.y] = 4;
            break;
        case 'empty':
            grid[p.x][p.y] = 0;
            break;
        case 'exit':
            exit = createVector(p.x, p.y);
            grid[p.x][p.y] = 0;
            paths[p.x][p.y] = 0;
            break;
        case 'left':
            if (g === 0 || g === 2) paths[p.x][p.y] = 1;
            break;
        case 'none':
            paths[p.x][p.y] = 0;
            break;
        case 'path':
            grid[p.x][p.y] = 2;
            break;
        case 'right':
            if (g === 0 || g === 2) paths[p.x][p.y] = 3;
            break;
        case 'spawn':
            var s = createVector(p.x, p.y);
            for (var i = 0; i < spawnpoints.length; i++) {
                if (s.equals(spawnpoints[i])) return;
            }
            spawnpoints.push(s);
            if (!walkable(p.x, p.y)) grid[p.x][p.y] = 0;
            break;
        case 'tower':
            grid[p.x][p.y] = 3;
            paths[p.x][p.y] = 0;
            break;
        case 'up':
            if (g === 0 || g === 2) paths[p.x][p.y] = 2;
            break;
        case 'wall':
            grid[p.x][p.y] = 1;
            paths[p.x][p.y] = 0;
            break;
    }
}

// Return whether tile is walkable
function walkable(col, row) {
    // Check if empty or path tile
    return grid[col][row] === 0 || grid[col][row] === 2;
}


// Main p5 functions

function setup() {
    var div = document.getElementById('sketch-holder');
    var canvas = createCanvas(div.offsetWidth, div.offsetHeight);
    canvas.parent('sketch-holder');
    resizeMax();
    resetMap(0);
}

function draw() {
    // Draw basic tiles
    for (var x = 0; x < cols; x++) {
        for (var y = 0; y < rows; y++) {
            stroke(0, 63);
            var t = grid[x][y];
            fill([
                [255, 255, 255],
                [108, 122, 137],
                [191, 85, 236],
                [25, 181, 254]
            ][t]);
            rect(x * ts, y * ts, ts, ts);
        }
    }

    // Draw spawnpoints
    for (var i = 0; i < spawnpoints.length; i++) {
        stroke(0);
        fill(0, 230, 64);
        var s = spawnpoints[i];
        rect(s.x * ts, s.y * ts, ts, ts);
    }

    // Draw exit
    if (exit) {
        stroke(0);
        fill(207, 0, 15);
        rect(exit.x * ts, exit.y * ts, ts, ts);
    }

    // Draw paths
    for (var x = 0; x < cols; x++) {
        for (var y = 0; y < rows; y++) {
            var d = paths[x][y];
            if (d === 0) continue;
            push();
            var c = center(x, y);
            translate(c.x, c.y);
            rotate([0, PI / 2, PI, PI * 3 / 2][d - 1]);
            arrow();
            pop();
        }
    }
}


// User input

function keyPressed() {
    switch (keyCode) {
        case 37:
            // Left arrow
            selected = 'left';
            break;
        case 38:
            // Up arrow
            selected = 'up';
            break;
        case 39:
            // Right arrow
            selected = 'right';
            break;
        case 40:
            // Down arrow
            selected = 'down';
            break;
        case 48:
            // 0
            selected = 'none';
            break;
        case 49:
            // 1
            selected = 'empty';
            break;
        case 50:
            // 2
            selected = 'wall';
            break;
        case 51:
            // 3
            selected = 'path';
            break;
        case 52:
            // 4
            selected = 'tower';
            break;
        case 53:
            // 5
            selected = 'spawn';
            break;
        case 54:
            // 6
            selected = 'exit';
            break;
        case 77:
            // M
            importMap(prompt('Input map string:'));
            break;
        case 80:
            // P
            recalculate();
            break;
        case 81:
            // Q
            paths = buildArray(cols, rows, 0);
            break;
        case 82:
            // R
            resetMap(0);
            break;
        case 83:
            // S
            spawnpoints = [];
            break;
        case 84:
            // T
            resetMap(3);
            break;
        case 87:
            // W
            resetMap(1);
            break;
        case 88:
            // X
            copyToClipboard(exportMap());
            break;
        case 90:
            // Z
            ts = zoomDefault;
            resizeMax();
            resetMap(0);
            break;
        case 219:
            // Left bracket
            if (keyIsDown(SHIFT)) {
                if (rows > 1) {
                    rows--;
                    resizeFit();
                    resetMap(0);
                }
            } else {
                if (cols > 1) {
                    cols--;
                    resizeFit();
                    resetMap(0);
                }
            }
            break;
        case 221:
            // Right bracket
            if (keyIsDown(SHIFT)) {
                rows++;
            } else {
                cols++;
            }
            resizeFit();
            resetMap(0);
            break;
    }
}

function mouseDragged() {
    userDraw();
}

function mousePressed() {
    userDraw();
}
