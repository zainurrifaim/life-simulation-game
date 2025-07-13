// --- INITIAL GAME STATE ---
const getInitialState = () => ({
    age: 5,
    intelligence: 10,
    health: 100,
    money: 20,
    fun: 50,
    relationships: 50,
    energy: 100,
    stage: 'Kindergarten',
    career: null,
    careerLevel: 0,
    hasMajored: false,
    flags: {}
});

let gameState = getInitialState();
let gameData = {};

// --- DOM ELEMENTS ---
const elements = {
    statsContainer: document.getElementById('stats'),
    actions: document.getElementById('action-buttons'),
    nextYearBtn: document.getElementById('nextYearBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    gameOverScreen: document.getElementById('game-over'),
    gameContainer: document.getElementById('game-container'),
    summary: document.getElementById('summary'),
    messageBox: document.getElementById('message-box'),
    stageImage: document.getElementById('stage-image'),
    stageName: document.getElementById('stage-name'),
};

// --- HELPER FUNCTIONS ---
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

function showMessage(text, type = 'info') {
    elements.messageBox.textContent = text;
    elements.messageBox.classList.remove('bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700', 'bg-gray-100', 'text-gray-700');
    
    if (type === 'error') {
        elements.messageBox.classList.add('bg-red-100', 'text-red-700');
    } else if (type === 'success') {
        elements.messageBox.classList.add('bg-green-100', 'text-green-700');
    } else {
         elements.messageBox.classList.add('bg-gray-100', 'text-gray-700');
    }
    elements.messageBox.style.opacity = '1';
    elements.messageBox.style.transform = 'translateY(0)';

    setTimeout(() => {
        elements.messageBox.style.opacity = '0';
        elements.messageBox.style.transform = 'translateY(-10px)';
    }, 3000);
}

// --- CORE GAME LOGIC ---

function setupStatDisplays() {
    const statConfig = [
        { name: 'Age', key: 'age', color: 'blue', isProgress: false },
        { name: 'Health', key: 'health', color: 'green', isProgress: true },
        { name: 'Fun', key: 'fun', color: 'pink', isProgress: true },
        { name: 'Intelligence', key: 'intelligence', color: 'purple', isProgress: true },
        { name: 'Relationships', key: 'relationships', color: 'red', isProgress: true },
        { name: 'Energy', key: 'energy', color: 'indigo', isProgress: true },
        { name: 'Money', key: 'money', color: 'yellow', isProgress: false },
    ];

    elements.statsContainer.innerHTML = '';

    statConfig.forEach(stat => {
        const valueId = `stat-${stat.key}`;
        const progressId = `progress-${stat.key}`;
        const statHTML = `
            <div id="container-${stat.key}" class="bg-${stat.color}-50 p-3 rounded-lg transition-all duration-500">
                <div class="flex justify-between items-center mb-1">
                    <div class="text-sm font-medium text-${stat.color}-600">${stat.name}</div>
                    <div id="${valueId}" class="text-lg font-bold text-${stat.color}-800"></div>
                </div>
                ${stat.isProgress ? `
                <div class="progress-bar-container">
                    <div id="${progressId}" class="progress-bar bg-${stat.color}-400"></div>
                </div>
                ` : ''}
            </div>
        `;
        elements.statsContainer.innerHTML += statHTML;
    });
}

function updateDisplay() {
    // Clamp values before displaying
    gameState.health = clamp(gameState.health, 0, 100);
    gameState.intelligence = clamp(gameState.intelligence, 0, 100);
    gameState.fun = clamp(gameState.fun, 0, 100);
    gameState.relationships = clamp(gameState.relationships, 0, 100);
    gameState.energy = clamp(gameState.energy, 0, 100);
    gameState.money = Math.max(0, gameState.money);

    // Update text and progress bars
    document.getElementById('stat-age').textContent = gameState.age;
    document.getElementById('stat-money').textContent = `$${gameState.money}`;

    ['health', 'fun', 'intelligence', 'relationships', 'energy'].forEach(key => {
        document.getElementById(`stat-${key}`).textContent = gameState[key];
        const progressBar = document.getElementById(`progress-${key}`);
        if (progressBar) {
            progressBar.style.width = `${gameState[key]}%`;
        }
    });

    // Update stage display
    const currentCareerData = gameData.careers[gameState.career];
    const currentStageData = gameData.stages[gameState.stage];
    const placeholderImage = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    
    elements.stageImage.src = (currentCareerData || currentStageData)?.image || placeholderImage;
    elements.stageImage.alt = `Current life stage or career`;

    let stageNameText = gameState.stage;
    if (gameState.career && currentCareerData?.levels?.[gameState.careerLevel]) {
        stageNameText = currentCareerData.levels[gameState.careerLevel].title;
    } else if (gameState.stage === 'College' && gameState.hasMajored) {
        stageNameText = "College Student";
    }
    elements.stageName.textContent = stageNameText;
}

function applyStatChangeAnimation(key, change) {
    const container = document.getElementById(`container-${key}`);
    if (!container) return;
    
    if (change > 0) container.classList.add('stat-increase');
    else if (change < 0) container.classList.add('stat-decrease');

    setTimeout(() => container.classList.remove('stat-increase', 'stat-decrease'), 500);
}

function updateGameState(updates) {
    Object.keys(updates).forEach(key => {
        const oldValue = gameState[key];
        const newValue = updates[key];
        if (typeof oldValue === 'number' && typeof newValue === 'number') {
            const change = newValue - oldValue;
             if (change !== 0) {
                applyStatChangeAnimation(key, change);
            }
        }
        gameState[key] = updates[key];
    });
    updateDisplay();
}


function findNewJob() {
    showMessage("You searched for a job, but couldn't find one you're qualified for yet.", 'info');
    return false;
}

function seekPromotion() {
    if (!gameState.career || gameState.career === 'Unemployed') return;

    const careerData = gameData.careers[gameState.career];
    const nextLevel = gameState.careerLevel + 1;

    if (!careerData.levels || nextLevel >= careerData.levels.length) {
        showMessage("You are already at the top of your career path!", "info");
        return;
    }

    const promotionReqs = careerData.levels[nextLevel].requirements;
    const unmetRequirements = Object.keys(promotionReqs).filter(req => gameState[req] < promotionReqs[req]);

    if (unmetRequirements.length === 0) {
        const newTitle = careerData.levels[nextLevel].title;
        showMessage(`Congratulations! You've been promoted to ${newTitle}!`, 'success');
        updateGameState({ ...gameState, careerLevel: nextLevel });
    } else {
        const reqText = unmetRequirements.map(req => `${req.charAt(0).toUpperCase() + req.slice(1)}`).join(', ');
        showMessage(`You were not promoted. You need to improve: ${reqText}.`, "error");
    }
}

function updateAllButtonStates() {
    const buttons = document.querySelectorAll('#action-buttons button');
    let actionKey = (gameState.stage === 'College' && gameState.hasMajored) ? 'College_Majored' : (gameState.career || gameState.stage);
    const actions = gameData.actions[actionKey];
    if (!actions) return;

    buttons.forEach(button => {
        const action = actions.find(a => a.name === button.textContent);
        if (!action) return;

        let disabled = (gameState.money < (action.cost || 0) || gameState.energy < (action.energyCost || 0));
        if (action.special === 'seekPromotion' && gameState.career) {
            const careerData = gameData.careers[gameState.career];
            const nextLevel = gameState.careerLevel + 1;
            if (!careerData.levels || nextLevel >= careerData.levels.length) {
                disabled = true;
            }
        }
        button.disabled = disabled;
        button.classList.toggle('opacity-50', disabled);
        button.classList.toggle('cursor-not-allowed', disabled);
    });
}

function updateActions() {
    const actionButtonsContainer = document.getElementById('action-buttons');
    actionButtonsContainer.innerHTML = ''; // Clear previous buttons

    let actionKey = (gameState.stage === 'College' && gameState.hasMajored) ? 'College_Majored' : (gameState.career || gameState.stage);
    const currentActions = gameData.actions[actionKey] || [];
    
    currentActions.forEach(action => {
        const button = document.createElement('button');
        button.textContent = action.name;
        button.className = "bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200";
        
        const tooltipParts = [];
        if (action.cost > 0) tooltipParts.push(`Cost: $${action.cost}`);
        if (action.energyCost > 0) tooltipParts.push(`Energy: -${action.energyCost}`);
        if (action.effect) {
            const effectParts = Object.entries(action.effect).map(([stat, value]) => `${stat.charAt(0).toUpperCase() + stat.slice(1)} ${value > 0 ? '+' : ''}${value}`);
            if (effectParts.length > 0) tooltipParts.push(`Effects: ${effectParts.join(', ')}`);
        }
        button.title = tooltipParts.join(' | ');

        button.onclick = () => {
            if (button.disabled) return;

            let updates = { ...gameState };
            updates.money -= (action.cost || 0);
            updates.energy -= (action.energyCost || 0);
            
            if (action.effect) {
                for (let stat in action.effect) {
                    updates[stat] = (updates[stat] || 0) + action.effect[stat];
                }
            }
            
            if (action.career) {
                const career = gameData.careers[action.career];
                const unmet = Object.keys(career.levels[0].requirements).filter(req => gameState[req] < career.levels[0].requirements[req]);
                
                if (unmet.length === 0) {
                    showMessage(`You have chosen to major in ${action.name.split('in ')[1]}`, "success");
                    updates.career = action.career;
                    updates.careerLevel = 0;
                    updates.hasMajored = true;
                    updateGameState(updates);
                    updateActions(); // Re-render actions for the new state
                } else {
                    showMessage(`Your ${unmet.join(' and ')} is not high enough for this major.`, "error");
                }
            } else {
                updateGameState(updates);
                if (action.special === 'findJob') findNewJob();
                else if (action.special === 'seekPromotion') seekPromotion();
                updateAllButtonStates();
            }
        };
        actionButtonsContainer.appendChild(button);
    });
    updateAllButtonStates();
}

function applyAgingEffects() {
    let updates = { ...gameState };
    updates.age += 1;
    updates.health -= Math.floor((updates.age + 1) / 20);
    updates.fun -= 1;
    updates.relationships -= 1;
    updates.energy = 100; // Full energy each new year

    if (updates.age < 18) {
        updates.intelligence += 2;
    }
    if (updates.career && gameData.careers[updates.career]) {
        updates.money += gameData.careers[updates.career].levels[updates.careerLevel].salary;
    }
    updateGameState(updates);
}

function triggerRandomEvent() {
    const eventRoll = Math.random();
    let cumulativeChance = 0;
    
    for (const event of gameData.events) {
        cumulativeChance += event.chance;
        if (eventRoll < cumulativeChance) {
            showMessage(event.message, 'info');
            let updates = { ...gameState };
            for (let stat in event.effect) {
                updates[stat] = (updates[stat] || 0) + event.effect[stat];
            }
            updateGameState(updates);
            return; // Only trigger one event per year
        }
    }
}

function checkStage() {
    const previousStage = gameState.stage;
    let newStage = previousStage;

    if (gameState.stage !== 'Working Adult' || !gameState.career) {
        for (let stageName in gameData.stages) {
            const { minAge, maxAge } = gameData.stages[stageName];
            if (gameState.age >= minAge && (!maxAge || gameState.age <= maxAge)) {
                newStage = stageName;
                break;
            }
        }
    }

    if (newStage !== previousStage) {
        let updates = { ...gameState, stage: newStage };
        showMessage(`You are now in ${newStage}!`, 'success');

        if (newStage === 'Working Adult') {
            if (previousStage === 'College' && gameState.career) {
                updates.flags = { ...updates.flags, graduated: true };
                showMessage("You've graduated from college!", 'success');
            }
            if (!gameState.career) {
                updates.career = 'Unemployed';
                updates.careerLevel = 0;
                showMessage("You've entered the workforce without a degree.", 'info');
            }
        }
        updateGameState(updates);
        updateActions();
    }
}

function getSummary() {
    let summaryLines = [];
    if (gameState.health <= 0) {
        summaryLines.push(`Your journey ended prematurely at age ${gameState.age} due to poor health.`);
    } else {
        let careerSummary = 'a person of leisure';
        if (gameState.career && gameState.career !== 'Unemployed') {
            const careerData = gameData.careers[gameState.career];
            careerSummary = `a career as a ${careerData.levels[gameState.careerLevel].title}`;
        } else if (gameState.career === 'Unemployed') {
            careerSummary = 'a life of odd jobs';
        }
        summaryLines.push(`You have retired at age ${gameState.age} after ${careerSummary}!`);
    }

    if (gameState.money > 10000) summaryLines.push("You were wealthy and lived in luxury.");
    else if (gameState.money < 1000) summaryLines.push("You lived with very little to your name.");
    else summaryLines.push("You had enough to get by.");
    if (gameState.health > 80) summaryLines.push("You lived a long and exceptionally healthy life.");
    else if (gameState.health < 20 && gameState.health > 0) summaryLines.push("Your health suffered greatly over the years.");
    if (gameState.intelligence > 80) summaryLines.push("You are remembered for being wise and knowledgeable.");
    if (gameState.fun > 80) summaryLines.push("Looking back, your life was joyful and fulfilling.");
    else if (gameState.fun < 20) summaryLines.push("Looking back, your life lacked joy and excitement.");
    if (gameState.relationships > 80) summaryLines.push("You were surrounded by loving friends and family.");
    else if (gameState.relationships < 20) summaryLines.push("You felt lonely in your old age.");
    
    return summaryLines.join('\n');
}

function nextYear() {
    applyAgingEffects();
    triggerRandomEvent();
    checkStage();
    updateAllButtonStates();

    if (gameState.health <= 0 || gameState.age >= 65) {
        endGame();
    }
}

function endGame() {
    elements.gameContainer.classList.add('hidden');
    elements.gameOverScreen.classList.remove('hidden');
    elements.summary.textContent = getSummary();
}

function resetGame() {
    gameState = getInitialState();
    elements.gameOverScreen.classList.add('hidden');
    elements.gameContainer.classList.remove('hidden');
    updateDisplay();
    updateActions();
}

async function initializeGame() {
    // Load all game data from external JSON files
    try {
        const [stagesRes, careersRes, actionsRes, eventsRes] = await Promise.all([
            fetch('scr/data/stages.json'),
            fetch('scr/data/careers.json'),
            fetch('scr/data/actions.json'),
            fetch('scr/data/events.json')
        ]);
        gameData.stages = await stagesRes.json();
        gameData.careers = await careersRes.json();
        gameData.actions = await actionsRes.json();
        gameData.events = await eventsRes.json();
        
        // After data is loaded, setup the UI
        setupStatDisplays();
        updateDisplay();
        updateActions();

    } catch (error) {
        console.error("Failed to load game data:", error);
        showMessage("Could not load game data. Please check the file paths and JSON format.", "error");
    }
}

// --- EVENT LISTENERS ---
elements.nextYearBtn.addEventListener('click', nextYear);
elements.playAgainBtn.addEventListener('click', resetGame);

// --- INITIALIZE GAME ---
window.onload = initializeGame;
