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

// Global variables for Firebase (initialized in index.html)
// const db = firebase.firestore(); // This is now initialized globally in index.html

// Tournament ID for saving/loading
const TOURNAMENT_DOC_ID = 'currentTournament';

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

// Elements for player replacement
const playerReplacementSection = document.getElementById('player-replacement-section');
const playerToReplaceInput = document.getElementById('playerToReplaceInput');
const newPlayerNameInput = document.getElementById('newPlayerNameInput');
const replacePlayerBtn = document.getElementById('replacePlayerBtn');
const replacementStatusMessage = document.getElementById('replacementStatusMessage');

// Step-specific Save & Proceed buttons
const loadTournamentBtn = document.getElementById('loadTournamentBtn'); // Only this remains for initial load
const saveAndProceedStep2Btn = document.getElementById('saveAndProceedStep2Btn');
const saveAndProceedStep3Btn = document.getElementById('saveAndProceedStep3Btn');
const saveAndProceedStep4Btn = document.getElementById('saveAndProceedStep4Btn');
const saveAndProceedStep5Btn = document.getElementById('saveAndProceedStep5Btn');
const saveAndProceedStep6Btn = document.getElementById('saveAndProceedStep6Btn');
const saveAndProceedStep7Btn = document.getElementById('saveAndProceedStep7Btn');
const saveAndProceedStep8Btn = document.getElementById('saveAndProceedStep8Btn');
const saveAndProceedStep9Btn = document.getElementById('saveAndProceedStep9Btn');


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
        if (section) {
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
    if (!window.tournamentGroups) {
        console.warn('renderGroups: window.tournamentGroups is undefined. Cannot render.');
        return;
    }

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

/**
 * Saves the current state of the tournament to Firestore.
 * This includes players, groups, scores, and winners from various rounds.
 * @param {string} currentSectionId - The ID of the section that should be active after loading.
 * @param {object} fightResults - An object containing selected winners for current fights (Round 1, Round 2, QF, SF, Final).
 */
async function saveTournamentState(currentSectionId, fightResults = {}) {
    console.log(`Attempting to save tournament state for section: ${currentSectionId}`);
    console.log('Current players:', players);
    console.log('Current tournamentGroups:', window.tournamentGroups);
    console.log('Current playerScores:', playerScores);
    console.log('Current fightResults:', fightResults);

    try {
        const tournamentState = {
            players: players,
            tournamentGroups: window.tournamentGroups || [], // Round 1 groups
            playerScores: playerScores,
            advancedPlayers: advancedPlayers,
            round2Groups: window.round2Groups || [], // Round 2 groups
            round2Winners: round2Winners,
            quarterFinalWinners: quarterFinalWinners,
            semiFinalWinners: semiFinalWinners,
            semiFinalLosers: semiFinalLosers,
            currentSectionId: currentSectionId, // Save the section to return to
            fightResults: fightResults // Save results of active fights
        };
        await db.collection('tournaments').doc(TOURNAMENT_DOC_ID).set(tournamentState);
        console.log('Tournament state saved successfully!');
        // alert('Tournament state saved successfully!'); // Optional: for debugging, remove in production
    } catch (error) {
        console.error('Error saving tournament state:', error);
        alert('Error saving tournament state. Check console for details.');
    }
}

/**
 * Loads the tournament state from Firestore and restores the UI.
 */
async function loadTournamentState() {
    try {
        const doc = await db.collection('tournaments').doc(TOURNAMENT_DOC_ID).get();
        if (doc.exists) {
            const data = doc.data();

            // Clear current state
            players.length = 0; // Clear existing players
            playerList.innerHTML = '';
            Object.keys(playerScores).forEach(key => delete playerScores[key]);
            advancedPlayers.length = 0;
            round2Winners.length = 0;
            quarterFinalWinners.length = 0;
            semiFinalWinners.length = 0;
            semiFinalLosers.length = 0;

            // Restore state
            players.push(...data.players);
            data.players.forEach(player => { // Re-render player list
                const listItem = document.createElement('li');
                listItem.textContent = player;
                playerList.appendChild(listItem);
            });
            updatePlayerCount(); // Update player count and button states

            Object.assign(playerScores, data.playerScores); // Restore player scores

            window.tournamentGroups = data.tournamentGroups || [];
            window.round2Groups = data.round2Groups || [];
            advancedPlayers.push(...data.advancedPlayers);
            round2Winners.push(...data.round2Winners);
            quarterFinalWinners.push(...data.quarterFinalWinners);
            semiFinalLosers.push(...data.semiFinalLosers); // Fix: this was missing from prev iteration
            quarterFinalWinners.push(...data.quarterFinalWinners); // Fix: this was missing from prev iteration


            alert('Tournament state loaded successfully!');

            // Re-render UI based on loaded state
            renderUIFromLoadedState(data.currentSectionId, data.fightResults || {});

        } else {
            alert('No saved tournament found. Start a new one!');
            // Ensure UI is in initial state if no tournament found
            showSection(document.getElementById('add-players-section'));
            createGroupsBtn.disabled = players.length !== MAX_PLAYERS;
            addPlayerBtn.disabled = false;
            playerNameInput.disabled = false;
        }
    } catch (error) {
        console.error('Error loading tournament state:', error);
        alert('Error loading tournament state. Check console for details.');
    }
}


/**
 * Re-renders the UI elements based on the loaded tournament state.
 * @param {string} currentSectionId - The ID of the section to display.
 * @param {object} loadedFightResults - Object containing saved fight winners.
 */
function renderUIFromLoadedState(currentSectionId, loadedFightResults) {
    // Show the correct section
    const targetSection = document.getElementById(currentSectionId);
    showSection(targetSection);

    // Re-render elements that depend on global state and disable previous step buttons
    if (window.tournamentGroups && window.tournamentGroups.length > 0) {
        renderGroups(); // Re-render Round 1 groups
        playerReplacementSection.style.display = 'block';
        createGroupsBtn.disabled = true; // Keep disabled if groups already created
        addPlayerBtn.disabled = true;
        playerNameInput.disabled = true;
        saveAndProceedStep2Btn.disabled = false; // Enable save & proceed for current step
        startRound1Btn.disabled = false; // Enable proceed button for current step
    } else {
        // If groups are not created yet, ensure "create groups" is enabled based on player count
        createGroupsBtn.disabled = players.length !== MAX_PLAYERS;
    }


    if (currentSectionId === 'round1-section' || currentSectionId === 'round1-scores-section' ||
        currentSectionId === 'round2-prep-section' || currentSectionId === 'round2-section' ||
        currentSectionId === 'quarter-final-section' || currentSectionId === 'semi-final-section' ||
        currentSectionId === 'final-section') {
        generateRound1Fights(loadedFightResults); // Re-populate round 1 fights with loaded winners
        finishRound1Btn.disabled = false; // Enable proceed button
        saveAndProceedStep3Btn.disabled = false; // Enable save & proceed
    }
    if (currentSectionId === 'round1-scores-section' || currentSectionId === 'round2-prep-section' ||
        currentSectionId === 'round2-section' || currentSectionId === 'quarter-final-section' ||
        currentSectionId === 'semi-final-section' || currentSectionId === 'final-section') {
        displayRound1Scores(); // Re-display round 1 scores
        selectTopPlayersBtn.disabled = false; // Enable proceed button
        saveAndProceedStep4Btn.disabled = false; // Enable save & proceed
    }
    if (currentSectionId === 'round2-prep-section' || currentSectionId === 'round2-section' ||
        currentSectionId === 'quarter-final-section' || currentSectionId === 'semi-final-section' ||
        currentSectionId === 'final-section') {
        // Re-populate advancedPlayersList
        advancedPlayersList.innerHTML = '';
        advancedPlayers.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player;
            advancedPlayersList.appendChild(li);
        });
        startRound2Btn.disabled = false; // Enable proceed button
        saveAndProceedStep5Btn.disabled = false; // Enable save & proceed
    }
    if (currentSectionId === 'round2-section' || currentSectionId === 'quarter-final-section' ||
        currentSectionId === 'semi-final-section' || currentSectionId === 'final-section') {
        generateRound2Fights(loadedFightResults); // Re-populate round 2 fights with loaded winners
        finishRound2Btn.disabled = false; // Enable proceed button
        saveAndProceedStep6Btn.disabled = false; // Enable save & proceed
    }
    if (currentSectionId === 'quarter-final-section' || currentSectionId === 'semi-final-section' ||
        currentSectionId === 'final-section') {
        generateQuarterFinalFights(loadedFightResults); // Re-populate quarter-final fights with loaded winners
        finishQuarterFinalBtn.disabled = false; // Enable proceed button
        saveAndProceedStep7Btn.disabled = false; // Enable save & proceed
    }
     if (currentSectionId === 'semi-final-section' || currentSectionId === 'final-section') {
        generateSemiFinalFights(loadedFightResults); // Re-populate semi-final fights with loaded winners
        finishSemiFinalBtn.disabled = false; // Enable proceed button
        saveAndProceedStep8Btn.disabled = false; // Enable save & proceed
    }
    if (currentSectionId === 'final-section') {
        generateFinalFight(loadedFightResults); // Re-populate final fight with loaded winner
        showAwardsBtn.disabled = false; // Enable proceed button
        saveAndProceedStep9Btn.disabled = false; // Enable save & proceed
    }
    // If awards were already shown
    if (currentSectionId === 'awards-section') { // This section is not explicitly defined in HTML, but can be a logical step
        showAwardsBtn.click(); // Trigger awards display to re-render
    }
}


// Function to collect current fight selections for saving
function getCurrentFightSelections() {
    const fightResults = {};

    // Round 1 Fights
    round1FightsContainer.querySelectorAll('.fight-card').forEach(card => {
        const winnerSelect = card.querySelector('select');
        const id = winnerSelect.id; // e.g., "fight-Z1-G1-PlayerA-PlayerB-winner"
        if (winnerSelect.value) {
            fightResults[id] = winnerSelect.value;
        }
    });

    // Round 2 Fights
    round2FightsContainer.querySelectorAll('.team-fight-card').forEach(card => {
        const winnerSelect = card.querySelector('select');
        const id = winnerSelect.id; // e.g., "R2-Fight1-winner"
        if (winnerSelect.value) {
            fightResults[id] = winnerSelect.value;
        }
    });

    // Quarter-Final Fights
    quarterFinalFightsContainer.querySelectorAll('.knockout-fight-card').forEach(card => {
        const winnerSelect = card.querySelector('select');
        const id = winnerSelect.id; // e.g., "QF-Fight1-winner"
        if (winnerSelect.value) {
            fightResults[id] = winnerSelect.value;
        }
    });

    // Semi-Final Fights
    semiFinalFightsContainer.querySelectorAll('.knockout-fight-card').forEach(card => {
        const winnerSelect = card.querySelector('select');
        const id = winnerSelect.id; // e.g., "SF-Fight1-winner"
        if (winnerSelect.value) {
            fightResults[id] = winnerSelect.value;
        }
    });

    // Final Fight
    const finalWinnerSelect = document.getElementById('final-winner');
    if (finalWinnerSelect && finalWinnerSelect.value) {
        fightResults['final-winner'] = finalWinnerSelect.value;
    }

    return fightResults;
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

    playerNameInput.value = ''; // Clear the input field
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
});

playerNameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addPlayerBtn.click();
    }
});

// --- Step 2: Create Groups (Round Z1) ---
createGroupsBtn.addEventListener('click', async () => { // Make async to await save
    if (players.length !== MAX_PLAYERS) {
        alert(`Please add exactly ${MAX_PLAYERS} players before creating groups.`);
        return;
    }

    const shuffledPlayers = shuffleArray([...players]);
    window.tournamentGroups = []; // Global storage for Round 1 groups
    for (let i = 0; i < NUM_GROUPS; i++) {
        const group = shuffledPlayers.slice(i * PLAYERS_PER_GROUP, (i + 1) * PLAYERS_PER_GROUP);
        window.tournamentGroups.push(group);

        // Initialize scores for all players to 0 (only if they aren't already scored in previous rounds)
        group.forEach(player => {
            if (playerScores[player] === undefined) playerScores[player] = 0;
        });
    }

    renderGroups(); // Call the new rendering function
    showSection(groupsSection);
    createGroupsBtn.disabled = true;
    addPlayerBtn.disabled = true;
    playerNameInput.disabled = true;
    startRound1Btn.disabled = false;
    playerReplacementSection.style.display = 'block'; // Show replacement option

    // Save state after group creation
    console.log("Groups created. Initiating save from createGroupsBtn.");
    await saveTournamentState('groups-section');
});

// New Event Listener for Replace Player Button
replacePlayerBtn.addEventListener('click', async () => { // Make async to await save
    const playerToReplace = playerToReplaceInput.value.trim();
    const newPlayerName = newPlayerNameInput.value.trim();

    // Clear previous messages
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

    // Check if new player already exists in the overall players list (excluding the one being replaced)
    if (players.includes(newPlayerName) && newPlayerName !== playerToReplace) {
        replacementStatusMessage.textContent = `"${newPlayerName}" already exists in the player list. Please use a unique name.`;
        replacementStatusMessage.classList.add('error');
        return;
    }

    let replaced = false;
    let groupIndexFound = -1;

    // Find the player in window.tournamentGroups and replace them
    for (let i = 0; i < window.tournamentGroups.length; i++) {
        const group = window.tournamentGroups[i];
        const index = group.indexOf(playerToReplace);
        if (index !== -1) {
            group[index] = newPlayerName; // Replace in the group
            groupIndexFound = i;
            replaced = true;
            break; // Player found and replaced, exit loop
        }
    }

    if (replaced) {
        // Update the main 'players' array
        const globalPlayerIndex = players.indexOf(playerToReplace);
        if (globalPlayerIndex !== -1) {
            players[globalPlayerIndex] = newPlayerName;
        } else {
             // This case should ideally not happen if playerToReplace was found in a group,
             // but it's a safeguard if player data gets out of sync.
             replacementStatusMessage.textContent = `Warning: "${playerToReplace}" was found in a group but not in the global player list.`;
             replacementStatusMessage.classList.add('error');
        }


        // Update playerScores: remove old player's score, add new player with 0 score
        delete playerScores[playerToReplace];
        playerScores[newPlayerName] = 0; // New player starts with 0 score for Round 1

        renderGroups(); // Re-render the updated groups display
        playerToReplaceInput.value = '';
        newPlayerNameInput.value = '';
        replacementStatusMessage.textContent = `"${playerToReplace}" successfully replaced by "${newPlayerName}" in Group ${groupIndexFound + 1}.`;
        replacementStatusMessage.classList.add('success');

        // Save state after replacement
        console.log("Player replaced. Initiating save from replacePlayerBtn.");
        await saveTournamentState('groups-section');
    } else {
        replacementStatusMessage.textContent = `"${playerToReplace}" not found in any group. Please check the spelling.`;
        replacementStatusMessage.classList.add('error');
    }
});

saveAndProceedStep2Btn.addEventListener('click', async () => {
    // Only save the state, don't automatically proceed. The startRound1Btn handles actual progression.
    console.log("Save & Proceed (Step 2) button clicked. Initiating save.");
    await saveTournamentState('groups-section');
    alert('Groups and Player Replacements saved!');
});


// --- Step 3: Round 1 (Z1) - Intra-Group Fights ---
/**
 * Generates Round 1 fight UI.
 * @param {object} loadedFightResults - Optional: Object containing saved fight winners to pre-select dropdowns.
 */
function generateRound1Fights(loadedFightResults = {}) {
    round1FightsContainer.innerHTML = ''; // Clear previous fights
    window.tournamentGroups.forEach((group, groupIndex) => {
        const groupDiv = document.createElement('div');
        groupDiv.classList.add('group-fights');
        groupDiv.innerHTML = `<h3>Group ${groupIndex + 1} Fights</h3>`;

        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const player1 = group[i];
                const player2 = group[j];
                // Ensure unique ID even if player names contain spaces or special chars
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

                // If loading, pre-select the winner
                const winnerSelect = fightElement.querySelector('select');
                if (loadedFightResults[`${fightId}-winner`]) {
                    winnerSelect.value = loadedFightResults[`${fightId}-winner`];
                }
            }
        }
        round1FightsContainer.appendChild(groupDiv);
    });
    finishRound1Btn.disabled = false;
}

function recordRound1Scores() {
    let allFightsRecorded = true;
    // Reset all player scores before recalculating for Round 1
    // Important: only reset scores for players currently in the tournament,
    // not old players who might have been replaced.
    Object.keys(playerScores).forEach(player => playerScores[player] = 0);


    const fightCards = round1FightsContainer.querySelectorAll('.fight-card');
    fightCards.forEach(card => {
        const winnerSelect = card.querySelector('select');
        const winnerName = winnerSelect.value;

        if (winnerName === "") {
            allFightsRecorded = false;
        } else {
            // Ensure the winnerName exists in playerScores (it should, as new players are initialized)
            if (playerScores[winnerName] !== undefined) {
                playerScores[winnerName] += 1; // Assign 1 point to the winner
            }
        }
    });
    return allFightsRecorded;
}

startRound1Btn.addEventListener('click', async () => { // Make async
    showSection(round1Section);
    generateRound1Fights();
    console.log("Starting Round 1. Initiating save from startRound1Btn.");
    await saveTournamentState('round1-section'); // Save state when entering this section
});

finishRound1Btn.addEventListener('click', async () => { // Make async
    if (recordRound1Scores()) {
        showSection(round1ScoresSection);
        displayRound1Scores();
        console.log("Finishing Round 1. Initiating save from finishRound1Btn.");
        await saveTournamentState('round1-scores-section'); // Save state after finishing Round 1 and showing scores
    } else {
        alert("Please select a winner for all fights before finishing Round 1.");
    }
});

saveAndProceedStep3Btn.addEventListener('click', async () => {
    const fightResults = getCurrentFightSelections();
    console.log("Save & Proceed (Step 3) button clicked. Initiating save for Round 1 fights.");
    await saveTournamentState('round1-section', fightResults); // Save current selections for Round 1
    alert('Round 1 Fights saved!');
});


// --- Step 4: Display Round 1 Scores ---
function displayRound1Scores() {
    round1ScoresContainer.innerHTML = ''; // Clear previous scores

    const playersWithScores = Object.keys(playerScores).map(playerName => ({
        name: playerName,
        score: playerScores[playerName]
    }));

    window.tournamentGroups.forEach((group) => { // Use group directly, no need for index unless for display
        const groupScoresDiv = document.createElement('div');
        groupScoresDiv.classList.add('group-scores-card');
        // Find the original group index for display purposes
        const groupIndex = window.tournamentGroups.findIndex(g => g.every(p => group.includes(p)) && group.every(p => g.includes(p)));

        groupScoresDiv.innerHTML = `<h3>Group ${groupIndex !== -1 ? groupIndex + 1 : 'N/A'} Scores</h3><ul></ul>`;
        const ul = groupScoresDiv.querySelector('ul');

        const groupPlayersScores = playersWithScores
            .filter(p => group.includes(p.name))
            .sort((a, b) => b.score - a.score); // Sort by score descending

        groupPlayersScores.forEach(player => {
            const li = document.createElement('li');
            li.textContent = `${player.name}: ${player.score} points
