document.addEventListener('DOMContentLoaded', () => {
    // Lấy các phần tử từ DOM
    const gameBoardElement = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const resetButton = document.getElementById('reset-button');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const tryAgainButton = document.getElementById('try-again-button');
    const gameContainer = document.getElementById('game-container');

    const BOARD_SIZE = 4;
    let board = [];
    let score = 0;

    // Bảng màu cho các giá trị ô khác nhau
    const tileColors = {
        2: 'bg-yellow-100 text-gray-800',
        4: 'bg-yellow-200 text-gray-800',
        8: 'bg-orange-300 text-white',
        16: 'bg-orange-400 text-white',
        32: 'bg-red-400 text-white',
        64: 'bg-red-500 text-white',
        128: 'bg-yellow-400 text-white',
        256: 'bg-yellow-500 text-white',
        512: 'bg-yellow-600 text-white',
        1024: 'bg-indigo-500 text-white',
        2048: 'bg-indigo-700 text-white',
        4096: 'bg-purple-700 text-white',
        8192: 'bg-purple-900 text-white',
    };

    // Hàm khởi tạo game
    function initGame() {
        score = 0;
        board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
        gameOverOverlay.classList.add('hidden');
        gameOverOverlay.classList.remove('flex');
        addRandomTile();
        addRandomTile();
        renderBoard();
    }

    // Hàm vẽ lại bảng game dựa trên mảng `board`
    function renderBoard() {
        gameBoardElement.innerHTML = '';
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const tileValue = board[r][c];
                const tileWrapper = document.createElement('div');
                tileWrapper.className = 'w-full h-full bg-gray-600 rounded-md';

                if (tileValue !== 0) {
                    const tileElement = document.createElement('div');
                    const colorClass = tileColors[tileValue] || 'bg-gray-200 text-black';
                    tileElement.className = `tile w-full h-full rounded-md flex items-center justify-center text-2xl sm:text-3xl font-bold ${colorClass}`;
                    tileElement.textContent = tileValue;
                    tileWrapper.appendChild(tileElement);
                }
                gameBoardElement.appendChild(tileWrapper);
            }
        }
        scoreElement.textContent = score;
    }

    // Hàm thêm một ô ngẫu nhiên (2 hoặc 4) vào một vị trí trống
    function addRandomTile() {
        const emptyTiles = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] === 0) {
                    emptyTiles.push({ r, c });
                }
            }
        }

        if (emptyTiles.length > 0) {
            const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
            board[r][c] = Math.random() < 0.9 ? 2 : 4; // 90% ra ô 2, 10% ra ô 4
        }
    }

    // Hàm xử lý di chuyển và gộp các ô
    function handleMove(key) {
        let moved = false;
        let originalBoard = JSON.parse(JSON.stringify(board)); // Tạo bản sao sâu

        if (key === 'ArrowUp' || key === 'w') {
            board = transpose(board);
            board = moveAndMerge(board);
            board = transpose(board);
        } else if (key === 'ArrowDown' || key === 's') {
            board = transpose(board);
            board = reverseRows(board);
            board = moveAndMerge(board);
            board = reverseRows(board);
            board = transpose(board);
        } else if (key === 'ArrowLeft' || key === 'a') {
            board = moveAndMerge(board);
        } else if (key === 'ArrowRight' || key === 'd') {
            board = reverseRows(board);
            board = moveAndMerge(board);
            board = reverseRows(board);
        }
        
        // Kiểm tra xem bảng có thay đổi không
        moved = JSON.stringify(originalBoard) !== JSON.stringify(board);

        if (moved) {
            addRandomTile();
            renderBoard();
            checkGameOver();
        }
    }
    
    // Hàm trượt và gộp các ô về bên trái
    function moveAndMerge(currentBoard) {
        const newBoard = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            let row = currentBoard[r].filter(val => val !== 0); // Bỏ các ô 0
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i + 1]) {
                    row[i] *= 2;
                    score += row[i]; // Cập nhật điểm
                    row.splice(i + 1, 1); // Xóa ô đã gộp
                }
            }
            // Thêm các ô 0 vào cuối để đủ kích thước
            while (row.length < BOARD_SIZE) {
                row.push(0);
            }
            newBoard.push(row);
        }
        return newBoard;
    }

    // Hàm đảo ngược các hàng (dùng cho di chuyển sang phải và xuống)
    function reverseRows(currentBoard) {
        return currentBoard.map(row => row.slice().reverse());
    }

    // Hàm chuyển vị ma trận (đổi hàng thành cột và ngược lại, dùng cho di chuyển lên/xuống)
    function transpose(currentBoard) {
        const newBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                newBoard[c][r] = currentBoard[r][c];
            }
        }
        return newBoard;
    }

    // Hàm kiểm tra xem game đã kết thúc chưa
    function checkGameOver() {
        if (!canMove()) {
            gameOverOverlay.classList.remove('hidden');
            gameOverOverlay.classList.add('flex');
            saveScoreToDatabase(score); 

        }
    }

    // Hàm kiểm tra xem còn nước đi nào hợp lệ không
    function canMove() {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] === 0) return true; // Còn ô trống
                // Kiểm tra ô bên phải
                if (c < BOARD_SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
                // Kiểm tra ô bên dưới
                if (r < BOARD_SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
            }
        }
        return false; // Không còn nước đi
    }

    // Lắng nghe sự kiện bàn phím
    document.addEventListener('keydown', (e) => {
        handleMove(e.key);
    });

    // Lắng nghe sự kiện nút bấm
    resetButton.addEventListener('click', initGame);
    tryAgainButton.addEventListener('click', initGame);

    // Xử lý thao tác vuốt trên màn hình cảm ứng
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    gameContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    });

    gameContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    });
    
    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const minSwipeDistance = 50; // Khoảng cách vuốt tối thiểu

        if (Math.abs(deltaX) > Math.abs(deltaY)) { // Vuốt ngang
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    handleMove('ArrowRight');
                } else {
                    handleMove('ArrowLeft');
                }
            }
        } else { // Vuốt dọc
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    handleMove('ArrowDown');
                } else {
                    handleMove('ArrowUp');
                }
            }
        }
    }

    // Bắt đầu game
    initGame();
});


// Hàm gửi điểm số đến backend

async function saveScoreToDatabase(finalScore) {
    // Lấy tên người dùng đã đăng nhập từ localStorage
    const username = localStorage.getItem('2048-currentUser');

    // Nếu không có người dùng đăng nhập thì không làm gì cả
    if (!username) {
        console.log("Không có người dùng đăng nhập, không thể lưu điểm.");
        return;
    }

    console.log(`Đang gửi điểm: ${finalScore} cho người dùng: ${username}`);

    try {
        // Gửi yêu cầu đến backend của bạn
        // URL 'http://localhost:3000/api/save-score' là địa chỉ của backend bạn sẽ tạo ở bước 2
        const response = await fetch('http://localhost:3000/api/save-score', {
            method: 'POST', // Phương thức gửi dữ liệu
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ // Dữ liệu gửi đi
                username: username,
                score: finalScore
            }),
        });

        const result = await response.json();
        console.log('Phản hồi từ server:', result.message);

    } catch (error) {
        console.error('Lỗi khi gửi điểm:', error);
    }
}