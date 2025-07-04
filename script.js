const players = [];
const MAX_PLAYERS = 40;
const PLAYERS_PER_GROUP = 5;
const NUM_GROUPS = MAX_PLAYERS / PLAYERS_PER_GROUP; // 8 groups for Z1

const playerScores = {}; // Key: playerName, Value: score (used for Round 1)
let advancedPlayers = []; // Players proceeding to Round 2 (16 players)
let round2Winners = []; // Winning teams from Round 2 (8 players)
let quarterFinalWinners = []; // Winners of Quarter-Finals (4 players)
let semiFinalWinners = []; // Winners of Semi-Finals (2 players)
let semiFinalLosers = []; // Losers of Semi-Finals (2 players)


// --- DOM Elements ---
const playerNameInput = document.getElementById('playerNameInput');
const addPlayerBtn = document.getElementById('addPlayerBtn');
const playerCountSpan = document.getElementById('playerCount');
const playerList = document.getElementById('playerList');
const createGroupsBtn = document.getElementById('createGroupsBtn');

const groupsSection = document.getElementById('groups-section');
const groupsContainer = document.getElementById('groupsContainer');
const startRound1Btn = document.getElementById('startRound1Btn');

const round1Section = document.getElementById('round1-section');
const round1FightsContainer = document.getElementById('round1FightsContainer');
const finishRound1Btn = document.getElementById('finishRound1Btn');

const round1ScoresSection = document.getElementById('round1-scores-section');
const round1ScoresContainer = document.getElementById('round1ScoresContainer');
const selectTopPlayersBtn = document.getElementById('selectTopPlayersBtn');

const round2PrepSection = document.getElementById('round2-prep-section');
const advancedPlayersList = document.getElementById('advancedPlayersList');
const startRound2Btn = document.getElementById('startRound2Btn');

const round2Section = document.getElementById('round2-section');
const round2GroupsContainer = document.getElementById('round2GroupsContainer');
const round2FightsContainer = document.getElementById('round2FightsContainer');
const finishRound2Btn = document.getElementById('finishRound2Btn');

const quarterFinalSection = document.getElementById('quarter-final-section');
const quarterFinalFightsContainer = document.getElementById('quarterFinalFightsContainer');
const finishQuarterFinalBtn = document.getElementById('finishQuarterFinalBtn');

const semiFinalSection = document.getElementById('semi-final-section');
const semiFinalFightsContainer = document.getElementById('semiFinalFightsContainer');
const finishSemiFinalBtn = document.getElementById('finishSemiFinalBtn');

const finalSection = document.getElementById('final-section');
const finalFightContainer = document.getElementById('finalFightContainer');
const showAwardsBtn = document.getElementById('showAwardsBtn');
const awardsContainer = document.getElementById('awardsContainer');

// Elements for replacement
const playerReplacementSection = document.getElementById('player-replacement-section');
const playerToReplaceInput = document.getElementById('playerToReplaceInput');
const newPlayerNameInput = document.getElementById('newPlayerNameInput');
const replacePlayerBtn = document.getElementById('replacePlayerBtn');
const replacementStatusMessage = document.getElementById('replacementStatusMessage');

// New: Reset button
const resetProgressBtn = document.getElementById('resetProgressBtn');


// --- Helper Functions ---

function updatePlayerCount() {
    playerCountSpan.textContent = players.length;
    createGroupsBtn.disabled = players.length !== MAX_PLAYERS;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

// Function to hide all sections except the current one
function showSection(sectionToShow) {
    const sections = [
        document.getElementById('add-players-section'),
        groupsSection,
        round1Section,
        round1ScoresSection,
        round2PrepSection,
        round2Section,
        quarterFinalSection,
        semiFinalSection,
        finalSection
    ];
    sections.forEach(section => {
        if (section) { // Check if the section element exists
            section.style.display = 'none';
        }
    });
    if (sectionToShow) {
        sectionToShow.style.display = 'block';
    }
}

// Function to render groups (extracted for reusability)
function renderGroups() {
    groupsContainer.innerHTML = ''; // Clear previous groups
    if (!window.tournamentGroups) return; // Ensure groups exist before rendering

    window.tournamentGroups.forEach((group, groupIndex) => {
        const groupCard = document.createElement('div');
        groupCard.classList.add('group-card');
        groupCard.innerHTML = `<h3>Group ${groupIndex + 1}</h3><ul></ul>`;
        const ul = groupCard.querySelector('ul');
        group.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player;
            ul.appendChild(li);
        });
        groupsContainer.appendChild(groupCard);
    });
}

// --- State Persistence Functions ---
function saveState() {
    const state = {
        players: players,
        playerScores: playerScores,
        tournamentGroups: window.tournamentGroups,
        advancedPlayers: advancedPlayers,
        round2Winners: round2Winners,
        quarterFinalWinners: quarterFinalWinners,
        semiFinalWinners: semiFinalWinners,
        semiFinalLosers: semiFinalLosers,
        // Get the ID of the currently visible section
        currentSectionId: document.querySelector('section[style="display: block;"]')?.id || 'add-players-section'
    };
    try {
        localStorage.setItem('tournamentState', JSON.stringify(state));
        console.log('Tournament state saved.');
    } catch (e) {
        console.error('Error saving state to localStorage:', e);
        alert('Could not save tournament progress. Your browser might be in private mode or storage is full.');
    }
}

function loadState() {
    try {
        const savedState = localStorage.getItem('tournamentState');
        if (savedState) {
            const state = JSON.parse(savedState);

            // Restore primary data structures
            players.splice(0, players.length, ...(state.players || []));
            Object.keys(playerScores).forEach(key => delete playerScores[key]); // Clear existing
            Object.assign(playerScores, state.playerScores || {}); // Restore saved
            window.tournamentGroups = state.tournamentGroups || [];
            advancedPlayers.splice(0, advancedPlayers.length, ...(state.advancedPlayers || []));
            round2Winners.splice(0, round2Winners.length, ...(state.round2Winners || []));
            quarterFinalWinners.splice(0, quarterFinalWinners.length, ...(state.quarterFinalWinners || []));
            semiFinalWinners.splice(0, semiFinalWinners.length, ...(state.semiFinalWinners || []));
            semiFinalLosers.splice(0, semiFinalLosers.length, ...(state.semiFinalLosers || []));


            // Update UI based on loaded state
            updatePlayerCount(); // Updates the player counter and Create Groups button

            // Re-list players if on the add-players section
            playerList.innerHTML = ''; // Clear existing list
            players.forEach(player => {
                const listItem = document.createElement('li');
                listItem.textContent = player;
                playerList.appendChild(listItem);
            });

            // Re-render appropriate sections based on the stage of the tournament
            if (state.currentSectionId) {
                const currentSectionElement = document.getElementById(state.currentSectionId);
                showSection(currentSectionElement); // Show the last active section

                // Re-enable/re-render elements based on the loaded section
                if (state.currentSectionId === 'groups-section') {
                    if (window.tournamentGroups.length > 0) {
                        renderGroups();
                        createGroupsBtn.disabled = true; // Disable initial create button
                        addPlayerBtn.disabled = true;
                        playerNameInput.disabled = true;
                        startRound1Btn.disabled = false;
                        playerReplacementSection.style.display = 'block'; // Show replacement option
                    }
                } else if (state.currentSectionId === 'round1-section') {
                    renderGroups(); // Groups must be rendered before fights
                    generateRound1Fights();
                    finishRound1Btn.disabled = false;
                    createGroupsBtn.disabled = true; // Still disabled
                    addPlayerBtn.disabled = true;
                    playerNameInput.disabled = true;
                    playerReplacementSection.style.display = 'none'; // Hide replacement once round starts
                } else if (state.currentSectionId === 'round1-scores-section') {
                    renderGroups();
                    displayRound1Scores();
                    selectTopPlayersBtn.disabled = false;
                    createGroupsBtn.disabled = true;
                    addPlayerBtn.disabled = true;
                    playerNameInput.disabled = true;
                    playerReplacementSection.style.display = 'none';
                } else if (state.currentSectionId === 'round2-prep-section') {
                    advancedPlayersList.innerHTML = ''; // Clear before re-listing
                    advancedPlayers.forEach(player => {
                        const li = document.createElement('li');
                        li.textContent = player;
                        advancedPlayersList.appendChild(li);
                    });
                    startRound2Btn.disabled = false;
                    createGroupsBtn.disabled = true;
                    addPlayerBtn.disabled = true;
                    playerNameInput.disabled = true;
                    playerReplacementSection.style.display = 'none';
                } else if (state.currentSectionId === 'round2-section') {
                    generateRound2Fights();
                    finishRound2Btn.disabled = false;
                    createGroupsBtn.disabled = true;
                    addPlayerBtn.disabled = true;
                    playerNameInput.disabled = true;
                    playerReplacementSection.style.display = 'none';
                } else if (state.currentSectionId === 'quarter-final-section') {
                    generateQuarterFinalFights();
                    finishQuarterFinalBtn.disabled = false;
                    createGroupsBtn.disabled = true;
                    addPlayerBtn.disabled = true;
                    playerNameInput.disabled = true;
                    playerReplacementSection.style.display = 'none';
                } else if (state.currentSectionId === 'semi-final-section') {
                    generateSemiFinalFights();
                    finishSemiFinalBtn.disabled = false;
                    createGroupsBtn.disabled = true;
                    addPlayerBtn.disabled = true;
                    playerNameInput.disabled = true;
                    playerReplacementSection.style.display = 'none';
                } else if (state.currentSectionId === 'final-section') {
                    generateFinalFight();
                    showAwardsBtn.disabled = false;
                    createGroupsBtn.disabled = true;
                    addPlayerBtn.disabled = true;
                    playerNameInput.disabled = true;
                    playerReplacementSection.style.display = 'none';
                }
            }

            console.log('Tournament state loaded successfully.');
        } else {
            console.log('No saved tournament state found. Starting new tournament.');
        }
    } catch (e) {
        console.error('Error loading state from localStorage:', e);
        alert('Could not load previous tournament progress. Starting a new tournament.');
        localStorage.removeItem('tournamentState'); // Clear corrupted state
    }
}


// --- Step 1: Add Players ---
addPlayerBtn.addEventListener('click', () => {
    const newPlayerNames = playerNameInput.value.split(',')
        .map(name => name.trim())
        .filter(name => name !== '');

    let addedCount = 0;
    let duplicates = [];
    let maxReached = false;

    newPlayerNames.forEach(playerName => {
        if (players.length < MAX_PLAYERS) {
            if (!players.includes(playerName)) {
                players.push(playerName);
                const listItem = document.createElement('li');
                listItem.textContent = playerName;
                playerList.appendChild(listItem);
                addedCount++;
            } else {
                duplicates.push(playerName);
            }
        } else {
            maxReached = true;
        }
    });

    playerNameInput.value = '';
    updatePlayerCount();

    let message = '';
    if (addedCount > 0) {
        message += `Added ${addedCount} player(s). `;
    }
    if (duplicates.length > 0) {
        message += `"${duplicates.join(', ')}" already exist(s) and was/were skipped. `;
    }
    if (maxReached) {
        message += `Maximum of ${MAX_PLAYERS} players reached. No more players can be added.`;
    }
    if (message) {
        alert(message.trim());
    }
    saveState();
});

playerNameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addPlayerBtn.click();
    }
});

// --- Step 2: Create Groups (Round Z1) ---
createGroupsBtn.addEventListener('click', () => {
    if (players.length !== MAX_PLAYERS) {
        alert(`Please add exactly ${MAX_PLAYERS} players before creating groups.`);
        return;
    }

    const shuffledPlayers = shuffleArray([...players]);
    window.tournamentGroups = [];
    for (let i = 0; i < NUM_GROUPS; i++) {
        const group = shuffledPlayers.slice(i * PLAYERS_PER_GROUP, (i + 1) * PLAYERS_PER_GROUP);
        window.tournamentGroups.push(group);

        group.forEach(player => {
            if (playerScores[player] === undefined) playerScores[player] = 0;
        });
    }

    renderGroups();
    showSection(groupsSection);
    createGroupsBtn.disabled = true;
    addPlayerBtn.disabled = true;
    playerNameInput.disabled = true;
    startRound1Btn.disabled = false;
    playerReplacementSection.style.display = 'block';
    saveState();
});

// Event Listener for Replace Player Button
replacePlayerBtn.addEventListener('click', () => {
    const playerToReplace = playerToReplaceInput.value.trim();
    const newPlayerName = newPlayerNameInput.value.trim();

    replacementStatusMessage.textContent = '';
    replacementStatusMessage.classList.remove('success', 'error');

    if (!playerToReplace || !newPlayerName) {
        replacementStatusMessage.textContent = 'Please enter both player names.';
        replacementStatusMessage.classList.add('error');
        return;
    }

    if (playerToReplace === newPlayerName) {
        replacementStatusMessage.textContent = 'New player name cannot be the same as the player to replace.';
        replacementStatusMessage.classList.add('error');
        return;
    }

    if (players.includes(newPlayerName) && newPlayerName !== playerToReplace) {
        replacementStatusMessage.textContent = `"${newPlayerName}" already exists in the player list. Please use a unique name.`;
        replacementStatusMessage.classList.add('error');
        return;
    }

    let replaced = false;
    let groupIndexFound = -1;

    for (let i = 0; i < window.tournamentGroups.length; i++) {
        const group = window.tournamentGroups[i];
        const index = group.indexOf(playerToReplace);
        if (index !== -1) {
            group[index] = newPlayerName;
            groupIndexFound = i;
            replaced = true;
            break;
        }
    }

    if (replaced) {
        const globalPlayerIndex = players.indexOf(playerToReplace);
        if (globalPlayerIndex !== -1) {
            players[globalPlayerIndex] = newPlayerName;
        } else {
             replacementStatusMessage.textContent = `Warning: "${playerToReplace}" was found in a group but not in the global player list.`;
             replacementStatusMessage.classList.add('error');
        }

        delete playerScores[playerToReplace];
        playerScores[newPlayerName] = 0;

        renderGroups();
        playerToReplaceInput.value = '';
        newPlayerNameInput.value = '';
        replacementStatusMessage.textContent = `"${playerToReplace}" successfully replaced by "${newPlayerName}" in Group ${groupIndexFound + 1}.`;
        replacementStatusMessage.classList.add('success');
    } else {
        replacementStatusMessage.textContent = `"${playerToReplace}" not found in any group. Please check the spelling.`;
        replacementStatusMessage.classList.add('error');
    }
    saveState();
});


// --- Step 3: Round 1 (Z1) - Intra-Group Fights ---
function generateRound1Fights() {
    round1FightsContainer.innerHTML = '';
    window.tournamentGroups.forEach((group, groupIndex) => {
        const groupDiv = document.createElement('div');
        groupDiv.classList.add('group-fights');
        groupDiv.innerHTML = `<h3>Group ${groupIndex + 1} Fights</h3>`;

        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const player1 = group[i];
                const player2 = group[j];
                const fightId = `fight-Z1-G${groupIndex + 1}-${player1.replace(/[^a-zA-Z0-9]/g, '')}-${player2.replace(/[^a-zA-Z0-9]/g, '')}`;

                const fightElement = document.createElement('div');
                fightElement.classList.add('fight-card');
                fightElement.innerHTML = `
                    <p>${player1} vs ${player2}</p>
                    <div class="score-input">
                        <label>Winner:</label>
                        <select id="${fightId}-winner">
                            <option value="">Select Winner</option>
                            <option value="${player1}">${player1}</option>
                            <option value="${player2}">${player2}</option>
                        </select>
                    </div>
                `;
                groupDiv.appendChild(fightElement);
            }
        }
        round1FightsContainer.appendChild(groupDiv);
    });
    finishRound1Btn.disabled = false;
}

function recordRound1Scores() {
    let allFightsRecorded = true;
    Object.keys(playerScores).forEach(player => playerScores[player] = 0);


    const fightCards = round1FightsContainer.querySelectorAll('.fight-card');
    fightCards.forEach(card => {
        const winnerSelect = card.querySelector('select');
        const winnerName = winnerSelect.value;

        if (winnerName === "") {
            allFightsRecorded = false;
        } else {
            if (playerScores[winnerName] !== undefined) {
                playerScores[winnerName] += 1;
            }
        }
    });
    return allFightsRecorded;
}

startRound1Btn.addEventListener('click', () => {
    showSection(round1Section);
    generateRound1Fights();
    saveState();
});

finishRound1Btn.addEventListener('click', () => {
    if (recordRound1Scores()) {
        showSection(round1ScoresSection);
        displayRound1Scores();
        saveState();
    } else {
        alert("Please select a winner for all fights before finishing Round 1.");
    }
});

// --- Step 4: Display Round 1 Scores ---
function displayRound1Scores() {
    round1ScoresContainer.innerHTML = '';

    const playersWithScores = Object.keys(playerScores).map(playerName => ({
        name: playerName,
        score: playerScores[playerName]
    }));

    window.tournamentGroups.forEach((group, groupIndex) => {
        const groupScoresDiv = document.createElement('div');
        groupScoresDiv.classList.add('group-scores-card');
        groupScoresDiv.innerHTML = `<h3>Group ${groupIndex + 1} Scores</h3><ul></ul>`;
        const ul = groupScoresDiv.querySelector('ul');

        const groupPlayersScores = playersWithScores
            .filter(p => group.includes(p.name))
            .sort((a, b) => b.score - a.score);

        groupPlayersScores.forEach(player => {
            const li = document.createElement('li');
            li.textContent = `${player.name}: ${player.score} points`;
            ul.appendChild(li);
        });
        round1ScoresContainer.appendChild(groupScoresDiv);
    });
    selectTopPlayersBtn.disabled = false;
}

// --- Step 5: Select Top 2 Players for Round 2 ---
selectTopPlayersBtn.addEventListener('click', () => {
    advancedPlayers = [];
    advancedPlayersList.innerHTML = '';

    const playersWithScores = Object.keys(playerScores).map(playerName => ({
        name: playerName,
        score: playerScores[playerName]
    }));

    window.tournamentGroups.forEach((group) => {
        const groupPlayersScores = playersWithScores
            .filter(p => group.includes(p.name))
            .sort((a, b) => b.score - a.score);

        const top2 = groupPlayersScores.slice(0, 2);
        top2.forEach(player => {
            advancedPlayers.push(player.name);
            const li = document.createElement('li');
            li.textContent = player.name;
            advancedPlayersList.appendChild(li);
        });
    });

    if (advancedPlayers.length !== 16) {
        alert(`Warning: Expected 16 players for Round 2, but found ${advancedPlayers.length}. This might be due to ties. Proceeding with ${advancedPlayers.length} players.`);
    }

    showSection(round2PrepSection);
    startRound2Btn.disabled = false;
    saveState();
});

// --- Step 6 & 7: Round 2 (Z2) - Group Fights ---
function generateRound2Fights() {
    round2GroupsContainer.innerHTML = '';
    round2FightsContainer.innerHTML = '';
    const shuffledAdvancedPlayers = shuffleArray([...advancedPlayers]);

    const r2Groups = [];
    const R2_PLAYERS_PER_GROUP = 4;
    const R2_NUM_GROUPS = 16 / R2_PLAYERS_PER_GROUP;

    for (let i = 0; i < R2_NUM_GROUPS; i++) {
        const group = shuffledAdvancedPlayers.slice(i * R2_PLAYERS_PER_GROUP, (i + 1) * R2_PLAYERS_PER_GROUP);
        r2Groups.push(group);

        const groupCard = document.createElement('div');
        groupCard.classList.add('group-card');
        groupCard.innerHTML = `<h3>R2 Group ${i + 1}</h3><ul></ul>`;
        const ul = groupCard.querySelector('ul');
        group.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player;
            ul.appendChild(li);
        });
        round2GroupsContainer.appendChild(groupCard);
    }

    window.round2Groups = r2Groups;

    const fights = [
        { id: 'R2-Fight1', team1: r2Groups[0], team2: r2Groups[3], team1Name: 'R2 Group 1', team2Name: 'R2 Group 4' },
        { id: 'R2-Fight2', team1: r2Groups[1], team2: r2Groups[2], team1Name: 'R2 Group 2', team2Name: 'R2 Group 3' }
    ];

    fights.forEach(fight => {
        const fightElement = document.createElement('div');
        fightElement.classList.add('team-fight-card');
        fightElement.innerHTML = `
            <h3>${fight.team1Name} vs ${fight.team2Name}</h3>
            <div class="team-fight-teams">
                <div class="team">
                    <h4>${fight.team1Name}</h4>
                    <ul>${fight.team1.map(p => `<li>${p}</li>`).join('')}</ul>
                </div>
                <div class="team">
                    <h4>${fight.team2Name}</h4>
                    <ul>${fight.team2.map(p => `<li>${p}</li>`).join('')}</ul>
                </div>
            </div>
            <div class="team-fight-selector">
                <label>Winning Group:</label>
                <select id="${fight.id}-winner">
                    <option value="">Select Winning Group</option>
                    <option value="${fight.team1Name}">${fight.team1Name}</option>
                    <option value="${fight.team2Name}">${fight.team2Name}</option>
                </select>
            </div>
        `;
        round2FightsContainer.appendChild(fightElement);
    });
    finishRound2Btn.disabled = false;
}

startRound2Btn.addEventListener('click', () => {
    showSection(round2Section);
    generateRound2Fights();
    saveState();
});

finishRound2Btn.addEventListener('click', () => {
    round2Winners = [];

    const fight1WinnerSelect = document.getElementById('R2-Fight1-winner');
    const fight2WinnerSelect = document.getElementById('R2-Fight2-winner');

    if (fight1WinnerSelect.value === "" || fight2WinnerSelect.value === "") {
        alert("Please select a winner for both group fights.");
        return;
    }

    if (fight1WinnerSelect.value === 'R2 Group 1') {
        round2Winners.push(...window.round2Groups[0]);
    } else {
        round2Winners.push(...window.round2Groups[3]);
    }

    if (fight2WinnerSelect.value === 'R2 Group 2') {
        round2Winners.push(...window.round2Groups[1]);
    } else {
        round2Winners.push(...window.round2Groups[2]);
    }

    if (round2Winners.length !== 8) {
        alert(`Error: Expected 8 players to proceed to Quarter-Finals, but found ${round2Winners.length}.`);
        return;
    }

    showSection(quarterFinalSection);
    generateQuarterFinalFights();
    saveState();
});

// --- Step 8: Quarter-Final (Z3) - 2v2 Fights ---
function generateQuarterFinalFights() {
    quarterFinalFightsContainer.innerHTML = '';
    const shuffledRound2Winners = shuffleArray([...round2Winners]);

    const qfFights = [
        { id: 'QF-Fight1', team1: [shuffledRound2Winners[0], shuffledRound2Winners[1]], team2: [shuffledRound2Winners[2], shuffledRound2Winners[3]] },
        { id: 'QF-Fight2', team1: [shuffledRound2Winners[4], shuffledRound2Winners[5]], team2: [shuffledRound2Winners[6], shuffledRound2Winners[7]] }
    ];

    qfFights.forEach(fight => {
        const fightElement = document.createElement('div');
        fightElement.classList.add('knockout-fight-card');
        fightElement.innerHTML = `
            <h4>Quarter-Final Fight:</h4>
            <div class="knockout-players">
                <div class="knockout-team">
                    <ul><li>${fight.team1[0]}</li><li>${fight.team1[1]}</li></ul>
                </div>
                <span class="knockout-vs">VS</span>
                <div class="knockout-team">
                    <ul><li>${fight.team2[0]}</li><li>${fight.team2[1]}</li></ul>
                </div>
            </div>
            <div class="score-input" style="justify-content: center; margin-top: 15px;">
                <label>Winning Team:</label>
                <select id="${fight.id}-winner">
                    <option value="">Select Winner</option>
                    <option value="${fight.team1.join(',')}">${fight.team1[0]} & ${fight.team1[1]}</option>
                    <option value="${fight.team2.join(',')}">${fight.team2[0]} & ${fight.team2[1]}</option>
                </select>
            </div>
        `;
        quarterFinalFightsContainer.appendChild(fightElement);
    });
    finishQuarterFinalBtn.disabled = false;
}

finishQuarterFinalBtn.addEventListener('click', () => {
    quarterFinalWinners = [];

    const fight1WinnerSelect = document.getElementById('QF-Fight1-winner');
    const fight2WinnerSelect = document.getElementById('QF-Fight2-winner');

    if (fight1WinnerSelect.value === "" || fight2WinnerSelect.value === "") {
        alert("Please select a winning team for both Quarter-Final fights.");
        return;
    }

    quarterFinalWinners.push(...fight1WinnerSelect.value.split(','));
    quarterFinalWinners.push(...fight2WinnerSelect.value.split(','));

    if (quarterFinalWinners.length !== 4) {
        alert(`Error: Expected 4 players to proceed to Semi-Finals, but found ${quarterFinalWinners.length}.`);
        return;
    }

    showSection(semiFinalSection);
    generateSemiFinalFights();
    saveState();
});

// --- Semi-Final (Z4) - 1v1 Fights ---
function generateSemiFinalFights() {
    semiFinalFightsContainer.innerHTML = '';
    const shuffledQuarterFinalWinners = shuffleArray([...quarterFinalWinners]);

    const sfFights = [
        { id: 'SF-Fight1', player1: shuffledQuarterFinalWinners[0], player2: shuffledQuarterFinalWinners[1] },
        { id: 'SF-Fight2', player1: shuffledQuarterFinalWinners[2], player2: shuffledQuarterFinalWinners[3] }
    ];

    sfFights.forEach(fight => {
        const fightElement = document.createElement('div');
        fightElement.classList.add('knockout-fight-card');
        fightElement.innerHTML = `
            <h4>Semi-Final Fight:</h4>
            <div class="knockout-players">
                <span>${fight.player1}</span>
                <span class="knockout-vs">VS</span>
                <span>${fight.player2}</span>
            </div>
            <div class="score-input" style="justify-content: center; margin-top: 15px;">
                <label>Winner:</label>
                <select id="${fight.id}-winner">
                    <option value="">Select Winner</option>
                    <option value="${fight.player1}">${fight.player1}</option>
                    <option value="${fight.player2}">${fight.player2}</option>
                </select>
            </div>
        `;
        semiFinalFightsContainer.appendChild(fightElement);
    });
    finishSemiFinalBtn.disabled = false;
}

finishSemiFinalBtn.addEventListener('click', () => {
    semiFinalWinners = [];
    semiFinalLosers = [];

    const fight1WinnerSelect = document.getElementById('SF-Fight1-winner');
    const fight2WinnerSelect = document.getElementById('SF-Fight2-winner');

    if (fight1WinnerSelect.value === "" || fight2WinnerSelect.value === "") {
        alert("Please select a winner for both Semi-Final fights.");
        return;
    }

    const sf1Winner = fight1WinnerSelect.value;
    const sf1Loser = Array.from(fight1WinnerSelect.options).find(option => option.value !== "" && option.value !== sf1Winner)?.value;

    const sf2Winner = fight2WinnerSelect.value;
    const sf2Loser = Array.from(fight2WinnerSelect.options).find(option => option.value !== "" && option.value !== sf2Winner)?.value;

    semiFinalWinners.push(sf1Winner, sf2Winner);
    semiFinalLosers.push(sf1Loser, sf2Loser);

    semiFinalLosers = semiFinalLosers.filter(loser => !semiFinalWinners.includes(loser));

    if (semiFinalWinners.length !== 2 || semiFinalLosers.length !== 2) {
        alert(`Error: Expected 2 finalists and 2 semi-final losers, but found ${semiFinalWinners.length} finalists and ${semiFinalLosers.length} losers.`);
        return;
    }

    showSection(finalSection);
    generateFinalFight();
    saveState();
});

// --- Final Round & Awards ---
function generateFinalFight() {
    finalFightContainer.innerHTML = '';
    const finalPlayers = shuffleArray([...semiFinalWinners]);

    const fightElement = document.createElement('div');
    fightElement.classList.add('knockout-fight-card');
    fightElement.innerHTML = `
        <h4>The Grand Final:</h4>
        <div class="knockout-players">
            <span>${finalPlayers[0]}</span>
            <span class="knockout-vs">VS</span>
            <span>${finalPlayers[1]}</span>
        </div>
        <div class="score-input" style="justify-content: center; margin-top: 15px;">
            <label>Tournament Winner:</label>
            <select id="final-winner">
                <option value="">Select Winner</option>
                <option value="${finalPlayers[0]}">${finalPlayers[0]}</option>
                <option value="${finalPlayers[1]}">${finalPlayers[1]}</option>
            </select>
        </div>
    `;
    finalFightContainer.appendChild(fightElement);
    showAwardsBtn.disabled = false;
}

showAwardsBtn.addEventListener('click', () => {
    const finalWinnerSelect = document.getElementById('final-winner');
    const winner = finalWinnerSelect.value;

    if (winner === "") {
        alert("Please select the Tournament Winner.");
        return;
    }

    const finalist = semiFinalWinners.find(p => p !== winner);

    awardsContainer.innerHTML = `<h3>Tournament Prizes</h3><ul></ul>`;
    const ul = awardsContainer.querySelector('ul');

    let liWinner = document.createElement('li');
    liWinner.innerHTML = `<strong>${winner} (Champion):</strong> 100M Food, 50M Iron, Best blessing from King`;
    ul.appendChild(liWinner);

    let liFinalist = document.createElement('li');
    liFinalist.innerHTML = `<strong>${finalist} (Runner-up):</strong> 50M Food, 25M Iron, Second best King blessing`;
    ul.appendChild(liFinalist);

    semiFinalLosers.forEach(loser => {
        let liLoser = document.createElement('li');
        liLoser.innerHTML = `<strong>${loser} (Semi-Finalist):</strong> 25M Food, 10M Iron, 3rd best King blessing`;
        ul.appendChild(liLoser);
    });

    awardsContainer.style.display = 'block';
    saveState();
});

// --- New: Reset Progress Logic ---
resetProgressBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset all tournament progress? This cannot be undone.")) {
        localStorage.removeItem('tournamentState'); // Clear the saved state from localStorage
        window.location.reload(); // Reload the page to start fresh
    }
});


// --- Initial Setup ---
loadState();
updatePlayerCount();
