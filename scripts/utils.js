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

// Return grid coordinate
function gridPos(x, y) {
    return createVector(floor(x / ts), floor(y / ts));
}

function mouseInMap() {
    return between(mouseX, 0, width) && between(mouseY, 0, height);
}
