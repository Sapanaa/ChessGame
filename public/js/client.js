const socket = io();
const chess = new Chess();
const boardElement = document.querySelector("#chessboard");
const turnIndicator = document.getElementById("turn-indicator");


let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );
            // Add dataset attributes for row and column
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            // Add dragover and drop listeners to all squares
            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece && sourceSquare) {
                    // Ensure target is a square element
                    let targetElement = e.target;
                    if (targetElement.classList.contains("piece")) {
                        targetElement = targetElement.parentElement;
                    }
                    const targetSource = {
                        row: parseInt(targetElement.dataset.row),
                        col: parseInt(targetElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSource);
                }
            });

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerHTML = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            boardElement.appendChild(squareElement);
        });
    });

    if(playerRole === "b"){
        boardElement.classList.add("flip");

    }
    
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q", // Consider adding a UI for promotion selection
    };

    // Validate move locally before sending to server
    const result = chess.move(move, { dry_run: true }); // Check if move is legal without applying it
    if (result) {
        socket.emit("move", move);
    } else {
        console.log("Invalid move:", move);
        // Optionally notify user of invalid move
        alert("Invalid move!");
    }
};

const getPieceUnicode = (piece) => {
    const pieces = {
        p: "♟",
        r: "♜",
        n: "♞",
        b: "♝",
        q: "♛",
        k: "♚",
        P: "♙",
        R: "♖",
        N: "♘",
        B: "♗",
        Q: "♕",
        K: "♔",
    };
    return pieces[piece.type] || "";
};

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

socket.on("invalidMove", (move) => {
    console.log("Invalid move received from server:", move);
    alert("Invalid move! Please try again.");
});

socket.on("moveError", (message) => {
    console.log("Move error:", message);
    alert(message);
});

renderBoard();