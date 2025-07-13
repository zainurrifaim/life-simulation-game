// --- INITIAL GAME STATE ---
const getInitialState = () => ({
    // Core Stats
    age: 5,
    intelligence: 10,
    health: 100,
    money: 20,
    fun: 50,
    relationships: 50,
    energy: 100,
    // Life Stage & Career
    stage: 'Kindergarten',
    career: null,
    careerLevel: 0,
    // New System States
    hasPartner: false,
    isMarried: false,
    children: [], 
    assets: [], 
    gamblingStreak: 0,
    gamblingAddiction: false,
    fitnessLevel: 0,
    dietQuality: 0, // from -50 to +50
    // Flags for events/choices
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
    statusDisplay: document.getElementById('status-display'),
    financialSummaryDisplay: document.createElement('div'),
};
elements.statusDisplay.after(elements.financialSummaryDisplay);
elements.financialSummaryDisplay.className = 'mt-4 text-left space-y-1';

// --- HELPER FUNCTIONS ---
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

function showMessage(text, type = 'info') {
    elements.messageBox.textContent = text;
    elements.messageBox.classList.remove('bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700', 'bg-gray-100', 'text-gray-700');
    
    const typeClasses = {
        error: ['bg-red-100', 'text-red-700'],
        success: ['bg-green-100', 'text-green-700'],
        info: ['bg-gray-100', 'text-gray-700']
    };
    elements.messageBox.classList.add(...(typeClasses[type] || typeClasses.info));
    
    elements.messageBox.style.opacity = '1';
    elements.messageBox.style.transform = 'translateY(0)';

    setTimeout(() => {
        elements.messageBox.style.opacity = '0';
        elements.messageBox.style.transform = 'translateY(-10px)';
    }, 4000);
}

// --- ACTION HANDLERS ---

const actionHandlers = {
    goToGym: () => {
        const cost = 20;
        const energyCost = 30;
        if (gameState.money < cost || gameState.energy < energyCost) {
            showMessage("You don't have enough money or energy.", "error");
            return;
        }
        showMessage("You feel energized and stronger after a good workout.");
        updateGameState({
            ...gameState,
            money: gameState.money - cost,
            energy: gameState.energy - energyCost,
            health: gameState.health + 10,
            fun: gameState.fun + 5,
            fitnessLevel: gameState.fitnessLevel + 1
        });
    },
    eatJunkFood: () => {
        const cost = 5;
        const energyCost = 15;
         if (gameState.money < cost || gameState.energy < energyCost) {
            showMessage("You can't afford that right now.", "error");
            return;
        }
        showMessage("So greasy, but so good. You feel a rush of satisfaction.");
        updateGameState({
            ...gameState,
            money: gameState.money - cost,
            energy: gameState.energy - energyCost,
            health: gameState.health - 5,
            fun: gameState.fun + 10,
            dietQuality: gameState.dietQuality - 2
        });
    },
    takeVacation: () => {
        const cost = 1500;
        const energyCost = 10;
        if (gameState.money < cost) {
            showMessage("You can't afford a vacation right now.", "error");
            return;
        }
        showMessage("You come back from your trip feeling refreshed and reconnected with the world.");
        updateGameState({
            ...gameState,
            money: gameState.money - cost,
            energy: gameState.energy - energyCost,
            fun: gameState.fun + 40,
            relationships: gameState.relationships + 20,
            health: gameState.health + 5
        });
    },
    gamble: () => {
        const cost = 100;
        const energyCost = 20;
        if (gameState.money < cost || gameState.energy < energyCost) {
            showMessage("You can't afford to go to the casino.", "error");
            return;
        }

        let updates = {
            ...gameState,
            money: gameState.money - cost,
            energy: gameState.energy - energyCost,
            gamblingStreak: gameState.gamblingStreak + 1
        };

        const roll = Math.random();
        if (roll < 0.05) { // Jackpot
            updates.money += 2000;
            updates.fun += 20;
            showMessage("You hit the jackpot! The flashing lights and ringing bells are exhilarating!", "success");
        } else if (roll < 0.25) { // Small Win (0.05 + 0.20)
            updates.money += 300;
            updates.fun += 10;
            showMessage("You walk away with more than you came with. A successful night!", "success");
        } else if (roll < 0.50) { // Break Even (0.25 + 0.25)
            updates.money += 100;
            updates.fun -= 5;
            showMessage("You didn't win, you didn't lose. The thrill was fleeting.");
        } else { // Loss
            updates.fun -= 10;
            updates.health -= 5;
            showMessage("The house always wins. You leave with empty pockets and a heavy heart.", "error");
        }
        
        if(updates.gamblingStreak > 5) {
            updates.gamblingAddiction = true;
        }

        updateGameState(updates);
    },
    tryToFindLove: () => {
         if (gameState.energy < 40) {
            showMessage("You're too tired to socialize right now.", "error");
            return;
        }
        let updates = {...gameState, energy: gameState.energy - 40};
        if(gameState.relationships > 50) {
            updates.hasPartner = true;
            showMessage("You've met someone special! Your life feels a little brighter.", "success");
        } else {
            showMessage("You put yourself out there, but didn't connect with anyone this time.");
        }
        updateGameState(updates);
        updateActions();
    },
    propose: () => {
        const cost = 1000;
        if (gameState.money < cost || gameState.energy < 20) {
            showMessage("You need more money or energy to propose!", "error");
            return;
        }
        let updates = {...gameState, money: gameState.money - cost, energy: gameState.energy - 20};
        if(gameState.relationships > 70) {
            updates.isMarried = true;
            updates.hasPartner = false;
            updates.relationships += 20;
            updates.fun += 20;
            showMessage("They said yes! You're starting a new chapter of your life together.", "success");
        } else {
            updates.hasPartner = false;
            updates.relationships -= 30;
            updates.fun -= 20;
            showMessage("They weren't ready for that step. The relationship is over.", "error");
        }
        updateGameState(updates);
        updateActions();
    },
    divorce: () => {
        if (gameState.energy < 80) {
            showMessage("You don't have the energy for this right now.", "error");
            return;
        }
        showMessage("A painful end to a chapter. You are now on your own again, but it has taken its toll.", "error");
        updateGameState({
            ...gameState,
            isMarried: false,
            money: gameState.money * 0.5,
            energy: gameState.energy - 80,
            relationships: gameState.relationships - 50,
            fun: gameState.fun - 40,
            health: gameState.health - 10
        });
        updateActions();
    },
    haveChild: () => {
        const cost = 500;
        const energyCost = 60;
        if (gameState.money < cost || gameState.energy < energyCost) {
            showMessage("You don't have the financial or emotional energy to have a child right now.", "error");
            return;
        }
        showMessage("Welcome to the world, little one! Your family has grown.", "success");
        const newChildren = [...gameState.children, { age: 0 }];
        updateGameState({
            ...gameState,
            money: gameState.money - cost,
            energy: gameState.energy - energyCost,
            fun: gameState.fun + 20,
            relationships: gameState.relationships + 10,
            children: newChildren
        });
        updateActions();
    },
    buyAsset: (assetId) => {
        const asset = gameData.assets[assetId];
        if (!asset || gameState.money < asset.cost) {
            showMessage(`You can't afford the ${asset.name}.`, "error");
            return;
        }

        let updates = {
            ...gameState,
            money: gameState.money - asset.cost
        };

        // If it's a house, remove any other housing assets (can't own two houses or rent while owning)
        if (asset.type === 'housing') {
            updates.assets = gameState.assets.filter(id => gameData.assets[id].type !== 'housing');
        }
        
        // Add the new asset
        updates.assets.push(assetId);
        
        for (const effect in asset.effect) {
            updates[effect] = (updates[effect] || 0) + asset.effect[effect];
        }

        showMessage(`You have purchased a ${asset.name.split('a ')[1]}!`, "success");
        updateGameState(updates);
        updateActions();
    },
    findJob: () => {
        const availableCareers = Object.keys(gameData.careers).filter(careerName => {
            if (careerName === 'Unemployed' || careerName === gameState.career) return false;
            
            const careerData = gameData.careers[careerName];
            if (!careerData.levels?.length) return false;
    
            if (careerData.degreeRequired) {
                if (!gameState.flags.graduated || gameState.career !== careerData.degreeRequired) {
                    return false;
                }
            }
    
            const requirements = careerData.levels[0].requirements;
            for (const requirement in requirements) {
                if (gameState[requirement] < requirements[requirement]) {
                    return false;
                }
            }
            return true;
        });
    
        if (availableCareers.length > 0) {
            const newCareer = availableCareers[Math.floor(Math.random() * availableCareers.length)];
            const newCareerData = gameData.careers[newCareer];
            showMessage(`Congratulations! You've been hired as a ${newCareerData.levels[0].title}!`, 'success');
            updateGameState({
                ...gameState,
                career: newCareer,
                careerLevel: 0,
                stage: 'Working Adult'
            });
            updateActions();
        } else {
            showMessage("You searched for a job, but couldn't find one you're qualified for yet.", 'info');
        }
    },
    seekPromotion: () => {
        if (!gameState.career || gameState.career === 'Unemployed') {
            showMessage("You don't have a career to get a promotion in.", "error");
            return;
        }

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
            updateGameState({
                ...gameState,
                careerLevel: nextLevel
            });
            updateActions();
        } else {
            const reqText = unmetRequirements.map(req => `${req.charAt(0).toUpperCase() + req.slice(1)}`).join(', ');
            showMessage(`You were not promoted. You need to improve: ${reqText}.`, "error");
        }
    }
};


// --- CORE GAME LOGIC ---

function setupStatDisplays() {
    const statConfig = [
        { name: 'Age', key: 'age', color: 'gray' },
        { name: 'Health', key: 'health', color: 'green' },
        { name: 'Fun', key: 'fun', color: 'pink' },
        { name: 'Intelligence', key: 'intelligence', color: 'purple' },
        { name: 'Relationships', key: 'relationships', color: 'red' },
        { name: 'Energy', key: 'energy', color: 'indigo' },
        { name: 'Money', key: 'money', color: 'yellow' },
        { name: 'Children', key: 'children', color: 'blue' },
    ];

    elements.statsContainer.innerHTML = '';
    statConfig.forEach(stat => {
        const valueId = `stat-${stat.key}`;
        const statHTML = `
            <div id="container-${stat.key}" class="bg-${stat.color}-50 p-3 rounded-lg transition-all duration-500 text-center">
                <div class="text-sm font-medium text-${stat.color}-600">${stat.name}</div>
                <div id="${valueId}" class="text-2xl font-bold text-gray-800"></div>
            </div>
        `;
        elements.statsContainer.innerHTML += statHTML;
    });
}

function updateDisplay() {
    Object.keys(gameState).forEach(key => {
        if (['health', 'fun', 'intelligence', 'relationships', 'energy'].includes(key)) {
            gameState[key] = clamp(gameState[key], 0, 100);
        }
    });
    gameState.money = Math.max(0, Math.floor(gameState.money));

    document.getElementById('stat-age').textContent = gameState.age;
    document.getElementById('stat-money').textContent = `$${gameState.money}`;
    document.getElementById('stat-children').textContent = gameState.children.length;
    ['health', 'fun', 'intelligence', 'relationships', 'energy'].forEach(key => {
        document.getElementById(`stat-${key}`).textContent = gameState[key];
    });

    const currentCareerData = gameData.careers[gameState.career];
    const currentStageData = gameData.stages[gameState.stage];
    
    if (gameState.stage === 'Retirement') {
        elements.stageImage.src = currentStageData?.image || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        elements.stageName.textContent = gameState.stage;
    } else {
        elements.stageImage.src = (currentCareerData || currentStageData)?.image || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        elements.stageName.textContent = currentCareerData?.levels?.[gameState.careerLevel]?.title || gameState.stage;
    }

    elements.statusDisplay.innerHTML = '';
    let statusHTML = '';
    if (gameState.isMarried) {
        statusHTML += `<div class="flex items-center text-sm bg-red-100 text-red-700 p-2 rounded-lg"><span class="font-bold mr-2">Status:</span> Married</div>`;
    } else if (gameState.hasPartner) {
        statusHTML += `<div class="flex items-center text-sm bg-pink-100 text-pink-700 p-2 rounded-lg"><span class="font-bold mr-2">Status:</span> In a Relationship</div>`;
    } else {
        statusHTML += `<div class="flex items-center text-sm bg-gray-100 text-gray-700 p-2 rounded-lg"><span class="font-bold mr-2">Status:</span> Single</div>`;
    }
    if(gameState.gamblingAddiction){
        statusHTML += `<div class="flex items-center text-sm bg-yellow-100 text-yellow-800 p-2 rounded-lg mt-2"><span class="font-bold mr-2">Warning:</span> Gambling Addiction</div>`;
    }
     if(gameState.dietQuality < -20){
        statusHTML += `<div class="flex items-center text-sm bg-green-100 text-green-800 p-2 rounded-lg mt-2"><span class="font-bold mr-2">Health:</span> Poor Diet</div>`;
    }
    elements.statusDisplay.innerHTML = statusHTML;

    elements.financialSummaryDisplay.innerHTML = '';
    let summaryHTML = '<h3 class="text-lg font-semibold text-gray-800 mb-2">Yearly Financial Summary</h3>';
    let totalIncome = 0;
    let totalExpenses = 0;
    
    const salary = (gameState.career && gameData.careers[gameState.career]) ? gameData.careers[gameState.career].levels[gameState.careerLevel].salary : 0;
    if (salary > 0) {
        summaryHTML += `<div class="expense-item text-sm"><span class="text-gray-600">Salary:</span><span class="font-medium text-green-600">+$${salary}</span></div>`;
        totalIncome += salary;
    }

    const addExpense = (label, amount) => {
        if (amount > 0) {
            summaryHTML += `<div class="expense-item text-sm"><span class="text-gray-600">${label}:</span><span class="font-medium text-red-600">-$${amount}</span></div>`;
            totalExpenses += amount;
        }
    };
    
    for (const expenseId in gameData.expenses) {
        const expense = gameData.expenses[expenseId];
        try {
            if (eval(expense.condition)) {
                let amount = 0;
                if (typeof expense.amount === 'string' && expense.amount.includes('%')) {
                    const percentage = parseFloat(expense.amount) / 100;
                    amount = Math.floor(salary * percentage);
                } else if (expense.per === 'child') {
                    amount = expense.amount * gameState.children.length;
                } else {
                    amount = expense.amount;
                }
                addExpense(expense.description, amount);
            }
        } catch (e) {
            console.error("Error evaluating expense condition:", e);
        }
    }

    gameState.assets.forEach(assetId => {
        const asset = gameData.assets[assetId];
        addExpense(`${asset.name.replace(/Buy a |Rent an /,'')} Upkeep`, asset.upkeep);
    });


    if (totalIncome > 0 || totalExpenses > 0) {
        const netChange = totalIncome - totalExpenses;
        const netColor = netChange >= 0 ? 'text-green-700' : 'text-red-700';
        const netSign = netChange >= 0 ? '+' : '-';
        summaryHTML += `<hr class="my-1"><div class="expense-item font-bold"><span class="text-gray-800">Net:</span><span class="${netColor}">${netSign}$${Math.abs(netChange)}</span></div>`;
    } else {
        summaryHTML += `<p class="text-sm text-gray-500">No significant income or expenses.</p>`;
    }
    elements.financialSummaryDisplay.innerHTML = summaryHTML;
}

function applyStatChangeAnimation(key, change) {
    const container = document.getElementById(`container-${key}`);
    if (!container) return;
    container.classList.add(change > 0 ? 'stat-increase' : 'stat-decrease');
    setTimeout(() => container.classList.remove('stat-increase', 'stat-decrease'), 500);
    
    const statValueElement = document.getElementById(`stat-${key}`);
    if (statValueElement) {
        statValueElement.classList.add(change > 0 ? 'stat-value-increase' : 'stat-value-decrease');
        setTimeout(() => {
            statValueElement.classList.remove('stat-value-increase', 'stat-value-decrease');
        }, 500);
    }
}

function updateGameState(updates) {
    Object.keys(updates).forEach(key => {
        const oldValue = gameState[key];
        const newValue = updates[key];
        if (typeof oldValue === 'number' && typeof newValue === 'number') {
            const change = newValue - oldValue;
             if (change !== 0) applyStatChangeAnimation(key, change);
        }
        else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
            const change = newValue.length - oldValue.length;
            if (change !== 0) applyStatChangeAnimation(key, change);
        }
        gameState[key] = newValue;
    });
    updateDisplay();
    updateAllButtonStates();
}

function updateActions() {
    const actionButtonsContainer = document.getElementById('action-buttons');
    actionButtonsContainer.innerHTML = '';

    let actionKey;
    if (gameState.stage === 'Retirement') {
        actionKey = 'Retirement';
    } else if (gameState.stage === 'College' && gameState.hasMajored) {
        actionKey = 'College_Majored';
    } else {
        actionKey = gameState.career || gameState.stage;
    }
    
    let currentActions = [...(gameData.actions[actionKey] || [])];

    if (gameState.stage !== 'Kindergarten' && gameState.stage !== 'Elementary School' && gameState.stage !== 'Retirement') {
        if (gameState.isMarried) {
            currentActions.push({ name: "File for Divorce", special: "divorce" });
            currentActions.push({ name: "Have a Child", special: "haveChild", cost: 500 });
        } else if (gameState.hasPartner) {
            currentActions.push({ name: "Propose", special: "propose", cost: 1000 });
        } else {
            currentActions.push({ name: "Try to Find Love", special: "tryToFindLove" });
        }

        // --- REVISED: Add Asset Purchase Actions ---
        for (const assetId in gameData.assets) {
            const asset = gameData.assets[assetId];
            let canShowButton = true;

            // Check if player meets requirements
            const meetsRequirements = Object.keys(asset.requirements).every(req => gameState[req] >= asset.requirements[req]);
            if (!meetsRequirements) {
                canShowButton = false;
            }

            // Check if player already owns this specific asset
            if (gameState.assets.includes(assetId)) {
                canShowButton = false;
            }

            // --- BUG FIX: Housing Logic ---
            // If the asset is a type of housing, check if they already have one.
            // This prevents "Rent an Apartment" and "Buy a House" from appearing if you already have housing.
            if (asset.type === 'housing') {
                const hasHousing = gameState.assets.some(id => gameData.assets[id].type === 'housing');
                if (hasHousing) {
                    canShowButton = false;
                }
            }
            
            if (canShowButton) {
                currentActions.push({ name: asset.name, special: "buyAsset", specialArg: assetId, cost: asset.cost });
            }
        }
    }

    currentActions.forEach(action => {
        const button = document.createElement('button');
        button.textContent = action.name;
        button.className = "bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200";
        
        // --- BUG FIX: Store action data on button for energy check ---
        button.dataset.action = JSON.stringify(action);

        button.onclick = () => {
            if (button.disabled) return;

            if (action.career) {
                const careerData = gameData.careers[action.career];
                if (!careerData) return;

                const requirements = careerData.levels[0].requirements;
                const unmetRequirements = Object.keys(requirements).filter(req => gameState[req] < requirements[req]);

                if (unmetRequirements.length === 0) {
                    let updates = { ...gameState };
                    updates.money -= (action.cost || 0);
                    updates.energy -= (action.energyCost || 0);
                    if (action.effect) {
                        for (let stat in action.effect) {
                            updates[stat] = (updates[stat] || 0) + action.effect[stat];
                        }
                    }
                    updates.career = action.career;
                    updates.hasMajored = true;
                    showMessage(`You have chosen to major in ${action.name.split('in ')[1]}!`, "success");
                    updateGameState(updates);
                    updateActions();
                } else {
                    const reqText = unmetRequirements.map(req => `${req.charAt(0).toUpperCase() + req.slice(1)}`).join(', ');
                    showMessage(`Your ${reqText} is not high enough for this major.`, "error");
                }
            } 
            else if (action.special && actionHandlers[action.special]) {
                actionHandlers[action.special](action.specialArg);
            } 
            else if (action.effect) {
                let updates = { ...gameState };
                updates.money -= (action.cost || 0);
                updates.energy -= (action.energyCost || 0);
                for (let stat in action.effect) {
                    updates[stat] = (updates[stat] || 0) + action.effect[stat];
                }
                updateGameState(updates);
            }
        };

        actionButtonsContainer.appendChild(button);
    });
    updateAllButtonStates();
}

// --- REVISED: Action Disabling Logic ---
function updateAllButtonStates() {
    const buttons = document.querySelectorAll('#action-buttons button');
    buttons.forEach(button => {
        const actionData = JSON.parse(button.dataset.action || '{}');
        let disabled = false;

        // Disable if not enough energy for this specific action
        if (actionData.energyCost && actionData.energyCost > gameState.energy) {
            disabled = true;
        }
        
        // Disable if not enough money for this specific action
        if (actionData.cost && actionData.cost > gameState.money) {
            disabled = true;
        }

        button.disabled = disabled;
        button.classList.toggle('opacity-50', disabled);
        button.classList.toggle('cursor-not-allowed', disabled);
    });
}

function triggerRandomEvent() {
    if (!gameData.events) return;
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
            return;
        }
    }
}

function applyYearlyEffects() {
    let updates = { ...gameState };
    updates.age += 1;
    updates.energy = 100; // Restore energy at the start of the year
    
    let totalIncome = 0;
    let totalExpenses = 0;
    const salary = (gameState.career && gameData.careers[gameState.career]) ? gameData.careers[gameState.career].levels[gameState.careerLevel].salary : 0;
    totalIncome += salary;

    for (const expenseId in gameData.expenses) {
        const expense = gameData.expenses[expenseId];
        try {
            if (eval(expense.condition)) {
                let amount = 0;
                if (typeof expense.amount === 'string' && expense.amount.includes('%')) {
                    amount = Math.floor(salary * (parseFloat(expense.amount) / 100));
                } else if (expense.per === 'child') {
                    amount = expense.amount * gameState.children.length;
                } else {
                    amount = expense.amount;
                }
                totalExpenses += amount;
            }
        } catch(e) { console.error("Error evaluating expense condition:", e); }
    }
    gameState.assets.forEach(assetId => {
        totalExpenses += gameData.assets[assetId].upkeep;
    });
    
    updates.money += (totalIncome - totalExpenses);

    updates.children = updates.children.map(child => ({ ...child, age: child.age + 1 }));
    if (updates.children.length > 0) {
        updates.fun += 5;
    }

    updates.health -= Math.floor((updates.age + 1) / 20);
    updates.fun -= 1;
    updates.relationships -= 1;

    if(updates.isMarried) {
        updates.relationships += 5;
        updates.fun += 5;
    }
    
    if(updates.dietQuality > 20) updates.health += 2;
    if(updates.dietQuality < -20) updates.health -= 5;

    if (updates.age < 18) updates.intelligence += 2;
    
    updateGameState(updates);
}

function checkStage() {
    const previousStage = gameState.stage;
    let newStage = previousStage;

    for (let stageName in gameData.stages) {
        const { minAge, maxAge } = gameData.stages[stageName];
        if (gameState.age >= minAge && (!maxAge || gameState.age <= maxAge)) {
            newStage = stageName;
            break;
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
            }
        } else if (newStage === 'Retirement') {
            showMessage("You have officially retired from your career.", "success");
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
        summaryLines.push(`You lived a full life, reaching the age of ${gameState.age}.`);
    }
    if (gameState.isMarried) summaryLines.push("You were happily married.");
    if (gameState.children.length > 0) {
        summaryLines.push(`You raised ${gameState.children.length} child${gameState.children.length > 1 ? 'ren' : ''}.`);
    }
    if (gameState.assets.some(id => gameData.assets[id].type === 'housing' && gameData.assets[id].cost > 0)) {
        summaryLines.push("You were a homeowner.");
    }
    if (gameState.money > 100000) summaryLines.push("You were wealthy and lived in luxury.");
    else if (gameState.money < 1000) summaryLines.push("You lived with very little to your name.");
    if (gameState.fun > 80) summaryLines.push("Looking back, your life was joyful and fulfilling.");
    else if (gameState.fun < 20) summaryLines.push("Looking back, your life lacked joy and excitement.");
    if (gameState.gamblingAddiction) summaryLines.push("You struggled with a gambling addiction.");
    return summaryLines.join('\n');
}

function nextYear() {
    applyYearlyEffects();
    triggerRandomEvent();
    checkStage();
    updateActions();

    if (gameState.health <= 0 || gameState.age >= 80) {
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
    try {
        const [stagesRes, careersRes, actionsRes, eventsRes, expensesRes, assetsRes] = await Promise.all([
            fetch('scr/data/stages.json'),
            fetch('scr/data/careers.json'),
            fetch('scr/data/actions.json'),
            fetch('scr/data/events.json'),
            fetch('scr/data/expenses.json'),
            fetch('scr/data/assets.json')
        ]);
        gameData.stages = await stagesRes.json();
        gameData.careers = await careersRes.json();
        gameData.actions = await actionsRes.json();
        gameData.events = await eventsRes.json();
        gameData.expenses = await expensesRes.json();
        gameData.assets = await assetsRes.json();
        
        setupStatDisplays();
        updateDisplay();
        updateActions();

    } catch (error) {
        console.error("Failed to load game data:", error);
        showMessage("Could not load game data. Please check file paths and JSON.", "error");
    }
}

// --- EVENT LISTENERS ---
elements.nextYearBtn.addEventListener('click', nextYear);
elements.playAgainBtn.addEventListener('click', resetGame);

// --- INITIALIZE GAME ---
window.onload = initializeGame;
