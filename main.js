"use strict";
/*
Tehtävää:
- mahdollisuus ladata uusi kuva
    - mahdollisuus säätää palojen määrää sivulla
- viimeinen pala voisi ilmestyä kun palapeli on valmis
- pitää skaalautua jos on suurempi alue kuin kuva
- kuva ei saa venyä
 */
const sideLength = 5;
const tileWidthPixels = 100;
const tileBorderWidthPixels = 4;
let puzzleCompleted = false;
let naturalImageDimensions = null;
let imageDimensions = null;
let tiles = null;
window.onload = initializeDocument;

function initializeDocument() {
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("tile")) {
            if (!puzzleCompleted) {
                tileClickHandler(event);
            } else {
                console.log("Game is over. Clicking tile does nothing.");
            }
        }
        if (event.target.getAttribute("id") === "shuffle-button") {
            if (puzzleCompleted) {
                puzzleCompleted = false;
                updateGameEndedInfo();
            }
            assignTilesRandomPositionsInGrid(tiles, sideLength);
            for (let tile of tiles) {
                moveTileElement(tile);
            }
            //drawTiles(tiles);
        }
    });

    document.getElementById("image-select").onchange = imageSelectChangeHandler;

    // Set the first option as the selected image.
    const imageSelect = document.getElementById("image-select");
    const defaultImageFileName = imageSelect.options[0].getAttribute("data-file");
    setHiddenImageElementSource(defaultImageFileName);
    preparePuzzle();
}

function imageSelectChangeHandler(event){
    puzzleCompleted = false;
    const selectElement = event.target;
    const selectedOptionElement = selectElement.options[selectElement.selectedIndex];
    console.assert(selectedOptionElement !== undefined && selectedOptionElement !== null);
    const imageFileName = selectedOptionElement.getAttribute("data-file");
    setHiddenImageElementSource(imageFileName);
    //const imageDisplayName = selectedOptionElement.innerText;
    //console.log("imageDisplayName:", imageDisplayName);
    //document.getElementById("image-name-div").innerText = imageDisplayName;
    preparePuzzle();
}

function tileClickHandler(event){
    const tileElement = event.target;
    const tile = tiles.find(tile => tile.id === tileElement.getAttribute("id"));
    console.assert(tile !== undefined);
    const tileMovementDecision = getTileMovementPlace(tile);
    if(tileMovementDecision.shouldMove){
        tile.row = tileMovementDecision.row;
        tile.col = tileMovementDecision.col;
        moveTileElement(tile);
        if(isPuzzleCompleted()){
            puzzleCompleted = true;
            updateGameEndedInfo();
        }
    }else{
        console.log("Can't move this tile.");
    }
}

function setHiddenImageElementSource(imageFileName){
    document.getElementById("hidden-image").setAttribute("src", imageFileName);
}

/*
    Pre-condition: there is image in the hidden-image
 */
function preparePuzzle(){
    // First delete existing tile elements.
    document.getElementById("puzzle-area").innerHTML = "";
    naturalImageDimensions = getNaturalImageDimensions();
    //console.log("naturalImageDimensions:", naturalImageDimensions);
    imageDimensions = getAdjustedImageDimensions(naturalImageDimensions);
    //console.log("imageDimensions:", imageDimensions);
    tiles = createTiles(sideLength);
    //console.log("tiles:", tiles.length);
    assignTilesRandomPositionsInGrid(tiles, sideLength);
    //console.log("tiles:", tiles);
    drawTiles(tiles, imageDimensions, getSelectedImageFileName());
    setPuzzleAreaSize();
}

function getSelectedImageFileName(){
    const fileName = document.getElementById("hidden-image").getAttribute("src");
    //log("fileName:", fileName);
    return fileName;
}

/*
    Pre-condition: naturalDimensions has width and height.
    // TODO: mahdollisuus vaihtaa määrääkö lyhin vai pisin sivu kuvan koon.
 */
function getAdjustedImageDimensions(naturalDimensions){
    const naturalWidth = naturalDimensions.width;
    const naturalHeight = naturalDimensions.height;
    let desiredWidth = null;
    let desiredHeight = null;
    if(naturalWidth < naturalHeight){
        desiredWidth = sideLength * tileWidthPixels;
        const scale = desiredWidth / naturalWidth;
        desiredHeight = naturalHeight * scale;
    }else{
        desiredHeight = sideLength * tileWidthPixels;
        const scale = desiredHeight / naturalHeight;
        desiredWidth = naturalWidth * scale;
    }
    return {width: desiredWidth, height: desiredHeight};
}

function getNaturalImageDimensions(){
    const hiddenImage = document.getElementById("hidden-image");
    const imageWidth = hiddenImage.naturalWidth;
    const imageHeight = hiddenImage.naturalHeight;
    return {height: imageHeight, width: imageWidth};
}

function updateGameEndedInfo(){
    const completedIcon = document.getElementById("completed-icon");
    if(puzzleCompleted) {
        completedIcon.style.display = "inline-block";
        document.body.style.backgroundColor = "lightgreen"
    }else{
        completedIcon.style.display = "none";
        document.body.style.backgroundColor = "";
    }
}

function setPuzzleAreaSize(){
    const puzzleArea = document.getElementById("puzzle-area");
    const width = sideLength * (tileWidthPixels + tileBorderWidthPixels) + tileBorderWidthPixels;
    const widthString = width+"px";
    puzzleArea.style.width = widthString;
    puzzleArea.style.height = widthString; // It's a square.
}

/*
    For initial drawing.
    Pre-condition: imageDimensions has width and height.
 */
function drawTiles(tiles, imageDimensions, selectedImageFileName){
    const puzzleAreaElement = document.getElementById("puzzle-area");
    tiles.forEach(function(tile){
        const tileElement = document.createElement("div");
        tileElement.id = tile.id;
        tileElement.classList.add("tile");
        //tileElement.textContent = tile.image;
        //tileElement.setAttribute("src", "square.jpg");
        tileElement.style.backgroundImage = "url("+selectedImageFileName+")";
        const imageSizeValue = imageDimensions.width+"px "+imageDimensions.height+"px";
        tileElement.style.backgroundSize = imageSizeValue; //"100px 100px";
        const puzzleImageXOffset = -1 * (tile.correctCol * tileWidthPixels);
        const puzzleImageYOffset = -1 * (tile.correctRow * tileWidthPixels);
        const backgroundPositionValue = puzzleImageXOffset+"px "+puzzleImageYOffset+"px";
        tileElement.style.backgroundPosition = backgroundPositionValue;
        puzzleAreaElement.appendChild(tileElement);
    });
    tiles.forEach(function(tile){
        moveTileElement(tile);
    });
}

/*
Mitä käytetään ruudukkona? css grid (ei animoitava tn.)? canvas? table? absoluuttinen sijainti?
 */
function moveTileElement(tile){
    //document.getElementById("testTile").style.backgroundColor = "blue";
    const coordinates = getCoordinatesByRowAndCol(tile.row, tile.col);
    const tileElement = document.getElementById(tile.id);
    tileElement.style.left = coordinates.x+"px";
    tileElement.style.top = coordinates.y+"px";
    tileElement.style.height = tileWidthPixels+"px";
    tileElement.style.width = tileWidthPixels+"px";
    //tileElement.style.right = (coordinates.x + tileWidthPixels) + "px";
    //tileElement.style.bottom = (coordinates.y + tileWidthPixels) + "px";
}

function getCoordinatesByRowAndCol(row, col){
    const tileWidthWithBorders = tileWidthPixels + tileBorderWidthPixels;
    return {
        x: (tileWidthWithBorders * col) + tileBorderWidthPixels,
        y: (tileWidthWithBorders * row) + tileBorderWidthPixels
    };
}

function createTiles(sideLength){
    const tiles = [];
    const emptyX = sideLength-1;
    const emptyY = sideLength-1;
    let idCounter = 0;
    for(let i = 0; i < sideLength; i++){
        for(let j = 0; j < sideLength; j++){
            if( (i === emptyX && j === emptyY) === false ){
                const tile = new Tile(idCounter, i, j, "placeholder"+idCounter+".png");
                tiles.push(tile);
                idCounter += 1;
            }
        }
    }
    return tiles;
}

// TODO: miksi mikään ei saa koskaan riviä 2 ja saraketta 1?
function assignTilesRandomPositionsInGrid(tiles, sideLength){
    const shallowCopy = tiles.slice();
    shuffleInPlace(shallowCopy);
    let tileIndex = 0;
    for(let i = 0; i < sideLength; i++){
        for(let j = 0; j < sideLength; j++){
            if(tileIndex === shallowCopy.length) {
                continue;
            }else {
                shallowCopy[tileIndex].row = i;
                shallowCopy[tileIndex].col = j;
                tileIndex += 1;
            }
        }
    }
}

/*
    Copy pasted from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 */
function shuffleInPlace(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

/*
    Pre-condition: tile is Tile.
    Returns an object: {shouldMove: boolean, row: int or null, col: int or null}
 */
function getTileMovementPlace(tile){
    const neighborPositions = [
        {col: tile.col-1, row: tile.row},
        {col: tile.col+1, row: tile.row},
        {col: tile.col, row: tile.row-1},
        {col: tile.col, row: tile.row+1},
    ]; // Of course not all of these are necessarily valid positions.
    const emptyTilePosition = getEmptyLocation();
    for(let neighborPosition of neighborPositions){
        if(emptyTilePosition.row === neighborPosition.row && emptyTilePosition.col === neighborPosition.col){
            return {shouldMove: true, row: emptyTilePosition.row, col: emptyTilePosition.col};
        }
    }
    return {shouldMove: false, row: null, col: null};
}

/*
    Returns {col: int, row: int}
 */
function getEmptyLocation(){
    const matrix = []; // 2d array where a boolean indicates if a slot has tile or is empty.
    for(let i = 0; i < sideLength; i++){
        const row = [];
        for(let j = 0; j < sideLength; j++){
            row.push(false);
        }
        matrix.push(row);
    }
    for(let tile of tiles){
        const row = tile.row;
        const col = tile.col;
        matrix[row][col] = true;
    }
    let emptyLocation = null;
    for(let row = 0; row < matrix.length; row++){
        for(let col = 0; col < matrix[row].length; col++){
            if(matrix[row][col] === false){
                if(emptyLocation === null){
                    emptyLocation = {row: row, col: col};
                }else{
                    console.assert(false);
                }
            }
        }
    }
    console.assert(emptyLocation !== null);
    return emptyLocation;
}

function isPuzzleCompleted(){
    return tiles.every(tile => tile.correctRow === tile.row && tile.correctCol === tile.col);
}

function Tile(id, correctRow, correctCol, image){
    this.correctRow = correctRow;
    this.correctCol = correctCol;
    this.row = null;
    this.col = null;
    this.image = image; // string
    this.id = "tile"+id; // string
}


/*
const completionMatrix = createCompletionMatrix(sideLength);

function createCompletionMatrix(sideLength){
    const matrix = [];
    for(let i = 0; i < sideLength; i++){
        const row = [];
        for(let j = 0; j < sideLength; j++){
            row.push(j);
        }
        matrix.push(row);
    }
    matrix[sideLength-1][sideLength-1] = null;
    return matrix;
}*/