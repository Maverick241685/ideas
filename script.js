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

// --- Global variables for tournament management ---
let currentActiveTournamentId = null; // Stores the ID of the currently loaded/active tournament

// Tournament ID for saving/loading (now dynamic, but kept for save calls where an ID isn't explicitly passed)
// This will be used when saving the *current* state of the *active* tournament.
const DEFAULT_DOC_ID = 'defaultCurrentTournament'; // A fallback/initial ID

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

// Step-specific Save & Proceed buttons (now these will save to currentActiveTournamentId)
const manageTournamentsBtn = document.getElementById('manageTournamentsBtn'); // Renamed from loadTournamentBtn
const saveAndProceedStep2Btn = document.getElementById('saveAndProceedStep2Btn');
const saveAndProceedStep3Btn = document.getElementById('saveAndProceedStep3Btn');
const saveAndProceedStep4Btn = document.getElementById('saveAndProceedStep4Btn');
const saveAndProceedStep5Btn = document.getElementById('saveAndProceedStep5Btn');
const saveAndProceedStep6Btn = document.getElementById('saveAndProceedStep6Btn');
const saveAndProceedStep7Btn = document.getElementById('saveAndProceedStep7Btn');
const saveAndProceedStep8Btn = document.getElementById('saveAndProceedStep8Btn');
const saveAndProceedStep9Btn = document.getElementById('saveAndProceedStep9Btn');

// --- New Tournament Management DOM Elements ---
const tournamentManagementSection = document.getElementById('tournament-management-section');
const saveTournamentNameInput = document.getElementById('saveTournamentNameInput');
const saveNewTournamentBtn = document.getElementById('saveNewTournamentBtn');
const savedTournamentsList = document.getElementById('savedTournamentsList');
const saveStatusMessage = document.getElementById('saveStatusMessage');
const closeTournamentManagerBtn = document.getElementById('closeTournamentManagerBtn');


// --- Helper Functions ---

function updatePlayerCount() {
    playerCountSpan.textContent = players.length;
    createGroupsBtn.disabled = players.length !== MAX_PLAYERS;
    console.log(`Player count updated: ${players.length}. Create Groups button disabled: ${createGroupsBtn.disabled}`);
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
        finalSection,
        tournamentManagementSection // Add the new management section
    ];
    sections.forEach(section => {
        if (section) {
            section.style.display = 'none';
        }
    });
    if (sectionToShow) {
        sectionToShow.style.display = 'block';
        console.log(`Showing section: ${sectionToShow.id}`);
    }
}

// Function to render groups (extracted for reusability)
function renderGroups() {
    groupsContainer.innerHTML = ''; // Clear previous groups
    if (!window.tournamentGroups || window.tournamentGroups.length === 0) {
        console.warn('renderGroups: window.tournamentGroups is undefined or empty. Cannot render.');
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
    console.log('Groups rendered in UI.');
}

/**
 * Saves the current state of the tournament to Firestore.
 * This includes players, groups, scores, and winners from various rounds.
 * @param {string} currentSectionId - The ID of the section that should be active after loading.
 * @param {object} fightResults - An object containing selected winners for current fights (Round 1, Round 2, QF, SF, Final).
 * @param {string} [tournamentIdToSave=currentActiveTournamentId || DEFAULT_DOC_ID] - The ID of the tournament document to save to.
 */
async function saveTournamentState(currentSectionId, fightResults = {}, tournamentIdToSave = currentActiveTournamentId || DEFAULT_DOC_ID) {
    console.log(`Attempting to save tournament state for section: ${currentSectionId} to ID: ${tournamentIdToSave}`);
    saveStatusMessage.textContent = ''; // Clear previous messages

    if (!tournamentIdToSave) {
        saveStatusMessage.textContent = 'Error: No tournament ID provided for saving.';
        saveStatusMessage.className = 'status-message error';
        console.error('No tournament ID to save to.');
        return;
    }

    // Transform nested arrays for Firestore compatibility
    const serializableTournamentGroups = {};
    if (window.tournamentGroups && window.tournamentGroups.length > 0) {
        window.tournamentGroups.forEach((group, index) => {
            serializableTournamentGroups[`group${index}`] = group;
        });
    }

    const serializableRound2Groups = {};
    if (window.round2Groups && window.round2Groups.length > 0) {
        window.round2Groups.forEach((group, index) => {
            serializableRound2Groups[`group${index}`] = group;
        });
    }

    const tournamentState = {
        name: tournamentIdToSave, // Store the name within the document
        lastSaved: firebase.firestore.FieldValue.serverTimestamp(), // Timestamp
        players: players,
        tournamentGroups: serializableTournamentGroups, // Save as object
        playerScores: playerScores,
        advancedPlayers: advancedPlayers,
        round2Groups: serializableRound2Groups, // Save as object
        round2Winners: round2Winners,
        quarterFinalWinners: quarterFinalWinners,
        semiFinalWinners: semiFinalWinners,
        semiFinalLosers: semiFinalLosers,
        currentSectionId: currentSectionId, // Save the section to return to
        fightResults: fightResults // Save results of active fights
    };

    console.log('State being prepared for save:', tournamentState);

    try {
        await db.collection('tournaments').doc(tournamentIdToSave).set(tournamentState);
        console.log(`Tournament state saved successfully to "${tournamentIdToSave}"!`);
        saveStatusMessage.textContent = `Tournament "${tournamentIdToSave}" saved successfully!`;
        saveStatusMessage.className = 'status-message success';
        currentActiveTournamentId = tournamentIdToSave; // Set as active
    } catch (error) {
        console.error('Error saving tournament state:', error);
        saveStatusMessage.textContent = `Error saving tournament "${tournamentIdToSave}": ${error.message}`;
        saveStatusMessage.className = 'status-message error';
    }
}

/**
 * Loads the tournament state from Firestore and restores the UI.
 * @param {string} tournamentId - The ID of the tournament document to load.
 */
async function loadTournamentState(tournamentId) {
    console.log(`Attempting to load tournament state for ID: ${tournamentId}...`);
    try {
        const doc = await db.collection('tournaments').doc(tournamentId).get();
        if (doc.exists) {
            const data = doc.data();
            console.log('Tournament data loaded:', data);

            // Clear current state
            players.length = 0; // Clear existing players
            playerList.innerHTML = '';
            Object.keys(playerScores).forEach(key => delete playerScores[key]);
            advancedPlayers.length = 0;
            round2Winners.length = 0;
            quarterFinalWinners.length = 0;
            semiFinalWinners.length = 0;
            semiFinalLosers.length = 0;
            window.tournamentGroups = [];
            window.round2Groups = [];


            // Restore state
            players.push(...(data.players || []));
            players.forEach(player => { // Re-render player list
                const listItem = document.createElement('li');
                listItem.textContent = player;
                playerList.appendChild(listItem);
            });
            updatePlayerCount(); // Update player count and button states

            Object.assign(playerScores, data.playerScores || {}); // Restore player scores, handle if undefined

            // Reconstruct tournamentGroups from object
            if (data.tournamentGroups) {
                const loadedGroups = Object.keys(data.tournamentGroups)
                    .sort((a, b) => parseInt(a.replace('group', '')) - parseInt(b.replace('group', '')))
                    .map(key => data.tournamentGroups[key]);
                window.tournamentGroups.push(...loadedGroups);
                console.log('Restored window.tournamentGroups:', window.tournamentGroups);
            }

            // Reconstruct round2Groups from object
            if (data.round2Groups) {
                const loadedR2Groups = Object.keys(data.round2Groups)
                    .sort((a, b) => parseInt(a.replace('group', '')) - parseInt(b.replace('group', '')))
                    .map(key => data.round2Groups[key]);
                window.round2Groups.push(...loadedR2Groups);
                console.log('Restored window.round2Groups:', window.round2Groups);
            }

            advancedPlayers.push(...(data.advancedPlayers || []));
            round2Winners.push(...(data.round2Winners || []));
            quarterFinalWinners.push(...(data.quarterFinalWinners || []));
            semiFinalWinners.push(...(data.semiFinalWinners || []));
            semiFinalLosers.push(...(data.semiFinalLosers || []));

            currentActiveTournamentId = tournamentId; // Set the loaded tournament as active
            alert(`Tournament "${tournamentId}" loaded successfully!`);
            console.log('State after loading and restoration:', {
                currentActiveTournamentId: currentActiveTournamentId,
                players: players,
                tournamentGroups: window.tournamentGroups,
                playerScores: playerScores,
                advancedPlayers: advancedPlayers,
                round2Groups: window.round2Groups,
                round2Winners: round2Winners,
                quarterFinalWinners: quarterFinalWinners,
                semiFinalWinners: semiFinalWinners,
                semiFinalLosers: semiFinalLosers
            });

            // Hide the management section and render UI based on loaded state
            showSection(document.getElementById(data.currentSectionId));
            renderUIFromLoadedState(data.currentSectionId, data.fightResults || {});

        } else {
            console.warn(`No saved tournament found for ID: ${tournamentId}.`);
            alert(`No saved tournament found for "${tournamentId}".`);
            // Ensure UI is in initial state if no tournament found
            showSection(document.getElementById('add-players-section'));
            resetTournamentState(); // Clear any partial data
        }
    } catch (error) {
        console.error('Error loading tournament state:', error);
        alert('Error loading tournament state. Check console for details.');
    }
}

/**
 * Resets all global tournament state variables to their initial empty state.
 * Used when starting a new tournament or loading a non-existent one.
 */
function resetTournamentState() {
    players.length = 0;
    playerList.innerHTML = '';
    Object.keys(playerScores).forEach(key => delete playerScores[key]);
    advancedPlayers.length = 0;
    round2Winners.length = 0;
    quarterFinalWinners.length = 0;
    semiFinalWinners.length = 0;
    semiFinalLosers.length = 0;
    window.tournamentGroups = [];
    window.round2Groups = [];
    currentActiveTournamentId = null; // Clear active tournament
    updatePlayerCount(); // Reset player count UI
    // Additional UI resets if necessary, e.g., clear fight containers
    round1FightsContainer.innerHTML = '';
    round1ScoresContainer.innerHTML = '';
    round2GroupsContainer.innerHTML = '';
    round2FightsContainer.innerHTML = '';
    quarterFinalFightsContainer.innerHTML = '';
    semiFinalFightsContainer.innerHTML = '';
    finalFightContainer.innerHTML = '';
    awardsContainer.innerHTML = '';
    awardsContainer.style.display = 'none';

    // Reset button states for a fresh start
    createGroupsBtn.disabled = true;
    startRound1Btn.disabled = true;
    finishRound1Btn.disabled = true;
    selectTopPlayersBtn.disabled = true;
    startRound2Btn.disabled = true;
    finishRound2Btn.disabled = true;
    finishQuarterFinalBtn.disabled = true;
    finishSemiFinalBtn.disabled = true;
    showAwardsBtn.disabled = true;

    saveAndProceedStep2Btn.disabled = true;
    saveAndProceedStep3Btn.disabled = true;
    saveAndProceedStep4Btn.disabled = true;
    saveAndProceedStep5Btn.disabled = true;
    saveAndProceedStep6Btn.disabled = true;
    saveAndProceedStep7Btn.disabled = true;
    saveAndProceedStep8Btn.disabled = true;
    saveAndProceedStep9Btn.disabled = true;

    playerReplacementSection.style.display = 'none';
}


/**
 * Renders the UI elements based on the loaded tournament state.
 * @param {string} currentSectionId - The ID of the section to display.
 * @param {object} loadedFightResults - Object containing saved fight winners.
 */
function renderUIFromLoadedState(currentSectionId, loadedFightResults) {
    console.log(`Rendering UI from loaded state. Target section: ${currentSectionId}`);
    // No need to call showSection here, as it's called by loadTournamentState now.

    // Reset button states for safety before re-enabling
    // Many of these are handled by resetTournamentState, but re-assert here for clarity
    createGroupsBtn.disabled = true;
    startRound1Btn.disabled = true;
    finishRound1Btn.disabled = true;
    selectTopPlayersBtn.disabled = true;
    startRound2Btn.disabled = true;
    finishRound2Btn.disabled = true;
    finishQuarterFinalBtn.disabled = true;
    finishSemiFinalBtn.disabled = true;
    showAwardsBtn.disabled = true;

    // Control Save & Proceed buttons (generally enabled for the current/previous step that might have pending changes)
    saveAndProceedStep2Btn.disabled = true;
    saveAndProceedStep3Btn.disabled = true;
    saveAndProceedStep4Btn.disabled = true;
    saveAndProceedStep5Btn.disabled = true;
    saveAndProceedStep6Btn.disabled = true;
    saveAndProceedStep7Btn.disabled = true;
    saveAndProceedStep8Btn.disabled = true;
    saveAndProceedStep9Btn.disabled = true;


    // Logic to re-render and enable/disable based on progression
    // Start of the tournament or returning to add players
    if (currentSectionId === 'add-players-section') {
        createGroupsBtn.disabled = players.length !== MAX_PLAYERS;
        addPlayerBtn.disabled = false;
        playerNameInput.disabled = false;
        playerReplacementSection.style.display = 'none'; // No replacement until groups exist
    } else {
        // If past player entry, disable player entry elements
        addPlayerBtn.disabled = true;
        playerNameInput.disabled = true;
    }


    if (window.tournamentGroups && window.tournamentGroups.length > 0) {
        renderGroups(); // Re-render Round 1 groups
        playerReplacementSection.style.display = 'block'; // Show replacement options
        createGroupsBtn.disabled = true; // Once groups exist, 'Create Groups' is typically disabled
        startRound1Btn.disabled = false; // Always enable if groups exist
        saveAndProceedStep2Btn.disabled = false; // Enable save & proceed for groups section
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
        // If awards were already shown on save, display them
        if (awardsContainer.innerHTML.includes('Tournament Prizes')) { // Simple check if awards were likely generated
             awardsContainer.style.display = 'block';
        }
    }

    console.log('UI rendering from loaded state complete.');
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
    console.log('Current fight selections collected:', fightResults);
    return fightResults;
}


// --- Step 1: Add Players ---
addPlayerBtn.addEventListener('click', () => {
    console.log('Add Player button clicked.');
    const newPlayerNames = playerNameInput.value.split(',')
        .map(name => name.trim())
        .filter(name => name !== '');
    console.log('Parsed new player names:', newPlayerNames);

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
                console.log(`Added player: ${playerName}. Total players: ${players.length}`);
            } else {
                duplicates.push(playerName);
                console.log(`Duplicate player skipped: ${playerName}`);
            }
        } else {
            maxReached = true;
            console.log(`Max players reached. Skipped: ${playerName}`);
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
    console.log('Create Groups button clicked.');
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
    console.log('Tournament groups created:', window.tournamentGroups);


    renderGroups(); // Call the new rendering function
    showSection(groupsSection);
    createGroupsBtn.disabled = true;
    addPlayerBtn.disabled = true;
    playerNameInput.disabled = true;
    startRound1Btn.disabled = false;
    playerReplacementSection.style.display = 'block'; // Show replacement option

    // Save state after group creation. If no active tournament, use default.
    console.log("Groups created. Initiating save from createGroupsBtn.");
    await saveTournamentState('groups-section');
});

// New Event Listener for Replace Player Button
replacePlayerBtn.addEventListener('click', async () => { // Make async to await save
    console.log('Replace Player button clicked.');
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
            console.log(`Global player list updated: ${playerToReplace} -> ${newPlayerName}`);
        } else {
             // This case should ideally not happen if playerToReplace was found in a group,
             // but it's a safeguard if player data gets out of sync.
             replacementStatusMessage.textContent = `Warning: "${playerToReplace}" was found in a group but not in the global player list.`;
             replacementStatusMessage.classList.add('error');
             console.warn(`Player "${playerToReplace}" not found in global players array, but found in group.`);
        }


        // Update playerScores: remove old player's score, add new player with 0 score
        delete playerScores[playerToReplace];
        playerScores[newPlayerName] = 0; // New player starts with 0 score for Round 1
        console.log(`Player scores updated: Removed ${playerToReplace}, added ${newPlayerName}`);


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
        console.warn(`Player "${playerToReplace}" not found for replacement.`);
    }
});

// All saveAndProceed buttons now just call saveTournamentState with the current section.
// The actual progression is handled by dedicated "Start" or "Finish" buttons.
saveAndProceedStep2Btn.addEventListener('click', async () => {
    console.log("Save & Proceed (Step 2) button clicked. Initiating save.");
    await saveTournamentState('groups-section');
});


// --- Step 3: Round 1 (Z1) - Intra-Group Fights ---
/**
 * Generates Round 1 fight UI.
 * @param {object} loadedFightResults - Optional: Object containing saved fight winners to pre-select dropdowns.
 */
function generateRound1Fights(loadedFightResults = {}) {
    round1FightsContainer.innerHTML = ''; // Clear previous fights
    if (!window.tournamentGroups || window.tournamentGroups.length === 0) {
        console.warn('generateRound1Fights: window.tournamentGroups is undefined or empty. Cannot generate fights.');
        return;
    }
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
                    console.log(`Pre-selected winner for ${fightId}: ${winnerSelect.value}`);
                }
            }
        }
        round1FightsContainer.appendChild(groupDiv);
    });
    finishRound1Btn.disabled = false;
    console.log('Round 1 fights generated.');
}

function recordRound1Scores() {
    console.log('Recording Round 1 scores...');
    let allFightsRecorded = true;
    // Reset all player scores before recalculating for Round 1
    // Important: only reset scores for players currently in the tournament,
    // not old players who might have been replaced.
    // However, if we are loading, scores would already be in playerScores.
    // This part is primarily for when completing a new round.
    Object.keys(playerScores).forEach(player => playerScores[player] = 0);


    const fightCards = round1FightsContainer.querySelectorAll('.fight-card');
    fightCards.forEach(card => {
        const winnerSelect = card.querySelector('select');
        const winnerName = winnerSelect.value;

        if (winnerName === "") {
            allFightsRecorded = false;
            console.warn('Unselected winner in Round 1 fight.');
        } else {
            // Ensure the winnerName exists in playerScores (it should, as new players are initialized)
            if (playerScores[winnerName] !== undefined) {
                playerScores[winnerName] += 1; // Assign 1 point to the winner
                console.log(`Player ${winnerName} awarded 1 point. New score: ${playerScores[winnerName]}`);
            } else {
                console.error(`Winner "${winnerName}" not found in playerScores object during score recording.`);
            }
        }
    });
    console.log('Round 1 score recording complete. All fights recorded:', allFightsRecorded);
    console.log('Final player scores after Round 1:', playerScores);
    return allFightsRecorded;
}

startRound1Btn.addEventListener('click', async () => { // Make async
    console.log('Start Round 1 button clicked.');
    showSection(round1Section);
    generateRound1Fights();
    console.log("Starting Round 1. Initiating save from startRound1Btn.");
    await saveTournamentState('round1-section'); // Save state when entering this section
});

finishRound1Btn.addEventListener('click', async () => { // Make async
    console.log('Finish Round 1 button clicked.');
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
});


// --- Step 4: Display Round 1 Scores ---
function displayRound1Scores() {
    round1ScoresContainer.innerHTML = ''; // Clear previous scores
    console.log('Displaying Round 1 scores.');

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
            li.textContent = `${player.name}: ${player.score} points`;
            ul.appendChild(li);
        });
        round1ScoresContainer.appendChild(groupScoresDiv);
    });
    selectTopPlayersBtn.disabled = false;
    console.log('Round 1 scores displayed.');
}

saveAndProceedStep4Btn.addEventListener('click', async () => {
    console.log("Save & Proceed (Step 4) button clicked. Initiating save for Round 1 scores.");
    await saveTournamentState('round1-scores-section'); // Save after scores are displayed
});

// --- Step 5: Select Top 2 Players for Round 2 ---
selectTopPlayersBtn.addEventListener('click', async () => { // Make async
    console.log('Select Top Players button clicked.');
    advancedPlayers = []; // Reset for new selection
    advancedPlayersList.innerHTML = '';

    const playersWithScores = Object.keys(playerScores).map(playerName => ({
        name: playerName,
        score: playerScores[playerName]
    }));

    window.tournamentGroups.forEach((group) => {
        const groupPlayersScores = playersWithScores
            .filter(p => group.includes(p.name))
            .sort((a, b) => b.score - a.score); // Sort by score descending

        // Select top 2 players from each group
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
        // You might want to implement a more robust tie-breaking rule here if strict 16 players are required.
    }
    console.log('Advanced players for Round 2:', advancedPlayers);

    showSection(round2PrepSection);
    startRound2Btn.disabled = false;
    console.log("Selecting Top Players for Round 2. Initiating save from selectTopPlayersBtn.");
    await saveTournamentState('round2-prep-section'); // Save state after selecting advanced players
});

saveAndProceedStep5Btn.addEventListener('click', async () => {
    console.log("Save & Proceed (Step 5) button clicked. Initiating save for advanced players.");
    await saveTournamentState('round2-prep-section');
});


// --- Step 6 & 7: Round 2 (Z2) - Group Fights ---
/**
 * Generates Round 2 fight UI.
 * @param {object} loadedFightResults - Optional: Object containing saved fight winners to pre-select dropdowns.
 */
function generateRound2Fights(loadedFightResults = {}) {
    round2GroupsContainer.innerHTML = '';
    round2FightsContainer.innerHTML = '';
    if (advancedPlayers.length === 0) {
        console.warn('generateRound2Fights: advancedPlayers list is empty. Cannot generate Round 2 fights.');
        return;
    }

    const shuffledAdvancedPlayers = shuffleArray([...advancedPlayers]);

    const r2Groups = [];
    const R2_PLAYERS_PER_GROUP = 4;
    const R2_NUM_GROUPS = 16 / R2_PLAYERS_PER_GROUP; // 4 groups for Z2

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

    // Store R2 groups globally
    window.round2Groups = r2Groups;
    console.log('Round 2 groups created:', window.round2Groups);


    // Setup 2 group fights: G1 vs G4, G2 vs G3
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

        // If loading, pre-select the winner
        const winnerSelect = fightElement.querySelector('select');
        if (loadedFightResults[`${fight.id}-winner`]) {
            winnerSelect.value = loadedFightResults[`${fight.id}-winner`];
            console.log(`Pre-selected winner for ${fight.id}: ${winnerSelect.value}`);
        }
    });
    finishRound2Btn.disabled = false;
    console.log('Round 2 fights generated.');
}

startRound2Btn.addEventListener('click', async () => { // Make async
    console.log('Start Round 2 button clicked.');
    showSection(round2Section);
    generateRound2Fights();
    console.log("Starting Round 2. Initiating save from startRound2Btn.");
    await saveTournamentState('round2-section'); // Save state when entering this section
});

finishRound2Btn.addEventListener('click', async () => { // Make async
    console.log('Finish Round 2 button clicked.');
    round2Winners = []; // Reset winners

    const fight1WinnerSelect = document.getElementById('R2-Fight1-winner');
    const fight2WinnerSelect = document.getElementById('R2-Fight2-winner');

    if (fight1WinnerSelect.value === "" || fight2WinnerSelect.value === "") {
        alert("Please select a winner for both group fights.");
        return;
    }

    // Determine winning groups and add their players to round2Winners
    // This logic relies on the names of the groups as string values in the select options
    // It's safer to store actual group arrays or a reference to them in the option value if possible
    // For now, assuming "R2 Group 1" maps to r2Groups[0] etc. based on original generation.
    const group1Name = 'R2 Group 1';
    const group2Name = 'R2 Group 2';
    const group3Name = 'R2 Group 3';
    const group4Name = 'R2 Group 4';

    if (fight1WinnerSelect.value === group1Name) {
        round2Winners.push(...window.round2Groups[0]);
    } else if (fight1WinnerSelect.value === group4Name) { // R2 Group 4
        round2Winners.push(...window.round2Groups[3]);
    } else {
        console.error("Unexpected winner value for R2-Fight1:", fight1WinnerSelect.value);
        alert("An error occurred with Round 2 fight selections. Please check console.");
        return;
    }

    if (fight2WinnerSelect.value === group2Name) {
        round2Winners.push(...window.round2Groups[1]);
    } else if (fight2WinnerSelect.value === group3Name) { // R2 Group 3
        round2Winners.push(...window.round2Groups[2]);
    } else {
        console.error("Unexpected winner value for R2-Fight2:", fight2WinnerSelect.value);
        alert("An error occurred with Round 2 fight selections. Please check console.");
        return;
    }

    if (round2Winners.length !== 8) {
        alert(`Error: Expected 8 players to proceed to Quarter-Finals, but found ${round2Winners.length}.`);
        console.error(`Expected 8 R2 winners, but got ${round2Winners.length}:`, round2Winners);
        return;
    }
    console.log('Round 2 winners:', round2Winners);

    showSection(quarterFinalSection);
    generateQuarterFinalFights();
    console.log("Finishing Round 2. Initiating save from finishRound2Btn.");
    await saveTournamentState('quarter-final-section'); // Save state after finishing Round 2 and showing QF
});

saveAndProceedStep6Btn.addEventListener('click', async () => {
    const fightResults = getCurrentFightSelections();
    console.log("Save & Proceed (Step 6) button clicked. Initiating save for Round 2 fights.");
    await saveTournamentState('round2-section', fightResults); // Save current selections for Round 2
});

// --- Step 8: Quarter-Final (Z3) - 2v2 Fights ---
/**
 * Generates Quarter-Final fight UI.
 * @param {object} loadedFightResults - Optional: Object containing saved fight winners to pre-select dropdowns.
 */
function generateQuarterFinalFights(loadedFightResults = {}) {
    quarterFinalFightsContainer.innerHTML = '';
    if (round2Winners.length === 0) {
        console.warn('generateQuarterFinalFights: round2Winners list is empty. Cannot generate Quarter-Final fights.');
        return;
    }
    const shuffledRound2Winners = shuffleArray([...round2Winners]);

    // Setup 2 2v2 fights
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

        // If loading, pre-select the winner
        const winnerSelect = fightElement.querySelector('select');
        if (loadedFightResults[`${fight.id}-winner`]) {
            winnerSelect.value = loadedFightResults[`${fight.id}-winner`];
            console.log(`Pre-selected winner for ${fight.id}: ${winnerSelect.value}`);
        }
    });
    finishQuarterFinalBtn.disabled = false;
    console.log('Quarter-Final fights generated.');
}

finishQuarterFinalBtn.addEventListener('click', async () => { // Make async
    console.log('Finish Quarter-Final button clicked.');
    quarterFinalWinners = []; // Reset winners

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
        console.error(`Expected 4 QF winners, but got ${quarterFinalWinners.length}:`, quarterFinalWinners);
        return;
    }
    console.log('Quarter-Final winners:', quarterFinalWinners);

    showSection(semiFinalSection);
    generateSemiFinalFights();
    console.log("Finishing Quarter-Final. Initiating save from finishQuarterFinalBtn.");
    await saveTournamentState('semi-final-section'); // Save state after finishing QF and showing SF
});

saveAndProceedStep7Btn.addEventListener('click', async () => {
    const fightResults = getCurrentFightSelections();
    console.log("Save & Proceed (Step 7) button clicked. Initiating save for Quarter-Final fights.");
    await saveTournamentState('quarter-final-section', fightResults); // Save current selections for QF
});

// --- Semi-Final (Z4) - 1v1 Fights ---
/**
 * Generates Semi-Final fight UI.
 * @param {object} loadedFightResults - Optional: Object containing saved fight winners to pre-select dropdowns.
 */
function generateSemiFinalFights(loadedFightResults = {}) {
    semiFinalFightsContainer.innerHTML = '';
    if (quarterFinalWinners.length === 0) {
        console.warn('generateSemiFinalFights: quarterFinalWinners list is empty. Cannot generate Semi-Final fights.');
        return;
    }
    const shuffledQuarterFinalWinners = shuffleArray([...quarterFinalWinners]);

    // Setup 2 1v1 fights
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

        // If loading, pre-select the winner
        const winnerSelect = fightElement.querySelector('select');
        if (loadedFightResults[`${fight.id}-winner`]) {
            winnerSelect.value = loadedFightResults[`${fight.id}-winner`];
            console.log(`Pre-selected winner for ${fight.id}: ${winnerSelect.value}`);
        }
    });
    finishSemiFinalBtn.disabled = false;
    console.log('Semi-Final fights generated.');
}

finishSemiFinalBtn.addEventListener('click', async () => { // Make async
    console.log('Finish Semi-Final button clicked.');
    semiFinalWinners = []; // Reset winners
    semiFinalLosers = []; // Reset losers

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

    // Remove finalists from the losers list (just in case due to complex tie-breaking or manual error)
    semiFinalLosers = semiFinalLosers.filter(loser => !semiFinalWinners.includes(loser));

    if (semiFinalWinners.length !== 2 || semiFinalLosers.length !== 2) {
        alert(`Error: Expected 2 finalists and 2 semi-final losers, but found ${semiFinalWinners.length} finalists and ${semiFinalLosers.length} losers.`);
        console.error(`Expected 2 SF winners and 2 losers, but got winners: ${semiFinalWinners.length}, losers: ${semiFinalLosers.length}`, {semiFinalWinners, semiFinalLosers});
        return;
    }
    console.log('Semi-Final winners:', semiFinalWinners);
    console.log('Semi-Final losers:', semiFinalLosers);


    showSection(finalSection);
    generateFinalFight();
    console.log("Finishing Semi-Final. Initiating save from finishSemiFinalBtn.");
    await saveTournamentState('final-section'); // Save state after finishing SF and showing Final
});

saveAndProceedStep8Btn.addEventListener('click', async () => {
    const fightResults = getCurrentFightSelections();
    console.log("Save & Proceed (Step 8) button clicked. Initiating save for Semi-Final fights.");
    await saveTournamentState('semi-final-section', fightResults); // Save current selections for SF
});

// --- Final Round & Awards ---
/**
 * Generates Final fight UI.
 * @param {object} loadedFightResults - Optional: Object containing saved fight winners to pre-select dropdowns.
 */
function generateFinalFight(loadedFightResults = {}) {
    finalFightContainer.innerHTML = '';
    if (semiFinalWinners.length === 0) {
        console.warn('generateFinalFight: semiFinalWinners list is empty. Cannot generate Final fight.');
        return;
    }
    const finalPlayers = shuffleArray([...semiFinalWinners]); // Shuffle just in case, though it's only two

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

    // If loading, pre-select the winner
    const winnerSelect = fightElement.querySelector('select');
    if (loadedFightResults['final-winner']) {
        winnerSelect.value = loadedFightResults['final-winner'];
        console.log(`Pre-selected winner for final: ${winnerSelect.value}`);
    }
    console.log('Final fight generated.');
}

showAwardsBtn.addEventListener('click', async () => { // Make async
    console.log('Show Awards button clicked.');
    const finalWinnerSelect = document.getElementById('final-winner');
    const winner = finalWinnerSelect.value;

    if (winner === "") {
        alert("Please select the Tournament Winner.");
        return;
    }

    const finalist = semiFinalWinners.find(p => p !== winner);

    awardsContainer.innerHTML = `<h3>Tournament Prizes</h3><ul></ul>`;
    const ul = awardsContainer.querySelector('ul');

    // Winner
    let liWinner = document.createElement('li');
    liWinner.innerHTML = `<strong>${winner} (Champion):</strong> 100M Food, 50M Iron, Best blessing from King`;
    ul.appendChild(liWinner);

    // Other Finalist
    let liFinalist = document.createElement('li');
    liFinalist.innerHTML = `<strong>${finalist} (Runner-up):</strong> 50M Food, 25M Iron, Second best King blessing`;
    ul.appendChild(liFinalist);

    // Semi-Final Losers
    semiFinalLosers.forEach(loser => {
        let liLoser = document.createElement('li');
        liLoser.innerHTML = `<strong>${loser} (Semi-Finalist):</strong> 25M Food, 10M Iron, 3rd best King blessing`;
        ul.appendChild(liLoser);
    });

    awardsContainer.style.display = 'block';
    console.log("Awards displayed. Initiating final save.");
    await saveTournamentState('final-section', getCurrentFightSelections()); // Save final state after showing awards
});

saveAndProceedStep9Btn.addEventListener('click', async () => {
    const finalWinnerSelect = document.getElementById('final-winner');
    if (finalWinnerSelect.value === "") {
        alert("Please select the Tournament Winner before saving.");
        return;
    }
    const fightResults = getCurrentFightSelections();
    console.log("Save & Proceed (Step 9) button clicked. Initiating save for Final Round results.");
    await saveTournamentState('final-section', fightResults); // Save current selections for Final
});

// --- New Tournament Management Functions and Event Listeners ---

/**
 * Lists all saved tournaments from Firestore in the UI.
 */
async function listSavedTournaments() {
    savedTournamentsList.innerHTML = '<p style="text-align: center; color: #aaa;">Loading saved tournaments...</p>';
    try {
        const snapshot = await db.collection('tournaments').orderBy('lastSaved', 'desc').get();
        if (snapshot.empty) {
            savedTournamentsList.innerHTML = '<p style="text-align: center; color: #aaa;">No saved tournaments found.</p>';
            return;
        }

        savedTournamentsList.innerHTML = ''; // Clear loading message

        snapshot.forEach(doc => {
            const data = doc.data();
            const tournamentId = doc.id; // Document ID is the tournament ID
            const tournamentName = data.name || tournamentId; // Use name field if available, else doc ID
            const lastSavedDate = data.lastSaved ? data.lastSaved.toDate().toLocaleString() : 'N/A';

            const tournamentEntry = document.createElement('div');
            tournamentEntry.classList.add('saved-tournament-entry');
            tournamentEntry.innerHTML = `
                <span><strong>${tournamentName}</strong> (Last Saved: ${lastSavedDate})</span>
                <div class="actions">
                    <button class="load-specific-tournament-btn primary-btn" data-id="${tournamentId}">Load</button>
                    <button class="delete-tournament-btn primary-btn delete-btn" data-id="${tournamentId}">Delete</button>
                </div>
            `;
            savedTournamentsList.appendChild(tournamentEntry);
        });

        // Add event listeners for new buttons
        savedTournamentsList.querySelectorAll('.load-specific-tournament-btn').forEach(button => {
            button.addEventListener('click', () => loadTournamentState(button.dataset.id));
        });
        savedTournamentsList.querySelectorAll('.delete-tournament-btn').forEach(button => {
            button.addEventListener('click', () => deleteTournament(button.dataset.id, button.closest('.saved-tournament-entry')));
        });

        console.log('Saved tournaments listed.');

    } catch (error) {
        console.error('Error listing tournaments:', error);
        savedTournamentsList.innerHTML = '<p style="text-align: center; color: red;">Error loading tournaments.</p>';
    }
}

/**
 * Deletes a specific tournament from Firestore.
 * @param {string} tournamentId - The ID of the tournament document to delete.
 * @param {HTMLElement} elementToRemove - The UI element to remove upon successful deletion.
 */
async function deleteTournament(tournamentId, elementToRemove) {
    if (confirm(`Are you sure you want to delete tournament "${tournamentId}"? This action cannot be undone.`)) {
        try {
            await db.collection('tournaments').doc(tournamentId).delete();
            alert(`Tournament "${tournamentId}" deleted successfully!`);
            console.log(`Tournament "${tournamentId}" deleted.`);
            if (elementToRemove) {
                elementToRemove.remove(); // Remove from UI
            }
            if (currentActiveTournamentId === tournamentId) {
                resetTournamentState(); // Reset if the active tournament was deleted
                showSection(document.getElementById('add-players-section'));
                alert('The active tournament was deleted. Starting a new one.');
            }
            listSavedTournaments(); // Refresh the list
        } catch (error) {
            console.error('Error deleting tournament:', error);
            alert(`Error deleting tournament "${tournamentId}".`);
        }
    }
}


// Event listener for the "Manage Saved Tournaments" button
manageTournamentsBtn.addEventListener('click', () => {
    console.log('Manage Tournaments button clicked.');
    showSection(tournamentManagementSection);
    listSavedTournaments(); // Populate the list when opening
});

// Event listener for "Save New Version" button
saveNewTournamentBtn.addEventListener('click', async () => {
    const tournamentName = saveTournamentNameInput.value.trim();
    if (!tournamentName) {
        saveStatusMessage.textContent = 'Please enter a name for the tournament.';
        saveStatusMessage.className = 'status-message error';
        return;
    }
    // You could add more robust validation here, e.g., check for duplicate names
    console.log(`Saving new tournament version: "${tournamentName}"`);
    await saveTournamentState(
        currentActiveTournamentId || document.querySelector('.card:not([style*="display: none"]):not(#tournament-management-section)').id || 'add-players-section', // Use current section ID
        getCurrentFightSelections(),
        tournamentName
    );
    saveTournamentNameInput.value = ''; // Clear input
    listSavedTournaments(); // Refresh the list
});

// Event listener for "Close Manager" button
closeTournamentManagerBtn.addEventListener('click', () => {
    console.log('Close Tournament Manager button clicked.');
    // Show the section that was active before opening the manager, or default
    const currentSection = currentActiveTournamentId ?
                           (document.getElementById(db.collection('tournaments').doc(currentActiveTournamentId).get().then(doc => doc.data().currentSectionId).catch(()=>'add-players-section')) || document.getElementById('add-players-section'))
                           : document.getElementById('add-players-section');
    showSection(currentSection);
    // Asynchronously update to potentially show the last known section, if it could be retrieved
    if (currentActiveTournamentId) {
        db.collection('tournaments').doc(currentActiveTournamentId).get().then(doc => {
            if (doc.exists) {
                showSection(document.getElementById(doc.data().currentSectionId));
            } else {
                showSection(document.getElementById('add-players-section'));
            }
        }).catch(err => {
            console.error("Error getting current section for active tournament:", err);
            showSection(document.getElementById('add-players-section'));
        });
    } else {
        showSection(document.getElementById('add-players-section'));
    }
});


// --- Initial Setup ---
// When the page loads, we no longer immediately load a default tournament.
// Instead, we show the "Add Players" section, and the user can click "Manage Tournaments"
// to load an existing one or start adding players for a new one.
// Initialize by resetting state and showing the add players section.
document.addEventListener('DOMContentLoaded', () => {
    resetTournamentState(); // Ensure a clean state on page load
    showSection(document.getElementById('add-players-section')); // Show the initial section
});
