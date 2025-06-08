// --- 0. 预设规则数据 ---
// 这部分代码不依赖页面元素，可以放在最外面
const PRESET_RULES = [
    { name: "康威经典 (B3/S23)", birth: "3", survival: "2,3" },
    { name: "HighLife (B36/S23)", birth: "3,6", survival: "2,3" },
    { name: "Morley (B368/S245)", birth: "3,6,8", survival: "2,4,5" },
    { name: "Day & Night (B3678/S34678)", birth: "3,6,7,8", survival: "3,4,6,7,8" },
    { name: "Assimilation (B345/S4567)", birth: "3,4,5", survival: "4,5,6,7" },
    { name: "Diamoeba (B35678/S5678)", birth: "3,5,6,7,8", survival: "5,6,7,8" },
    { name: "2x2 (B36/S125)", birth: "3,6", survival: "1,2,5" },
    { name: "Seeds (B2/S)", birth: "2", survival: "" },
    { name: "Serviettes (B234/S)", birth: "2,3,4", survival: "" },
    { name: "自定义...", birth: "", survival: "" }
];

// --- [修正] 使用 DOMContentLoaded 来确保所有元素都已加载 ---
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. 获取 DOM 元素 & 初始化变量 ---
    const canvas = document.getElementById('game-canvas');
    // 下面这行就是之前报错的地方，现在它在安全的环境里运行
    const ctx = canvas.getContext('2d'); 
    const startPauseButton = document.getElementById('start-pause-button');
    const randomizeButton = document.getElementById('randomize-button');
    const clearButton = document.getElementById('clear-button');
    const ruleSelect = document.getElementById('rule-select');
    const survivalRulesInput = document.getElementById('survival-rules');
    const birthRulesInput = document.getElementById('birth-rules');
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');

    const resolution = 8;
    canvas.width = 800;
    canvas.height = 640;

    const COLS = canvas.width / resolution;
    const ROWS = canvas.height / resolution;

    let grid = buildEmptyGrid();
    let animationId = null;
    let isRunning = false;

    let evolutionInterval = parseInt(speedSlider.value);
    let lastUpdateTime = 0;

    // --- 2. 核心功能函数 ---
    function buildRandomGrid() { return new Array(COLS).fill(null).map(() => new Array(ROWS).fill(0).map(() => Math.floor(Math.random() * 2))); }
    function buildEmptyGrid() { return new Array(COLS).fill(0).map(() => new Array(ROWS).fill(0)); }
    function drawGrid(grid) { ctx.clearRect(0, 0, canvas.width, canvas.height); for (let col = 0; col < COLS; col++) { for (let row = 0; row < ROWS; row++) { const cell = grid[col][row]; ctx.beginPath(); ctx.rect(col * resolution, row * resolution, resolution, resolution); ctx.fillStyle = cell ? '#2c3e50' : 'white'; ctx.fill(); if (resolution > 4) { ctx.strokeStyle = '#ecf0f1'; ctx.stroke(); } } } }
    function nextGen(survivalRules, birthRules) { const nextGrid = grid.map(arr => [...arr]); for (let col = 0; col < COLS; col++) { for (let row = 0; row < ROWS; row++) { const cell = grid[col][row]; let numNeighbors = 0; for (let i = -1; i < 2; i++) { for (let j = -1; j < 2; j++) { if (i === 0 && j === 0) continue; const x_cell = col + i; const y_cell = row + j; if (x_cell >= 0 && y_cell >= 0 && x_cell < COLS && y_cell < ROWS) { numNeighbors += grid[x_cell][y_cell]; } } } if (cell === 1) { if (!survivalRules.includes(numNeighbors)) nextGrid[col][row] = 0; } else { if (birthRules.includes(numNeighbors)) nextGrid[col][row] = 1; } } } return nextGrid; }
    function parseRules(ruleString) { return ruleString.split(',').map(s => s.trim()).filter(s => s !== '').map(Number); }
    
    function update(currentTime) {
        animationId = requestAnimationFrame(update);
        const deltaTime = currentTime - lastUpdateTime;
        if (deltaTime > evolutionInterval) {
            lastUpdateTime = currentTime - (deltaTime % evolutionInterval);
            const survivalRules = parseRules(survivalRulesInput.value);
            const birthRules = parseRules(birthRulesInput.value);
            grid = nextGen(survivalRules, birthRules);
            drawGrid(grid);
        }
    }

    function stopSimulation() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        isRunning = false;
        startPauseButton.textContent = '开始';
    }

    // --- 3. 初始化与事件监听 ---
    function populateRuleSelector() { PRESET_RULES.forEach(rule => { const option = document.createElement('option'); option.value = rule.name; option.textContent = rule.name; ruleSelect.appendChild(option); }); }
    
    ruleSelect.addEventListener('change', (e) => { const selectedRuleName = e.target.value; const selectedRule = PRESET_RULES.find(rule => rule.name === selectedRuleName); if (selectedRule) { birthRulesInput.value = selectedRule.birth; survivalRulesInput.value = selectedRule.survival; } });
    
    speedSlider.addEventListener('input', (e) => {
        evolutionInterval = parseInt(e.target.value);
        speedValue.textContent = `${e.target.value} ms`;
    });
    
    startPauseButton.addEventListener('click', () => {
        if (isRunning) {
            stopSimulation();
        } else {
            isRunning = true;
            startPauseButton.textContent = '暂停';
            lastUpdateTime = performance.now();
            animationId = requestAnimationFrame(update);
        }
    });

    randomizeButton.addEventListener('click', () => { stopSimulation(); grid = buildRandomGrid(); drawGrid(grid); });
    clearButton.addEventListener('click', () => { stopSimulation(); grid = buildEmptyGrid(); drawGrid(grid); });
    
    canvas.addEventListener('click', (event) => {
        stopSimulation();
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const col = Math.floor(mouseX / resolution);
        const row = Math.floor(mouseY / resolution);
        if (col >= 0 && row >= 0 && col < COLS && row < ROWS) {
            grid[col][row] = 1 - grid[col][row];
        }
        drawGrid(grid);
    });

    // --- 4. 页面加载后执行 ---
    populateRuleSelector();
    ruleSelect.dispatchEvent(new Event('change'));
    drawGrid(grid);

});