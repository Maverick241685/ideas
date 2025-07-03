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

const addPlayersSection = document.getElementById('add-players-section'); // Get the section itself
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
const finishRound2Btn = document = document.getElementById('finishRound2Btn');

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
    // createGroupsBtn.disabled logic should remain the same
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
        addPlayersSection, // Use the stored reference
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

    // Control player input elements based on the section being shown
    if (sectionToShow === addPlayersSection) {
        addPlayerBtn.disabled = false;
        playerNameInput.disabled = false;
    } else {
        addPlayerBtn.disabled = true;
        playerNameInput.disabled = true;
    }


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
                        startRound1Btn.disabled = false;
                        playerReplacementSection.style.display = 'block'; // Show replacement option
                    }
                } else if (state.currentSectionId === 'round1-section') {
                    renderGroups(); // Groups must be rendered before fights
                    generateRound1Fights(true); // Pass true to indicate a reload for real-time scores
                    finishRound1Btn.disabled = false;
                    playerReplacementSection.style.display = 'none'; // Hide replacement once round starts
                } else if (state.currentSectionId === 'round1-scores-section') {
                    renderGroups();
                    displayRound1Scores();
                    selectTopPlayersBtn.disabled = false;
                    playerReplacementSection.style.display = 'none';
                } else if (state.currentSectionId === 'round2-prep-section') {
                    advancedPlayersList.innerHTML = ''; // Clear before re-listing
                    advancedPlayers.forEach(player => {
                        const li = document.createElement('li');
                        li.textContent = player;
                        advancedPlayersList.appendChild(li);
                    });
                    startRound2Btn.disabled = false;
                    playerReplacementSection.style.display = 'none';
                } else if (state.currentSectionId === 'round2-section') {
                    generateRound2Fights();
                    finishRound2Btn.disabled = false;
                    playerReplacementSection.style.display = 'none';
                } else if (state.currentSectionId === 'quarter-final-section') {
                    generateQuarterFinalFights();
                    finishQuarterFinalBtn.disabled = false;
                    playerReplacementSection.style.display = 'none';
                } else if (state.currentSectionId === 'semi-final-section') {
                    generateSemiFinalFights();
                    finishSemiFinalBtn.disabled = false;
                    playerReplacementSection.style.display = 'none';
                } else if (state.currentSectionId === 'final-section') {
                    generateFinalFight();
                    showAwardsBtn.disabled = false;
                    playerReplacementSection.style.display = 'none';
                }
            } else {
                // If no specific section was saved, default to add-players-section and ensure inputs are enabled
                showSection(addPlayersSection);
            }

            console.log('Tournament state loaded successfully.');
        } else {
            console.log('No saved tournament state found. Starting new tournament.');
            showSection(addPlayersSection); // Ensure add players is shown and inputs enabled
        }
    } catch (e) {
        console.error('Error loading state from localStorage:', e);
        alert('Could not load previous tournament progress. Starting a new tournament.');
        localStorage.removeItem('tournamentState'); // Clear corrupted state
        showSection(addPlayersSection); // Ensure add players is shown and inputs enabled
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
            // Initialize scores for all players to 0
            playerScores[player] = 0;
        });
    }

    renderGroups();
    showSection(groupsSection);
    createGroupsBtn.disabled = true;
    // The showSection function now handles disabling addPlayerBtn and playerNameInput
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

        // Transfer score if player had one, otherwise initialize to 0
        playerScores[newPlayerName] = playerScores[playerToReplace] || 0;
        delete playerScores[playerToReplace];


        renderGroups();
        playerToReplaceInput.value = '';
        newPlayerNameInput.value = '';
        replacementStatusMessage.textContent = `"${playerToReplace}" successfully replaced by "${newPlayerName}" in Group ${groupIndexFound + 1}.`;
        replacementStatusMessage.classList.add('success');

        // If Round 1 fights are visible, update them too
        if (round1Section.style.display === 'block') {
            generateRound1Fights(true); // Regenerate fights to update player names
        } else if (round1ScoresSection.style.display === 'block') {
            displayRound1Scores(); // Update scores display
        }

    } else {
        replacementStatusMessage.textContent = `"${playerToReplace}" not found in any group. Please check the spelling.`;
        replacementStatusMessage.classList.add('error');
    }
    saveState();
});


// --- Step 3: Round 1 (Z1) - Intra-Group Fights ---
// Added a parameter 'isReload' to differentiate between initial generation and state load
function generateRound1Fights(isReload = false) {
    round1FightsContainer.innerHTML = ''; // Clear previous fights

    // Create a container for real-time scores
    const realTimeScoresDiv = document.createElement('div');
    realTimeScoresDiv.id = 'realTimeRound1Scores';
    realTimeScoresDiv.classList.add('card', 'real-time-scores');
    round1FightsContainer.appendChild(realTimeScoresDiv);

    window.tournamentGroups.forEach((group, groupIndex) => {
        const groupDiv = document.createElement('div');
        groupDiv.classList.add('group-fights');
        groupDiv.innerHTML = `<h3>Group ${groupIndex + 1} Fights</h3>`;

        // Store selected winners temporarily to re-populate dropdowns on reload
        const currentSelections = {};
        if (isReload) {
            // Collect current selections before re-generating
            document.querySelectorAll('[id^="fight-Z1-G"][id$="-winner"]').forEach(select => {
                currentSelections[select.id] = select.value;
            });
        }

        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const player1 = group[i];
                const player2 = group[j];
                // Sanitize player names for use in element IDs
                const sanitizedPlayer1 = player1.replace(/[^a-zA-Z0-9]/g, '');
                const sanitizedPlayer2 = player2.replace(/[^a-zA-Z0-9]/g, '');
                const fightId = `fight-Z1-G${groupIndex + 1}-${sanitizedPlayer1}-${sanitizedPlayer2}`;

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

                // Add event listener for real-time updates
                const winnerSelect = fightElement.querySelector(`#${fightId}-winner`);
                winnerSelect.addEventListener('change', (event) => {
                    // Update scores locally (reset for selected player, then re-calculate)
                    recordRound1Scores(); // Re-calculate all scores after a change
                    updateScoreTable(); // Update the displayed table
                    saveState(); // Save state after each change
                });

                // Restore selected value if reloading
                if (isReload && currentSelections[`${fightId}-winner`] !== undefined) {
                    winnerSelect.value = currentSelections[`${fightId}-winner`];
                }
            }
        }
        round1FightsContainer.appendChild(groupDiv);
    });

    // Initial update of score table
    recordRound1Scores(); // Make sure playerScores are correct first
    updateScoreTable(); // Display the scores table
    finishRound1Btn.disabled = false;
}


// --- New: Update Real-time Score Table ---
function updateScoreTable() {
    const realTimeScoresDiv = document.getElementById('realTimeRound1Scores');
    if (!realTimeScoresDiv) return; // Exit if the container doesn't exist

    realTimeScoresDiv.innerHTML = '<h2>Current Round 1 Scores</h2>';
    const scoreTable = document.createElement('div');
    scoreTable.classList.add('scores-table-grid'); // Use a grid for layout

    window.tournamentGroups.forEach((group, groupIndex) => {
        const groupScoresCard = document.createElement('div');
        groupScoresCard.classList.add('group-scores-card'); // Reusing existing card style
        groupScoresCard.innerHTML = `<h3>Group ${groupIndex + 1}</h3><ul></ul>`;
        const ul = groupScoresCard.querySelector('ul');

        const groupPlayersScores = group.map(playerName =>
