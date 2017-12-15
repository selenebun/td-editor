// Check if number falls within range
function between(num, min, max) {
    return num > Math.min(min, max) && num < Math.max(min, max);
}

// Build 2d array of value
function buildArray(cols, rows, val) {
    var arr = [];
    for (var x = 0; x < cols; x++) {
        arr[x] = [];
        for (var y = 0; y < rows; y++) {
            arr[x][y] = val;
        }
    }
    return arr;
}

// Return position at center of tile
function center(col, row) {
    return createVector(col*ts + ts/2, row*ts + ts/2);
}

// Convert grid coordinates to string
function cts(col, row) {
    return col + ',' + row;
}

// Return grid coordinate
function gridPos(x, y) {
    return createVector(floor(x / ts), floor(y / ts));
}

function mouseInMap() {
    return between(mouseX, 0, width) && between(mouseY, 0, height);
}

// Return orthogonal neighbors of a certain value
function neighbors(grid, col, row, val) {
    var neighbors = [];
    if (col !== 0 && grid[col - 1][row] === val) {
        neighbors.push(cts(col - 1, row));
    }
    if (row !== 0 && grid[col][row - 1] === val) {
        neighbors.push(cts(col, row - 1));
    }
    if (col !== grid.length - 1 && grid[col + 1][row] === val) {
        neighbors.push(cts(col + 1, row));
    }
    if (row !== grid[col].length - 1 && grid[col][row + 1] === val) {
        neighbors.push(cts(col, row + 1));
    }
    return neighbors;
}

// Convert string to vector
function stv(str) {
    var arr = str.split(',');
    return createVector(parseInt(arr[0]), parseInt(arr[1]));
}

// Convert vector to string
function vts(v) {
    return v.x + ',' + v.y;
}
