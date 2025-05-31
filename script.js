const boardElement = document.getElementById('game-board');
const messageElement = document.getElementById('message');
const playAgainButton = document.getElementById('play-again-button');
const levelDisplayElement = document.getElementById('level-display'); // Contenedor del título del nivel
const referenceImageElement = document.getElementById('reference-image'); // Para la imagen de referencia

const gridSize = 3;
const TILE_SIZE_PX = 80;

let board = [];
let emptyTile = { row: 0, col: 0 };
let gameOver = false;
let currentLevel = 0;

// --- NUEVO: Títulos para cada nivel ---
const levelTitles = [
    "Cenicienta y su feliz vida con el mermeladero.",
    "Una de las hermanastras con \"más cara de cerdo\", tirando disimuladamente el zapato de cristal por el retrete.",
    "La madre de Juan, furiosa, golpeando a Juan con la manguera de la aspiradora tras ver la habichuela.", // Asumiendo "habichuela"
    "Un gigante enorme y quizás \"horrendo\" o \"hecho un borrico\", asomando desde lo alto de la habichuela mágica y gritando \"¡ESTOY OLIENDO A CARNE HUMANA!\"",
    "La Reina Obdulia Carrasclás, con gesto de furia o barahúnda, consultando su Espejo Mágico Parlante con marco de latón.",
    "Blancanieves (\"chica lista\") entrando a hurtadillas en Palacio para robar el Espejo Parlanchín.",
    "Rizos de Oro, descrita como \"malvada niña\" o \"delincuente juvenil\", rompiendo violentamente la silla isabelina del oso niño al sentarse en ella con su \"trasero gordinflón\"",
    "Los zapatos sucios y quizás con barro o algo peor, de Rizos de Oro, manchando el edredón de la cama de los osos mientras duerme.",
    "Juan y el merecido baño de oro.",
    "Caperucita Roja sacando un revólver de su corsé, apuntando al Lobo con calma.",
    "El Lobo queriendo dinamitar la casa del ultimo cerdito y el cerdito llamando a caperucita",
    "Caperucita Roja (quizás con su revólver o incluso con un maletín \"hecho con la mejor... ¡PIEL DE MARRANO!\")"
];

// --- Actualizado para 12 NIVELES ---
const levelImages = [
    'level1_image.png', 'level2_image.png', 'level3_image.png',
    'level4_image.png', 'level5_image.png', 'level6_image.png',
    'level7_image.png', 'level8_image.png', 'level9_image.png',
    'level10_image.png', 'level11_image.png', 'level12_image.png'
];

const moveSound = new Audio('move.wav');
const winSound = new Audio('win.wav');
moveSound.volume = 0.7;
winSound.volume = 0.7;

const levelConfigurations = [
    [1, 2, 3, 4, 5, 6, 0, 7, 8], // Nivel 1
    [1, 0, 3, 4, 2, 5, 7, 8, 6], // Nivel 2
    [7, 1, 3, 0, 4, 5, 2, 8, 6], // Nivel 3
    [4, 1, 2, 0, 8, 5, 7, 6, 3], // Nivel 4
    [2, 5, 3, 1, 0, 6, 4, 7, 8], // Nivel 5
    [8, 7, 6, 5, 4, 3, 2, 1, 0], // Nivel 6
    [1, 4, 7, 2, 5, 8, 3, 0, 6], // Nivel 7
    [0, 3, 6, 1, 4, 7, 2, 5, 8], // Nivel 8
    [5, 4, 0, 2, 1, 3, 8, 7, 6], // Nivel 9
    [6, 2, 8, 4, 0, 1, 3, 7, 5], // Nivel 10
    [3, 6, 0, 2, 5, 8, 1, 4, 7], // Nivel 11
    [8, 5, 2, 7, 4, 1, 0, 3, 6]  // Nivel 12
];
const maxLevels = levelConfigurations.length;

const solvedBoardPattern = [];
for (let i = 0; i < gridSize * gridSize - 1; i++) {
    solvedBoardPattern.push(i + 1);
}
solvedBoardPattern.push(0);

function preloadSounds() {
    moveSound.load();
    winSound.load();
}
preloadSounds();

function initGame() {
    gameOver = false;
    messageElement.textContent = "";
    // --- Actualizar título del nivel ---
    if (levelTitles[currentLevel]) {
        levelDisplayElement.textContent = `Nivel ${currentLevel + 1}: ${levelTitles[currentLevel]}`;
    } else {
        levelDisplayElement.textContent = `Nivel ${currentLevel + 1}`; // Fallback si no hay título
    }

    boardElement.style.gridTemplateColumns = `repeat(${gridSize}, ${TILE_SIZE_PX}px)`;
    boardElement.style.gridTemplateRows = `repeat(${gridSize}, ${TILE_SIZE_PX}px)`;
    boardElement.style.width = `${gridSize * TILE_SIZE_PX}px`;
    boardElement.style.height = `${gridSize * TILE_SIZE_PX}px`;

    const currentPuzzleImage = new Image(); // Para la imagen del puzzle
    currentPuzzleImage.onload = () => {
        board = [...levelConfigurations[currentLevel]];
        updateEmptyTilePosition();
        renderBoard();
    };
    currentPuzzleImage.onerror = () => {
        console.error(`Error al cargar la imagen del puzzle: ${levelImages[currentLevel]}`);
        messageElement.textContent = "Error al cargar imagen del puzzle. Usando números.";
        board = [...levelConfigurations[currentLevel]];
        updateEmptyTilePosition();
        renderBoard(true); // Fallback a números
    };

    // --- Cargar imagen de referencia y del puzzle ---
    if (levelImages[currentLevel]) {
        referenceImageElement.src = levelImages[currentLevel]; // Cargar imagen de referencia
        referenceImageElement.alt = `Referencia: ${levelTitles[currentLevel] || 'Nivel ' + (currentLevel + 1)}`;
        currentPuzzleImage.src = levelImages[currentLevel]; // Iniciar carga de imagen para el puzzle
    } else {
        console.error(`No hay imagen definida para el nivel ${currentLevel + 1}`);
        messageElement.textContent = "No hay imagen para este nivel. Usando números.";
        referenceImageElement.src = ""; // Limpiar imagen de referencia
        referenceImageElement.alt = "No hay imagen de referencia";
        board = [...levelConfigurations[currentLevel]]; // Cargar configuración de todas formas
        updateEmptyTilePosition();
        renderBoard(true); // Fallback a números
    }
}

function updateEmptyTilePosition() {
    const emptyIndex = board.indexOf(0);
    emptyTile.row = Math.floor(emptyIndex / gridSize);
    emptyTile.col = emptyIndex % gridSize;
}

function renderBoard(useNumbersFallback = false) {
    boardElement.innerHTML = '';
    const imageSrcForPuzzle = levelImages[currentLevel]; // Usar la imagen del nivel actual para el puzzle
    const boardTotalWidth = gridSize * TILE_SIZE_PX;
    const boardTotalHeight = gridSize * TILE_SIZE_PX;

    for (let i = 0; i < board.length; i++) {
        const tileValue = board[i];
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.style.width = `${TILE_SIZE_PX}px`;
        tile.style.height = `${TILE_SIZE_PX}px`;

        if (tileValue === 0) {
            tile.classList.add('empty');
        } else {
            if (!useNumbersFallback && imageSrcForPuzzle) {
                tile.style.backgroundImage = `url('${imageSrcForPuzzle}')`;
                tile.style.backgroundSize = `${boardTotalWidth}px ${boardTotalHeight}px`;

                const originalPieceIndex = tileValue - 1;
                const originalCol = originalPieceIndex % gridSize;
                const originalRow = Math.floor(originalPieceIndex / gridSize);

                const backgroundPosX = -(originalCol * TILE_SIZE_PX);
                const backgroundPosY = -(originalRow * TILE_SIZE_PX);
                tile.style.backgroundPosition = `${backgroundPosX}px ${backgroundPosY}px`;
            } else {
                tile.textContent = tileValue;
                tile.style.fontSize = `${TILE_SIZE_PX / 2.5}px`;
                tile.style.color = "#333";
            }

            if (!gameOver) {
                tile.addEventListener('click', () => handleTileClick(i));
            }
        }
        boardElement.appendChild(tile);
    }
}

function handleTileClick(clickedIndex) {
    if (gameOver) return;

    const clickedRow = Math.floor(clickedIndex / gridSize);
    const clickedCol = clickedIndex % gridSize;

    const isAdjacent =
        (Math.abs(clickedRow - emptyTile.row) === 1 && clickedCol === emptyTile.col) ||
        (Math.abs(clickedCol - emptyTile.col) === 1 && clickedRow === emptyTile.row);

    if (isAdjacent) {
        const emptyIndexInBoard = emptyTile.row * gridSize + emptyTile.col;
        board[emptyIndexInBoard] = board[clickedIndex];
        board[clickedIndex] = 0;

        moveSound.currentTime = 0;
        moveSound.play().catch(e => console.warn("Error al reproducir sonido de movimiento:", e));

        updateEmptyTilePosition();
        renderBoard();
        checkWin();
    }
}

function checkWin() {
    const isSolved = board.every((value, index) => value === solvedBoardPattern[index]);

    if (isSolved) {
        gameOver = true;
        renderBoard();

        winSound.currentTime = 0;
        winSound.play().catch(e => console.warn("Error al reproducir sonido de victoria:", e));

        if (currentLevel < maxLevels - 1) {
            messageElement.textContent = `¡Nivel ${currentLevel + 1} Superado! Cargando siguiente nivel...`;
            currentLevel++;
            setTimeout(initGame, 3000);
        } else {
            messageElement.textContent = "¡Felicidades! ¡Has completado TODOS los niveles!";
        }
    }
}

playAgainButton.addEventListener('click', () => {
    if (gameOver && currentLevel >= maxLevels - 1 && board.every((value, index) => value === solvedBoardPattern[index])) {
        currentLevel = 0;
    }
    moveSound.pause();
    winSound.pause();
    initGame();
});

initGame();