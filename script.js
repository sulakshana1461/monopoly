import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ============================================================================
// 0. PASTE YOUR FIREBASE CONFIG KEYS HERE
// ============================================================================
const MY_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCldKp2jJARkLGojexuUZGoARMt4-QrL20",
  authDomain: "copypoly-47ef9.firebaseapp.com",
  projectId: "copypoly-47ef9",
  storageBucket: "copypoly-47ef9.firebasestorage.app",
  messagingSenderId: "36147138911",
  appId: "1:36147138911:web:0c703611175d45559ea6ea",
  measurementId: "G-ZE6WF1L3DC"
};

// ============================================================================
// 1. CLASSIC 40-TILE MONOPOLY BOARD DEFINITION
// ============================================================================
const GROUP_COLORS = {
  brown:     { hex: '#8B4513', label: 'Brown Group',      text: '#ffffff', size: 2 },
  lightblue: { hex: '#7ec8e3', label: 'Light Blue Group', text: '#111827', size: 3 },
  pink:      { hex: '#d93870', label: 'Pink Group',       text: '#ffffff', size: 3 },
  orange:    { hex: '#f7941d', label: 'Orange Group',     text: '#111827', size: 3 },
  red:       { hex: '#ed1b24', label: 'Red Group',        text: '#ffffff', size: 3 },
  yellow:    { hex: '#fef200', label: 'Yellow Group',     text: '#111827', size: 3 },
  green:     { hex: '#1fb25a', label: 'Green Group',      text: '#ffffff', size: 3 },
  darkblue:  { hex: '#0072bb', label: 'Dark Blue Group',  text: '#ffffff', size: 2 },
  transit:   { hex: '#334155', label: 'Railroads',        text: '#ffffff', size: 4 },
  utility:   { hex: '#64748b', label: 'Utilities',        text: '#ffffff', size: 2 }
};

const BOARD_TILES = [
  { id: 0,  name: 'START LINE',            type: 'go',      price: 0,   icon: '🏁', sub: 'Collect $200' },
  { id: 1,  name: 'Rusty Alley',           type: 'prop',    group: 'brown',     price: 60,  houseCost: 50,  rent: [2, 10, 30, 90, 160, 250] },
  { id: 2,  name: 'Karma Vault',           type: 'chest',   price: 0,   icon: '📦' },
  { id: 3,  name: 'Cobble Lane',           type: 'prop',    group: 'brown',     price: 60,  houseCost: 50,  rent: [4, 20, 60, 180, 320, 450] },
  { id: 4,  name: 'Income Audit Tax',      type: 'tax',     price: 200, icon: '💸', sub: 'Pay $200' },
  { id: 5,  name: 'North Metro Line',      type: 'transit', group: 'transit',   price: 200, icon: '🚂', rent: [25, 50, 100, 200] },
  { id: 6,  name: 'Breeze Avenue',         type: 'prop',    group: 'lightblue', price: 100, houseCost: 50,  rent: [6, 30, 90, 270, 400, 550] },
  { id: 7,  name: 'Plot Twist',            type: 'chance',  price: 0,   icon: '❓' },
  { id: 8,  name: 'Cloud Nine Rd',         type: 'prop',    group: 'lightblue', price: 100, houseCost: 50,  rent: [6, 30, 90, 270, 400, 550] },
  { id: 9,  name: 'Skyline Terrace',       type: 'prop',    group: 'lightblue', price: 120, houseCost: 50,  rent: [8, 40, 100, 300, 450, 600] },
  { id: 10, name: 'THE SLAMMER',           type: 'jail',    price: 0,   icon: '⛓️', sub: 'Just Visiting / In Jail' },
  { id: 11, name: 'Neon Plaza',            type: 'prop',    group: 'pink',      price: 140, houseCost: 100, rent: [10, 50, 150, 450, 625, 750] },
  { id: 12, name: 'GigaWatt Electric Co.', type: 'utility', group: 'utility',   price: 150, icon: '💡' },
  { id: 13, name: 'Velvet Arcade',         type: 'prop',    group: 'pink',      price: 140, houseCost: 100, rent: [10, 50, 150, 450, 625, 750] },
  { id: 14, name: 'Flamingo Blvd',         type: 'prop',    group: 'pink',      price: 160, houseCost: 100, rent: [12, 60, 180, 500, 700, 900] },
  { id: 15, name: 'East Hyperloop',        type: 'transit', group: 'transit',   price: 200, icon: '🚂', rent: [25, 50, 100, 200] },
  { id: 16, name: 'Amber Way',             type: 'prop',    group: 'orange',    price: 180, houseCost: 100, rent: [14, 70, 200, 550, 750, 950] },
  { id: 17, name: 'Karma Vault',           type: 'chest',   price: 0,   icon: '📦' },
  { id: 18, name: 'Tangerine Drive',       type: 'prop',    group: 'orange',    price: 180, houseCost: 100, rent: [14, 70, 200, 550, 750, 950] },
  { id: 19, name: 'Sunburst Square',       type: 'prop',    group: 'orange',    price: 200, houseCost: 100, rent: [16, 80, 220, 600, 800, 1000] },
  { id: 20, name: 'FREE LOUNGE',           type: 'parking', price: 0,   icon: '🚗', sub: 'Free Parking' },
  { id: 21, name: 'Crimson Strand',        type: 'prop',    group: 'red',       price: 220, houseCost: 150, rent: [18, 90, 250, 700, 875, 1050] },
  { id: 22, name: 'Plot Twist',            type: 'chance',  price: 0,   icon: '❓' },
  { id: 23, name: 'Scarlet Cross',         type: 'prop',    group: 'red',       price: 220, houseCost: 150, rent: [18, 90, 250, 700, 875, 1050] },
  { id: 24, name: 'Ruby Heights',          type: 'prop',    group: 'red',       price: 240, houseCost: 150, rent: [20, 100, 300, 750, 925, 1100] },
  { id: 25, name: 'South Monorail',        type: 'transit', group: 'transit',   price: 200, icon: '🚂', rent: [25, 50, 100, 200] },
  { id: 26, name: 'Lemon Drop St',         type: 'prop',    group: 'yellow',    price: 260, houseCost: 150, rent: [22, 110, 330, 800, 975, 1150] },
  { id: 27, name: 'Gold Rush Ave',         type: 'prop',    group: 'yellow',    price: 260, houseCost: 150, rent: [22, 110, 330, 800, 975, 1150] },
  { id: 28, name: 'HydroFlow Water Works', type: 'utility', group: 'utility',   price: 150, icon: '🚰' },
  { id: 29, name: 'Sovereign Gardens',     type: 'prop',    group: 'yellow',    price: 280, houseCost: 150, rent: [24, 120, 360, 850, 1025, 1200] },
  { id: 30, name: 'BUSTED!',               type: 'gotojail',price: 0,   icon: '🚓', sub: 'Go To Jail' },
  { id: 31, name: 'Emerald Park',          type: 'prop',    group: 'green',     price: 300, houseCost: 200, rent: [26, 130, 390, 900, 1100, 1275] },
  { id: 32, name: 'Jade Vista',            type: 'prop',    group: 'green',     price: 300, houseCost: 200, rent: [26, 130, 390, 900, 1100, 1275] },
  { id: 33, name: 'Karma Vault',           type: 'chest',   price: 0,   icon: '📦' },
  { id: 34, name: 'Forest Canopy Blvd',    type: 'prop',    group: 'green',     price: 320, houseCost: 200, rent: [28, 150, 450, 1000, 1200, 1400] },
  { id: 35, name: 'West Maglev Station',   type: 'transit', group: 'transit',   price: 200, icon: '🚂', rent: [25, 50, 100, 200] },
  { id: 36, name: 'Plot Twist',            type: 'chance',  price: 0,   icon: '❓' },
  { id: 37, name: 'Sapphire Promenade',    type: 'prop',    group: 'darkblue',  price: 350, houseCost: 200, rent: [35, 175, 500, 1100, 1300, 1500] },
  { id: 38, name: 'Luxury Tariff',         type: 'tax',     price: 100, icon: '💍', sub: 'Pay $100' },
  { id: 39, name: 'Apex Citadel',          type: 'prop',    group: 'darkblue',  price: 400, houseCost: 200, rent: [50, 200, 600, 1400, 1700, 2000] }
];

const PLAYER_TOKENS = [
  { id: 'boot',    name: 'Boot',    emoji: '🥾', color: '#ef4444' },
  { id: 'duck',    name: 'Duck',    emoji: '🦆', color: '#f59e0b' },
  { id: 'mug',     name: 'Mug',     emoji: '☕', color: '#10b981' },
  { id: 'cart',    name: 'Racecar', emoji: '🏎️', color: '#3b82f6' },
  { id: 'hat',     name: 'Top Hat', emoji: '🎩', color: '#a855f7' },
  { id: 'rocket',  name: 'Ship',    emoji: '🚢', color: '#ec4899' },
  { id: 'floppy',  name: 'Dog',     emoji: '🐕', color: '#06b6d4' },
  { id: 'cruiser', name: 'Cat',     emoji: '🐈', color: '#84cc16' }
];

const PLOT_TWIST_CARDS = [
  { title: 'Advance to Start Line', desc: 'Advance to START LINE (Collect $200).', action: 'move', target: 0 },
  { title: 'Walk to Apex Citadel', desc: 'Advance directly to Apex Citadel.', action: 'move', target: 39 },
  { title: 'Advance to Ruby Heights', desc: 'Advance to Ruby Heights. Collect $200 if you pass Start Line.', action: 'move', target: 24 },
  { title: 'Take a Trip on North Metro', desc: 'Advance to North Metro Line. Collect $200 if you pass Start Line.', action: 'move', target: 5 },
  { title: 'Advance to Neon Plaza', desc: 'Advance to Neon Plaza. Collect $200 if you pass Start Line.', action: 'move', target: 11 },
  { title: 'Bank Dividend', desc: 'Bank pays you a dividend of $50.', action: 'cash', amount: 50 },
  { title: 'Building Loan Matures', desc: 'Your building loan matures. Collect $150.', action: 'cash', amount: 150 },
  { title: 'Get Out of Jail Free', desc: 'Get Out of The Slammer Free. Keep this card or trade it!', action: 'jailcard' },
  { title: 'Go to Jail', desc: 'Go directly to The Slammer. Do not pass Start Line, do not collect $200.', action: 'gotojail' },
  { title: 'Chairman of the Board', desc: 'You have been elected Chairman! Pay each player $50.', action: 'payeach', amount: 50 },
  { title: 'General Property Repairs', desc: 'Make general repairs on all your properties: Pay $25 per House and $100 per Hotel.', action: 'repairs', house: 25, hotel: 100 },
  { title: 'Speeding Fine', desc: 'Pay a speeding fine of $15.', action: 'cash', amount: -15 },
  { title: 'Go Back 3 Spaces', desc: 'Move back 3 spaces!', action: 'moveback', steps: 3 }
];

const KARMA_VAULT_CARDS = [
  { title: 'Advance to Start Line', desc: 'Advance to START LINE (Collect $200).', action: 'move', target: 0 },
  { title: 'Bank Error in Your Favor', desc: 'Collect $200 from the bank!', action: 'cash', amount: 200 },
  { title: 'Doctor Fee', desc: 'Pay medical fee of $50.', action: 'cash', amount: -50 },
  { title: 'Sale of Stock', desc: 'From sale of stock, you get $50.', action: 'cash', amount: 50 },
  { title: 'Get Out of Jail Free', desc: 'Get Out of The Slammer Free. Keep or trade with other players!', action: 'jailcard' },
  { title: 'Go to Jail', desc: 'Go directly to The Slammer. Do not pass Start Line.', action: 'gotojail' },
  { title: 'It Is Your Birthday!', desc: 'Collect $20 from every active player!', action: 'collecteach', amount: 20 },
  { title: 'Income Tax Refund', desc: 'Collect $20 tax refund.', action: 'cash', amount: 20 },
  { title: 'Second Prize in Contest', desc: 'Collect $10 prize money.', action: 'cash', amount: 10 },
  { title: 'Inheritance', desc: 'You inherit $100.', action: 'cash', amount: 100 },
  { title: 'Consultancy Fee', desc: 'Receive $25 consultancy fee.', action: 'cash', amount: 25 },
  { title: 'Street Repairs', desc: 'Assessed for street repairs: $40 per House, $115 per Hotel.', action: 'repairs', house: 40, hotel: 115 }
];

// ============================================================================
// 2. SOUND SYNTHESIZER & TOASTS
// ============================================================================
let soundEnabled = true;
let audioCtx = null;

function playSfx(type) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'dice') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.09);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'cash' || type === 'buy' || type === 'trade') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'jail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(130, now + 0.3);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.32);
    }
  } catch (e) {}
}

function showToast(msg, variant = 'emerald') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const colors = {
    emerald: 'bg-emerald-900 border-emerald-500 text-emerald-100',
    cyan:    'bg-sky-900 border-sky-500 text-sky-100',
    amber:   'bg-amber-900 border-amber-500 text-amber-100',
    rose:    'bg-red-900 border-red-500 text-red-100'
  };
  const el = document.createElement('div');
  el.className = `px-4 py-2.5 rounded-lg border shadow-lg text-xs font-semibold transition-all duration-300 ${colors[variant] || colors.emerald}`;
  el.innerHTML = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

// ============================================================================
// 3. DATABASE CONNECTION & NON-BLOCKING CLOUD SYNC
// ============================================================================
const appId = typeof __app_id !== 'undefined' ? __app_id : 'copypoly-vibe-app';
let db = null;
let auth = null;
let currentUser = null;
let isCloudConnected = false;
let hasReceivedFirstSnapshot = false;
let dbDiagnosticMessage = "Checking database connection...";

let myAccount = null;
let registeredUsersMap = {};
let allRoomsMap = {};
let allInvitesMap = {};
let currentRoomId = null;
let selectedInspectTileId = 39;
let selectedPortfolioPlayerId = null;
let authMode = 'register';
let selectedAuthToken = PLAYER_TOKENS[0].id;
let isRollingAnim = false;

function updateDbIndicator(status, labelText, diagnosticDetail) {
  const dot = document.getElementById('dbStatusDot');
  const txt = document.getElementById('dbStatusText');
  dbDiagnosticMessage = diagnosticDetail || labelText;
  if (!dot || !txt) return;

  if (status === 'connected') {
    dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400';
    txt.textContent = labelText || 'DB Connected';
    txt.className = 'text-emerald-400 font-bold';
  } else if (status === 'connecting') {
    dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse';
    txt.textContent = labelText || 'Connecting...';
    txt.className = 'text-amber-300';
  } else {
    dot.className = 'w-2.5 h-2.5 rounded-full bg-red-500';
    txt.textContent = labelText || 'Local Mode';
    txt.className = 'text-red-300';
  }
}

// Non-blocking Firestore write helper so UI never hangs
async function safeCloudWrite(writePromise, contextLabel) {
  if (!isCloudConnected || !db) return;
  try {
    await writePromise;
  } catch (err) {
    console.error(`Firestore write error (${contextLabel}):`, err);
    updateDbIndicator(
      'offline',
      'DB Rules Error',
      `Firestore blocked saving (${err.code || err.message}). Go to Firebase Console -> Firestore -> Rules and set "allow read, write: if true;"`
    );
    showToast(`Cloud sync warning: ${err.code || err.message}`, 'amber');
  }
}

function colUsers()    { return collection(db, 'artifacts', appId, 'public', 'data', 'copypoly_users'); }
function colProfiles() { return collection(db, 'artifacts', appId, 'public', 'data', 'copypoly_profiles'); }
function colRooms()    { return collection(db, 'artifacts', appId, 'public', 'data', 'copypoly_rooms'); }
function colInvites()  { return collection(db, 'artifacts', appId, 'public', 'data', 'copypoly_invites'); }

async function initDatabaseAndAuth() {
  updateDbIndicator('connecting', 'Connecting DB...', 'Initializing Firebase...');
  try {
    let firebaseConfig = MY_FIREBASE_CONFIG;
    if ((!firebaseConfig || firebaseConfig.apiKey === "YOUR_API_KEY") && typeof __firebase_config !== 'undefined' && __firebase_config) {
      firebaseConfig = JSON.parse(__firebase_config);
    }

    if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
      currentUser = { uid: 'local-' + Math.random().toString(36).slice(2, 9) };
      isCloudConnected = false;
      updateDbIndicator(
        'offline',
        'Local Mode (No Keys)',
        'Running in Local Mode. Paste your real Firebase config keys into MY_FIREBASE_CONFIG at the top of script.js.'
      );
      return;
    }

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    currentUser = { uid: 'user-' + Math.random().toString(36).slice(2, 9) };
    isCloudConnected = true;

    // Start listeners immediately
    setupRealtimeListeners(firebaseConfig.projectId);

    // Optional background anonymous auth (non-blocking)
    try {
      auth = getAuth(app);
      signInAnonymously(auth).then((cred) => {
        if (cred && cred.user) currentUser = cred.user;
      }).catch(() => {});
    } catch (e) {}

    // 5-second timeout check if Firestore hasn't responded yet
    setTimeout(() => {
      if (!hasReceivedFirstSnapshot && isCloudConnected) {
        updateDbIndicator(
          'offline',
          'Check Firestore Setup',
          'Firebase initialized, but Firestore has not responded yet. Make sure you clicked "Create Database" inside Firestore and enabled Test Mode!'
        );
      }
    }, 5000);

  } catch (err) {
    console.error("Database connection error:", err);
    currentUser = { uid: 'local-' + Math.random().toString(36).slice(2, 9) };
    isCloudConnected = false;
    updateDbIndicator('offline', 'DB Error', `Connection error: ${err.message}`);
  }
}

function setupRealtimeListeners(projectId) {
  if (!isCloudConnected || !db) return;

  onSnapshot(colUsers(), (snap) => {
    hasReceivedFirstSnapshot = true;
    const nextMap = {};
    snap.forEach((d) => { nextMap[d.id] = d.data(); });
    registeredUsersMap = { ...registeredUsersMap, ...nextMap };
    renderRegisteredUsersDirectory();
    updateDbIndicator(
      'connected',
      'DB Connected',
      `Connected to Firebase project "${projectId || 'cloud'}" (${Object.keys(registeredUsersMap).length} users).`
    );
  }, (err) => {
    console.error("Firestore users listener error:", err);
    updateDbIndicator(
      'offline',
      'DB Blocked / Rules',
      `Firestore Error: ${err.message}. Check Firebase Console -> Firestore -> Rules and allow read, write: if true;`
    );
  });

  onSnapshot(colRooms(), (snap) => {
    hasReceivedFirstSnapshot = true;
    const nextRooms = {};
    snap.forEach((d) => {
      const data = d.data();
      if (data && data.id) {
        nextRooms[d.id] = normalizeRoomData(data);
      }
    });
    allRoomsMap = { ...allRoomsMap, ...nextRooms };
    renderLobbyViews();
    if (currentRoomId && allRoomsMap[currentRoomId]) {
      syncActiveRoomUI(allRoomsMap[currentRoomId]);
    }
  }, (err) => console.error("Rooms listener error:", err));

  onSnapshot(colInvites(), (snap) => {
    const nextInvites = {};
    snap.forEach((d) => { nextInvites[d.id] = d.data(); });
    allInvitesMap = { ...allInvitesMap, ...nextInvites };
    renderIncomingInvites();
  }, (err) => console.error("Invites listener error:", err));
}

function normalizeRoomData(raw) {
  const room = { ...raw };
  if (typeof room.playersJson === 'string') {
    try { room.players = JSON.parse(room.playersJson); } catch (e) { room.players = []; }
  }
  if (typeof room.propertiesJson === 'string') {
    try { room.properties = JSON.parse(room.propertiesJson); } catch (e) { room.properties = {}; }
  }
  if (typeof room.logsJson === 'string') {
    try { room.logs = JSON.parse(room.logsJson); } catch (e) { room.logs = []; }
  }
  if (typeof room.activeTradeJson === 'string') {
    try { room.activeTrade = JSON.parse(room.activeTradeJson); } catch (e) { room.activeTrade = null; }
  }
  if (typeof room.activeAuctionJson === 'string') {
    try { room.activeAuction = JSON.parse(room.activeAuctionJson); } catch (e) { room.activeAuction = null; }
  }
  if (typeof room.pendingDebtJson === 'string') {
    try { room.pendingDebt = JSON.parse(room.pendingDebtJson); } catch (e) { room.pendingDebt = null; }
  }
  room.players = room.players || [];
  room.properties = room.properties || {};
  room.logs = room.logs || [];
  return room;
}

async function saveRoomState(room) {
  const normalized = normalizeRoomData(room);
  allRoomsMap[normalized.id] = normalized;

  // Update UI immediately without waiting for network
  renderLobbyViews();
  if (currentRoomId === normalized.id) {
    syncActiveRoomUI(normalized);
  }

  if (isCloudConnected && db) {
    const payload = {
      id: normalized.id,
      title: normalized.title,
      code: normalized.code,
      hostUsername: normalized.hostUsername,
      status: normalized.status,
      startingCash: normalized.startingCash || 1500,
      turnIndex: normalized.turnIndex || 0,
      turnNumber: normalized.turnNumber || 1,
      turnPhase: normalized.turnPhase || 'PRE_ROLL',
      lastDice: normalized.lastDice || [1, 1],
      doublesCount: normalized.doublesCount || 0,
      lastCard: normalized.lastCard || null,
      winnerName: normalized.winnerName || null,
      updatedAt: Date.now(),
      playersJson: JSON.stringify(normalized.players || []),
      propertiesJson: JSON.stringify(normalized.properties || {}),
      logsJson: JSON.stringify((normalized.logs || []).slice(0, 60)),
      activeTradeJson: JSON.stringify(normalized.activeTrade || null),
      activeAuctionJson: JSON.stringify(normalized.activeAuction || null),
      pendingDebtJson: JSON.stringify(normalized.pendingDebt || null)
    };
    safeCloudWrite(
      setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'copypoly_rooms', normalized.id), payload),
      'saveRoomState'
    );
  }
}

// ============================================================================
// 4. AUTHENTICATION & @USERNAME REGISTRATION LOGIC (FIXED TRANSITION)
// ============================================================================
function renderAuthTokenPicker() {
  const grid = document.getElementById('authTokenGrid');
  if (!grid) return;
  grid.innerHTML = PLAYER_TOKENS.map((t) => {
    const active = t.id === selectedAuthToken;
    return `
      <button type="button" data-token="${t.id}"
        class="auth-token-btn p-2 rounded-lg border flex flex-col items-center gap-1 transition ${
          active
            ? 'bg-slate-700 border-emerald-400 shadow'
            : 'bg-slate-900 border-slate-700 hover:border-slate-500'
        }">
        <span class="w-7 h-7 rounded-full flex items-center justify-center text-base" style="background:${t.color}30; border: 1.5px solid ${t.color}">
          ${t.emoji}
        </span>
        <span class="text-[11px] font-medium text-slate-200 truncate w-full text-center">${t.name}</span>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.auth-token-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedAuthToken = btn.dataset.token;
      renderAuthTokenPicker();
    });
  });
}

function setAuthTab(mode) {
  authMode = mode;
  const tabReg = document.getElementById('tabAuthRegister');
  const tabLog = document.getElementById('tabAuthLogin');
  const fieldDisp = document.getElementById('fieldDisplayName');
  const fieldTok = document.getElementById('fieldTokenPicker');

  if (mode === 'register') {
    tabReg.className = 'py-2 text-xs font-bold rounded-md bg-emerald-600 text-white transition';
    tabLog.className = 'py-2 text-xs font-bold rounded-md text-slate-400 hover:text-white transition';
    fieldDisp.classList.remove('hidden');
    fieldTok.classList.remove('hidden');
  } else {
    tabLog.className = 'py-2 text-xs font-bold rounded-md bg-emerald-600 text-white transition';
    tabReg.className = 'py-2 text-xs font-bold rounded-md text-slate-400 hover:text-white transition';
    fieldDisp.classList.add('hidden');
    fieldTok.classList.add('hidden');
  }
  document.getElementById('authErrorMsg').classList.add('hidden');
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const rawUsername = document.getElementById('inputAuthUsername').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const displayName = document.getElementById('inputAuthDisplayName').value.trim() || rawUsername;
  const pin = document.getElementById('inputAuthPin').value.trim();
  const errBox = document.getElementById('authErrorMsg');

  if (rawUsername.length < 3) {
    errBox.textContent = 'Username must be at least 3 characters (letters, numbers, or underscore).';
    errBox.classList.remove('hidden');
    return;
  }
  if (pin.length < 4) {
    errBox.textContent = 'Passcode must be at least 4 characters.';
    errBox.classList.remove('hidden');
    return;
  }

  errBox.classList.add('hidden');
  const existing = registeredUsersMap[rawUsername];

  if (authMode === 'register') {
    if (existing && existing.pin !== pin) {
      errBox.textContent = `@${rawUsername} is already taken. Switch to "Existing @username" to log in.`;
      errBox.classList.remove('hidden');
      return;
    }
    const uid = currentUser?.uid || ('u-' + Date.now());
    const userRecord = {
      uid: uid,
      username: rawUsername,
      displayName: displayName,
      token: selectedAuthToken,
      pin: pin,
      createdAt: Date.now()
    };

    registeredUsersMap[rawUsername] = userRecord;
    myAccount = userRecord;

    // 1. Transition to Lobby IMMEDIATELY so UI never freezes
    playSfx('buy');
    showToast(`Signed in as @${rawUsername}`, 'emerald');
    enterAuthenticatedState();

    // 2. Save to Firebase in the background
    if (isCloudConnected && db) {
      safeCloudWrite(
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'copypoly_users', rawUsername), userRecord),
        'registerUser'
      );
      safeCloudWrite(
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'copypoly_profiles', uid), userRecord),
        'registerProfile'
      );
    }
  } else {
    if (!existing) {
      errBox.textContent = `Account @${rawUsername} not found. Click "Create Account" first.`;
      errBox.classList.remove('hidden');
      return;
    }
    if (existing.pin !== pin) {
      errBox.textContent = `Incorrect passcode for @${rawUsername}.`;
      errBox.classList.remove('hidden');
      return;
    }
    myAccount = existing;
    playSfx('buy');
    showToast(`Welcome back, @${rawUsername}!`, 'cyan');
    enterAuthenticatedState();
  }
}

function showViewSection(viewName) {
  const vAuth = document.getElementById('viewAuth');
  const vLobby = document.getElementById('viewLobby');
  const vGame = document.getElementById('viewGame');

  // Hide all first
  vAuth.classList.add('hidden');
  vAuth.classList.remove('flex');
  vLobby.classList.add('hidden');
  vLobby.classList.remove('grid');
  vGame.classList.add('hidden');
  vGame.classList.remove('grid');

  if (viewName === 'auth') {
    vAuth.classList.remove('hidden');
    vAuth.classList.add('flex');
  } else if (viewName === 'lobby') {
    vLobby.classList.remove('hidden');
    vLobby.classList.add('grid');
  } else if (viewName === 'game') {
    vGame.classList.remove('hidden');
    vGame.classList.add('grid');
  }
}

function enterAuthenticatedState() {
  const tokObj = PLAYER_TOKENS.find(t => t.id === myAccount.token) || PLAYER_TOKENS[0];
  const navUserBox = document.getElementById('navUserBox');
  navUserBox.classList.remove('hidden');
  navUserBox.classList.add('flex');

  const avatarEl = document.getElementById('navUserAvatar');
  avatarEl.style.backgroundColor = tokObj.color + '33';
  avatarEl.style.borderColor = tokObj.color;
  avatarEl.textContent = tokObj.emoji;

  document.getElementById('navUserDisplay').textContent = myAccount.displayName;
  document.getElementById('navUsername').textContent = '@' + myAccount.username;

  if (currentRoomId && allRoomsMap[currentRoomId]) {
    syncActiveRoomUI(allRoomsMap[currentRoomId]);
  } else {
    showViewSection('lobby');
    renderLobbyViews();
    renderIncomingInvites();
    renderRegisteredUsersDirectory();
  }
}

// ============================================================================
// 5. LOBBY, ROOM CREATION & @USERNAME INVITATION SYSTEM
// ============================================================================
function createPlayerSeatObject(acc, seatIdx, startingCash, isSimulated = false) {
  const tok = PLAYER_TOKENS[seatIdx % PLAYER_TOKENS.length];
  return {
    id: acc.username,
    username: acc.username,
    displayName: acc.displayName,
    token: tok.id,
    emoji: tok.emoji,
    color: tok.color,
    money: startingCash,
    position: 0,
    inJail: false,
    jailTurns: 0,
    jailFreeCards: 0,
    bankrupt: false,
    isSimulated: isSimulated
  };
}

async function handleCreateRoom(e) {
  e.preventDefault();
  if (!myAccount) return;

  const title = document.getElementById('inputRoomTitle').value.trim() || `${myAccount.displayName}'s Game`;
  const startingCash = parseInt(document.getElementById('selectStartingCash').value, 10) || 1500;
  const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const code = Math.random().toString(36).substring(2, 7).toUpperCase();

  const hostSeat = createPlayerSeatObject(myAccount, 0, startingCash, false);

  const newRoom = {
    id: roomId,
    title,
    code,
    hostUsername: myAccount.username,
    status: 'waiting',
    startingCash,
    turnIndex: 0,
    turnNumber: 1,
    turnPhase: 'PRE_ROLL',
    lastDice: [6, 6],
    doublesCount: 0,
    lastCard: null,
    winnerName: null,
    players: [hostSeat],
    properties: {},
    logs: [
      { time: Date.now(), text: `Room "${title}" created by @${myAccount.username}.` }
    ],
    activeTrade: null,
    activeAuction: null,
    pendingDebt: null
  };

  currentRoomId = roomId;
  playSfx('buy');
  showToast(`Room "${title}" created!`, 'emerald');
  await saveRoomState(newRoom);
}

async function sendUsernameInvite(targetUsernameRaw) {
  if (!currentRoomId || !allRoomsMap[currentRoomId] || !myAccount) return;
  const room = allRoomsMap[currentRoomId];
  const cleanUser = targetUsernameRaw.trim().toLowerCase().replace(/^@/, '');
  const feedback = document.getElementById('inviteStatusFeedback');

  if (!cleanUser) return;
  if (room.players.length >= 8) {
    showToast('Room is full (8/8 players).', 'rose');
    return;
  }
  if (room.players.some(p => p.username === cleanUser)) {
    showToast(`@${cleanUser} is already in this room.`, 'amber');
    return;
  }

  const inviteId = `inv_${room.id}_${cleanUser}`;
  const inviteObj = {
    id: inviteId,
    roomId: room.id,
    roomTitle: room.title,
    roomCode: room.code,
    fromUsername: myAccount.username,
    toUsername: cleanUser,
    createdAt: Date.now()
  };

  allInvitesMap[inviteId] = inviteObj;
  feedback.textContent = `Invite sent to @${cleanUser}!`;
  feedback.className = 'text-xs mt-2 text-emerald-400 font-semibold';
  feedback.classList.remove('hidden');
  playSfx('cash');
  showToast(`Invite sent to @${cleanUser}`, 'emerald');

  if (isCloudConnected && db) {
    safeCloudWrite(
      setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'copypoly_invites', inviteId), inviteObj),
      'sendInvite'
    );
  }
}

async function addHotseatSimulatedPlayer() {
  if (!currentRoomId || !allRoomsMap[currentRoomId]) return;
  const room = allRoomsMap[currentRoomId];
  if (room.players.length >= 8) {
    showToast('Maximum of 8 players reached!', 'rose');
    return;
  }

  const botNames = [
    { username: 'player_2', displayName: 'Player 2' },
    { username: 'player_3', displayName: 'Player 3' },
    { username: 'player_4', displayName: 'Player 4' },
    { username: 'player_5', displayName: 'Player 5' },
    { username: 'player_6', displayName: 'Player 6' },
    { username: 'player_7', displayName: 'Player 7' },
    { username: 'player_8', displayName: 'Player 8' }
  ];

  const usedIds = new Set(room.players.map(p => p.username));
  const pick = botNames.find(b => !usedIds.has(b.username)) || {
    username: 'guest_' + (room.players.length + 1),
    displayName: 'Guest ' + (room.players.length + 1)
  };

  const seatIdx = room.players.length;
  const newSeat = createPlayerSeatObject(pick, seatIdx, room.startingCash || 1500, true);
  room.players.push(newSeat);
  room.logs.unshift({
    time: Date.now(),
    text: `Seat #${seatIdx + 1} joined: @${newSeat.username}.`
  });

  playSfx('buy');
  await saveRoomState(room);
}

async function joinRoomById(roomId) {
  if (!myAccount || !allRoomsMap[roomId]) return;
  const room = allRoomsMap[roomId];

  const alreadyIn = room.players.some(p => p.username === myAccount.username);
  if (!alreadyIn) {
    if (room.players.length >= 8) {
      showToast('This room is full (8/8 players)!', 'rose');
      return;
    }
    const seatIdx = room.players.length;
    const newSeat = createPlayerSeatObject(myAccount, seatIdx, room.startingCash || 1500, false);
    room.players.push(newSeat);
    room.logs.unshift({
      time: Date.now(),
      text: `@${myAccount.username} joined the room (${room.players.length}/8).`
    });
  }

  const invId = `inv_${roomId}_${myAccount.username}`;
  if (allInvitesMap[invId]) {
    delete allInvitesMap[invId];
    renderIncomingInvites();
    if (isCloudConnected && db) {
      safeCloudWrite(
        deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'copypoly_invites', invId)),
        'deleteInvite'
      );
    }
  }

  currentRoomId = roomId;
  playSfx('buy');
  await saveRoomState(room);
}

async function startRoomBoardGame() {
  if (!currentRoomId || !allRoomsMap[currentRoomId]) return;
  const room = allRoomsMap[currentRoomId];
  if (room.players.length < 2) {
    showToast('Add at least 2 players to start the game.', 'amber');
    return;
  }

  room.status = 'playing';
  room.turnIndex = 0;
  room.turnNumber = 1;
  room.turnPhase = 'PRE_ROLL';
  room.logs.unshift({
    time: Date.now(),
    text: `Game started with ${room.players.length} players! @${room.players[0].username} rolls first.`
  });

  playSfx('trade');
  await saveRoomState(room);
}

function renderRegisteredUsersDirectory() {
  const container = document.getElementById('listRegisteredUsers');
  if (!container) return;
  const users = Object.values(registeredUsersMap);
  document.getElementById('badgeUserCount').textContent = `${users.length} users`;

  if (users.length === 0) {
    container.innerHTML = `<span class="text-xs text-slate-400">No players registered yet.</span>`;
    return;
  }

  container.innerHTML = users.map(u => {
    const isMe = myAccount && u.username === myAccount.username;
    return `
      <button type="button" data-username="${u.username}"
        class="dir-user-chip text-xs px-2.5 py-1 rounded-md border transition flex items-center gap-1 ${
          isMe
            ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 font-semibold'
            : 'bg-slate-900 hover:bg-slate-700 border-slate-700 text-slate-200'
        }">
        <span>@${u.username}</span>
        ${isMe ? '<span class="text-[10px] text-emerald-400">(You)</span>' : ''}
      </button>
    `;
  }).join('');

  container.querySelectorAll('.dir-user-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.username;
      if (myAccount && target === myAccount.username) return;
      const input = document.getElementById('inputInviteUsername');
      if (input) input.value = target;
      if (currentRoomId) {
        sendUsernameInvite(target);
      } else {
        showToast(`Create a room first to invite @${target}.`, 'cyan');
      }
    });
  });
}

function renderIncomingInvites() {
  const container = document.getElementById('listIncomingInvites');
  if (!container || !myAccount) return;

  const myInvites = Object.values(allInvitesMap).filter(
    inv => inv.toUsername === myAccount.username && allRoomsMap[inv.roomId]
  );
  document.getElementById('badgeInviteCount').textContent = String(myInvites.length);

  if (myInvites.length === 0) {
    container.innerHTML = `
      <div class="text-xs text-slate-400 bg-slate-900 border border-slate-700 rounded-lg p-3 text-center">
        No pending invites for @${myAccount.username}.
      </div>
    `;
    return;
  }

  container.innerHTML = myInvites.map(inv => `
    <div class="p-3 rounded-lg bg-slate-900 border border-emerald-500/40 flex items-center justify-between gap-2">
      <div>
        <div class="text-xs font-bold text-white">${inv.roomTitle}</div>
        <div class="text-[11px] text-slate-300">From @${inv.fromUsername}</div>
      </div>
      <button data-room="${inv.roomId}" class="btn-accept-invite px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition">
        Join
      </button>
    </div>
  `).join('');

  container.querySelectorAll('.btn-accept-invite').forEach(btn => {
    btn.addEventListener('click', () => joinRoomById(btn.dataset.room));
  });
}

function renderLobbyViews() {
  const listEl = document.getElementById('listPublicRooms');
  if (!listEl) return;
  const rooms = Object.values(allRoomsMap).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  if (rooms.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-8 bg-slate-900 border border-slate-700 rounded-lg">
        <div class="text-sm font-semibold text-slate-300">No active rooms yet</div>
        <div class="text-xs text-slate-400 mt-1">Create a new room on the left to start playing.</div>
      </div>
    `;
  } else {
    listEl.innerHTML = rooms.map(r => {
      const isMember = myAccount && r.players.some(p => p.username === myAccount.username);
      const statusBadge = r.status === 'waiting'
        ? `<span class="text-[10px] px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-semibold">Waiting</span>`
        : `<span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">Turn #${r.turnNumber || 1}</span>`;

      return `
        <div class="p-3.5 rounded-lg bg-slate-900 border border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">${r.title}</span>
              ${statusBadge}
              <span class="text-xs text-slate-400">#${r.code}</span>
            </div>
            <div class="text-xs text-slate-400 mt-1">
              Host: <strong class="text-slate-200">@${r.hostUsername}</strong> • Players: <strong class="text-white">${r.players.length}/8</strong>
            </div>
          </div>
          <button data-room="${r.id}" class="btn-join-room px-4 py-2 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition">
            ${isMember ? 'Return to Game' : 'Join Room'}
          </button>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-join-room').forEach(btn => {
      btn.addEventListener('click', () => joinRoomById(btn.dataset.room));
    });
  }

  const stagingPanel = document.getElementById('panelRoomStaging');
  if (currentRoomId && allRoomsMap[currentRoomId] && allRoomsMap[currentRoomId].status === 'waiting') {
    const room = allRoomsMap[currentRoomId];
    stagingPanel.classList.remove('hidden');
    document.getElementById('stagingRoomTitle').textContent = room.title;
    document.getElementById('stagingRoomCode').textContent = `ROOM CODE: ${room.code}`;
    document.getElementById('stagingSeatCounter').textContent = `${room.players.length} / 8 Players`;

    const slotsHtml = [];
    for (let i = 0; i < 8; i++) {
      const p = room.players[i];
      if (p) {
        slotsHtml.push(`
          <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-base" style="background:${p.color}30; border:2px solid ${p.color}">
                ${p.emoji}
              </div>
              <div>
                <div class="text-xs font-bold text-white">${p.displayName}</div>
                <div class="text-[11px] text-emerald-400">@${p.username}</div>
              </div>
            </div>
            <span class="text-xs font-semibold text-slate-300">$${p.money}</span>
          </div>
        `);
      } else {
        slotsHtml.push(`
          <div class="p-2.5 rounded-lg bg-slate-900/40 border border-dashed border-slate-700 flex items-center justify-between text-slate-400">
            <span class="text-xs">Seat #${i + 1} — Open</span>
          </div>
        `);
      }
    }
    document.getElementById('gridStagingPlayers').innerHTML = slotsHtml.join('');
  } else if (stagingPanel) {
    stagingPanel.classList.add('hidden');
  }
}

function syncActiveRoomUI(room) {
  const navBadge = document.getElementById('navRoomBadge');
  navBadge.classList.remove('hidden');
  navBadge.classList.add('flex');
  document.getElementById('navRoomName').textContent = room.title;
  document.getElementById('navRoomCode').textContent = `#${room.code}`;

  if (room.status === 'waiting') {
    showViewSection('lobby');
    renderLobbyViews();
  } else {
    showViewSection('game');
    renderFullBoardGame(room);
  }
}

// ============================================================================
// 6. CLASSIC 11x11 MONOPOLY BOARD RENDERER & CLASSIC TITLE DEED CARD
// ============================================================================
function getGridPositionForTile(tileId) {
  if (tileId >= 0 && tileId <= 10) return { row: 11, col: 11 - tileId };
  if (tileId >= 11 && tileId <= 20) return { row: 11 - (tileId - 10), col: 1 };
  if (tileId >= 21 && tileId <= 30) return { row: 1, col: 1 + (tileId - 20) };
  return { row: 1 + (tileId - 30), col: 11 };
}

function renderFullBoardGame(room) {
  renderPlayerRoster(room);
  renderMonopolyGrid(room);
  renderDeedInspector(room, selectedInspectTileId);
  renderPortfolioSidebar(room);
  renderActivityLog(room);
  syncTradeAndAuctionModals(room);
}

function renderMonopolyGrid(room) {
  const boardEl = document.getElementById('monopolyBoardGrid');
  const propsState = room.properties || {};

  const tilesHtml = BOARD_TILES.map((tile) => {
    const pos = getGridPositionForTile(tile.id);
    const propData = propsState[tile.id] || null;
    const owner = propData && propData.owner
      ? room.players.find(p => p.username === propData.owner)
      : null;
    const houses = propData ? (propData.houses || 0) : 0;
    const isMortgaged = propData && propData.mortgaged;

    const standingPlayers = room.players.filter(p => !p.bankrupt && p.position === tile.id);
    const activePlayer = room.players[room.turnIndex];

    let headerBarHtml = '';
    if (tile.group && GROUP_COLORS[tile.group]) {
      const grp = GROUP_COLORS[tile.group];
      let pipsHtml = '';
      if (houses > 0 && houses < 5) {
        pipsHtml = Array(houses).fill('<span class="w-2.5 h-2.5 rounded-sm bg-green-600 border border-black shadow-sm"></span>').join('');
      } else if (houses === 5) {
        pipsHtml = '<span class="w-3.5 h-2.5 rounded-sm bg-red-600 border border-black shadow-sm"></span>';
      }
      headerBarHtml = `
        <div class="color-bar" style="background-color: ${grp.hex}">
          ${pipsHtml}
        </div>
      `;
    }

    const ownerStripHtml = owner
      ? `<div class="w-full h-2 border-t border-black/40" style="background-color: ${owner.color}" title="Owned by @${owner.username}"></div>`
      : '';

    const isSelected = selectedInspectTileId === tile.id;

    return `
      <div data-tile-id="${tile.id}"
        style="grid-row: ${pos.row}; grid-column: ${pos.col};"
        class="board-tile ${isMortgaged ? 'mortgaged' : ''} ${isSelected ? 'ring-2 ring-blue-600 z-10' : ''}">
        ${headerBarHtml}
        <div class="flex-1 flex flex-col items-center justify-center px-0.5">
          ${tile.icon ? `<div class="text-xs leading-none mb-0.5">${tile.icon}</div>` : ''}
          <div class="tile-name">${tile.name}</div>
          ${tile.price > 0 ? `<div class="tile-price">${isMortgaged ? 'MORTGAGED' : '$' + tile.price}</div>` : ''}
        </div>
        <div class="tile-tokens">
          ${standingPlayers.map(p => `
            <div class="player-token-pin ${activePlayer && activePlayer.username === p.username ? 'active-turn' : ''}"
              style="background-color: ${p.color}"
              title="@${p.username} ($${p.money})">
              ${p.emoji}
            </div>
          `).join('')}
        </div>
        ${ownerStripHtml}
      </div>
    `;
  }).join('');

  const centerHtml = buildCenterCommandHubHtml(room);
  boardEl.innerHTML = tilesHtml + centerHtml;

  boardEl.querySelectorAll('.board-tile').forEach(el => {
    el.addEventListener('click', () => {
      selectedInspectTileId = parseInt(el.dataset.tileId, 10);
      renderMonopolyGrid(room);
      renderDeedInspector(room, selectedInspectTileId);
    });
  });

  bindCenterHubEvents(room);
}

function buildCenterCommandHubHtml(room) {
  const activePlayer = room.players[room.turnIndex] || room.players[0];
  const currentTile = BOARD_TILES[activePlayer.position];
  const d1 = room.lastDice ? room.lastDice[0] : 6;
  const d2 = room.lastDice ? room.lastDice[1] : 6;

  if (room.status === 'finished' && room.winnerName) {
    return `
      <div class="board-center items-center justify-center text-center p-6">
        <div class="text-5xl mb-3">🏆</div>
        <h2 class="text-2xl font-extrabold text-slate-900">GAME OVER!</h2>
        <p class="text-base font-bold text-emerald-800 mt-2">${room.winnerName} wins COPYPOLY!</p>
      </div>
    `;
  }

  let phaseActionsHtml = '';
  if (room.turnPhase === 'PRE_ROLL') {
    if (activePlayer.inJail) {
      phaseActionsHtml = `
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button id="btnRollDice" class="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow">
            Roll for Doubles (${activePlayer.jailTurns + 1}/3)
          </button>
          <button id="btnPayBail" ${activePlayer.money < 50 ? 'disabled' : ''} class="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs">
            Pay $50 Bail
          </button>
          ${activePlayer.jailFreeCards > 0 ? `
            <button id="btnUseJailCard" class="px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs">
              Use Jail Free Card
            </button>
          ` : ''}
        </div>
      `;
    } else {
      phaseActionsHtml = `
        <button id="btnRollDice" class="px-7 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-md transition flex items-center gap-2">
          <i class="fa-solid fa-dice"></i> Roll Dice
        </button>
      `;
    }
  } else if (room.turnPhase === 'BUY_DECISION') {
    const canAfford = activePlayer.money >= currentTile.price;
    phaseActionsHtml = `
      <div class="flex flex-col items-center gap-2">
        <div class="text-xs font-bold text-slate-800">Unowned Property: <span>${currentTile.name} ($${currentTile.price})</span></div>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button id="btnBuyProperty" ${!canAfford ? 'disabled' : ''} class="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold text-xs shadow">
            Buy for $${currentTile.price}
          </button>
          <button id="btnStartAuction" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs">
            Auction
          </button>
        </div>
      </div>
    `;
  } else if (room.turnPhase === 'DEBT_RESOLUTION' && room.pendingDebt) {
    const debt = room.pendingDebt;
    const canPayNow = activePlayer.money >= debt.amount;
    phaseActionsHtml = `
      <div class="bg-red-100 border-2 border-red-600 rounded-lg p-3 text-center space-y-2 max-w-md">
        <div class="text-xs font-bold text-red-900">
          @${activePlayer.username} owes $${debt.amount} (${debt.reason})
        </div>
        <div class="text-[11px] text-red-800">Sell houses, mortgage properties, or trade to raise cash.</div>
        <div class="flex items-center justify-center gap-2 pt-1">
          <button id="btnPayPendingDebt" ${!canPayNow ? 'disabled' : ''} class="px-4 py-1.5 rounded bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs">
            Pay $${debt.amount}
          </button>
          <button id="btnDeclareBankruptcy" class="px-4 py-1.5 rounded bg-red-700 hover:bg-red-600 text-white font-bold text-xs">
            Declare Bankruptcy
          </button>
        </div>
      </div>
    `;
  } else if (room.turnPhase === 'POST_ROLL') {
    const rolledDoubles = d1 === d2 && !activePlayer.inJail && room.doublesCount > 0;
    phaseActionsHtml = `
      <div class="flex flex-wrap items-center justify-center gap-2.5">
        ${rolledDoubles ? `
          <button id="btnRollDice" class="px-6 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow">
            Rolled Doubles! Roll Again
          </button>
        ` : `
          <button id="btnEndTurn" class="px-6 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow">
            End Turn <i class="fa-solid fa-forward-step ml-1"></i>
          </button>
        `}
      </div>
    `;
  }

  return `
    <div class="board-center">
      <div class="flex items-center justify-between gap-3">
        <div class="flex-1 bg-amber-50 border-2 border-slate-800 rounded-lg p-2 flex items-center gap-2 shadow-sm">
          <div class="w-8 h-10 rounded bg-amber-400 border border-slate-900 flex items-center justify-center font-bold text-base">❓</div>
          <div class="leading-tight">
            <div class="text-xs font-extrabold text-slate-900 uppercase">Plot Twist</div>
            <div class="text-[10px] text-slate-600">Chance Deck</div>
          </div>
        </div>

        <div class="px-5 py-2 rounded bg-red-600 border-2 border-white shadow-md text-center hidden sm:block">
          <div class="font-extrabold text-lg tracking-widest text-white">COPYPOLY</div>
        </div>

        <div class="flex-1 bg-sky-50 border-2 border-slate-800 rounded-lg p-2 flex items-center justify-end gap-2 text-right shadow-sm">
          <div class="leading-tight">
            <div class="text-xs font-extrabold text-slate-900 uppercase">Karma Vault</div>
            <div class="text-[10px] text-slate-600">Community Deck</div>
          </div>
          <div class="w-8 h-10 rounded bg-sky-400 border border-slate-900 flex items-center justify-center font-bold text-base">📦</div>
        </div>
      </div>

      <div class="flex-1 flex flex-col items-center justify-center my-3 px-4 py-3 rounded-xl bg-white/85 border-2 border-slate-800 shadow-sm">
        <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-400 mb-2">
          <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs border border-black" style="background:${activePlayer.color}">${activePlayer.emoji}</span>
          <span class="text-xs font-bold text-slate-900">${activePlayer.displayName}</span>
          <span class="text-xs text-slate-600">(@${activePlayer.username})</span>
          <span class="text-xs font-extrabold text-emerald-700 ml-1">$${activePlayer.money}</span>
        </div>

        <div class="flex items-center gap-4 my-2">
          <div id="dieBox1" class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white text-slate-900 font-extrabold text-2xl flex items-center justify-center shadow-md border-2 border-slate-900 ${isRollingAnim ? 'dice-rolling' : ''}">
            ${d1}
          </div>
          <div id="dieBox2" class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white text-slate-900 font-extrabold text-2xl flex items-center justify-center shadow-md border-2 border-slate-900 ${isRollingAnim ? 'dice-rolling' : ''}">
            ${d2}
          </div>
        </div>

        <div class="text-xs text-slate-700 mb-3 text-center">
          Current Space: <strong class="text-slate-950">${currentTile.name}</strong>
          ${activePlayer.inJail ? '<span class="ml-1 text-red-600 font-bold">(In Jail)</span>' : ''}
        </div>

        ${phaseActionsHtml}

        ${room.lastCard ? `
          <div class="mt-3 px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-500 text-center max-w-md">
            <div class="text-[11px] uppercase text-amber-900 font-bold">${room.lastCard.deck}: ${room.lastCard.title}</div>
            <div class="text-xs text-slate-800">${room.lastCard.desc}</div>
          </div>
        ` : ''}
      </div>

      <div class="flex items-center justify-between gap-2 bg-white/90 border-2 border-slate-800 rounded-lg px-3 py-2">
        <div class="text-xs text-slate-700 truncate">
          Click any property on the board to view its Title Deed or build houses.
        </div>
        <button id="btnCenterProposeTrade" class="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition whitespace-nowrap shadow-sm">
          Trade
        </button>
      </div>
    </div>
  `;
}

function bindCenterHubEvents(room) {
  const btnRoll = document.getElementById('btnRollDice');
  if (btnRoll) btnRoll.addEventListener('click', () => executeDiceRoll(room));

  const btnBail = document.getElementById('btnPayBail');
  if (btnBail) btnBail.addEventListener('click', () => executePayJailBail(room));

  const btnJailCard = document.getElementById('btnUseJailCard');
  if (btnJailCard) btnJailCard.addEventListener('click', () => executeUseJailCard(room));

  const btnBuy = document.getElementById('btnBuyProperty');
  if (btnBuy) btnBuy.addEventListener('click', () => executeBuyProperty(room));

  const btnAuction = document.getElementById('btnStartAuction');
  if (btnAuction) btnAuction.addEventListener('click', () => executeStartAuction(room));

  const btnEnd = document.getElementById('btnEndTurn');
  if (btnEnd) btnEnd.addEventListener('click', () => executeEndTurn(room));

  const btnPayDebt = document.getElementById('btnPayPendingDebt');
  if (btnPayDebt) btnPayDebt.addEventListener('click', () => executePayPendingDebt(room));

  const btnBankrupt = document.getElementById('btnDeclareBankruptcy');
  if (btnBankrupt) btnBankrupt.addEventListener('click', () => executeDeclareBankruptcy(room));

  const btnTrade = document.getElementById('btnCenterProposeTrade');
  if (btnTrade) btnTrade.addEventListener('click', () => openTradeHubModal(room));
}

// ============================================================================
// 7. MONOPOLY GAMEPLAY MECHANICS
// ============================================================================
function playerOwnsFullColorGroup(room, ownerUsername, groupKey) {
  if (!groupKey || !ownerUsername) return false;
  const groupTiles = BOARD_TILES.filter(t => t.group === groupKey);
  return groupTiles.every(t => {
    const st = room.properties[t.id];
    return st && st.owner === ownerUsername && !st.mortgaged;
  });
}

function calculateRentForTile(room, tile, diceTotal) {
  const st = room.properties[tile.id];
  if (!st || !st.owner || st.mortgaged) return 0;

  if (tile.type === 'prop') {
    const houses = st.houses || 0;
    if (houses > 0) return tile.rent[houses];
    const hasMonopoly = playerOwnsFullColorGroup(room, st.owner, tile.group);
    return hasMonopoly ? tile.rent[0] * 2 : tile.rent[0];
  }

  if (tile.type === 'transit') {
    const ownedStations = BOARD_TILES.filter(
      t => t.type === 'transit' && room.properties[t.id]?.owner === st.owner && !room.properties[t.id]?.mortgaged
    ).length;
    return [0, 25, 50, 100, 200][ownedStations] || 25;
  }

  if (tile.type === 'utility') {
    const ownedUtils = BOARD_TILES.filter(
      t => t.type === 'utility' && room.properties[t.id]?.owner === st.owner && !room.properties[t.id]?.mortgaged
    ).length;
    return ownedUtils >= 2 ? diceTotal * 10 : diceTotal * 4;
  }

  return 0;
}

async function executeDiceRoll(room) {
  if (isRollingAnim) return;
  const player = room.players[room.turnIndex];
  if (!player || player.bankrupt) return;

  isRollingAnim = true;
  playSfx('dice');
  renderMonopolyGrid(room);

  await new Promise(r => setTimeout(r, 350));
  isRollingAnim = false;

  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const total = d1 + d2;
  const isDoubles = d1 === d2;

  room.lastDice = [d1, d2];
  room.lastCard = null;

  if (player.inJail) {
    if (isDoubles) {
      player.inJail = false;
      player.jailTurns = 0;
      room.doublesCount = 0;
      room.logs.unshift({
        time: Date.now(),
        text: `@${player.username} rolled doubles (${d1}+${d2}) and got out of Jail!`
      });
      await movePlayerAndResolveTile(room, player, total);
    } else {
      player.jailTurns += 1;
      if (player.jailTurns >= 3) {
        player.inJail = false;
        player.jailTurns = 0;
        room.logs.unshift({
          time: Date.now(),
          text: `@${player.username} paid $50 bail after 3 turns and moved ${total} spaces.`
        });
        chargePlayerOrCreateDebt(room, player, 50, null, 'Mandatory Jail Bail');
        if (room.turnPhase !== 'DEBT_RESOLUTION') {
          await movePlayerAndResolveTile(room, player, total);
        }
      } else {
        room.logs.unshift({
          time: Date.now(),
          text: `@${player.username} rolled ${d1}+${d2} (no doubles) and stays in Jail (${player.jailTurns}/3).`
        });
        room.turnPhase = 'POST_ROLL';
      }
    }
    await saveRoomState(room);
    return;
  }

  if (isDoubles) {
    room.doublesCount = (room.doublesCount || 0) + 1;
    if (room.doublesCount >= 3) {
      sendPlayerToSlammer(room, player, 'Rolled 3 consecutive doubles');
      await saveRoomState(room);
      return;
    }
  } else {
    room.doublesCount = 0;
  }

  room.logs.unshift({
    time: Date.now(),
    text: `@${player.username} rolled ${d1} + ${d2} = ${total}${isDoubles ? ' (Doubles!)' : ''}.`
  });

  await movePlayerAndResolveTile(room, player, total);
  await saveRoomState(room);
}

function sendPlayerToSlammer(room, player, reason) {
  player.position = 10;
  player.inJail = true;
  player.jailTurns = 0;
  room.doublesCount = 0;
  room.turnPhase = 'POST_ROLL';
  playSfx('jail');
  room.logs.unshift({
    time: Date.now(),
    text: `@${player.username} was sent to Jail (${reason}).`
  });
}

async function movePlayerAndResolveTile(room, player, steps) {
  const oldPos = player.position;
  const newPos = (oldPos + steps + 40) % 40;

  if (steps > 0 && newPos < oldPos) {
    player.money += 200;
    playSfx('cash');
    room.logs.unshift({
      time: Date.now(),
      text: `@${player.username} passed START LINE and collected $200.`
    });
  }

  player.position = newPos;
  selectedInspectTileId = newPos;
  await resolveLandingOnTile(room, player);
}

async function resolveLandingOnTile(room, player) {
  const tile = BOARD_TILES[player.position];
  const diceSum = (room.lastDice[0] || 1) + (room.lastDice[1] || 1);

  if (tile.type === 'go' || tile.type === 'jail' || tile.type === 'parking') {
    room.turnPhase = 'POST_ROLL';
    return;
  }

  if (tile.type === 'gotojail') {
    sendPlayerToSlammer(room, player, 'Landed on Go To Jail');
    return;
  }

  if (tile.type === 'tax') {
    chargePlayerOrCreateDebt(room, player, tile.price, null, tile.name);
    return;
  }

  if (tile.type === 'chance' || tile.type === 'chest') {
    const isChance = tile.type === 'chance';
    const deck = isChance ? PLOT_TWIST_CARDS : KARMA_VAULT_CARDS;
    const card = deck[Math.floor(Math.random() * deck.length)];
    room.lastCard = { deck: isChance ? 'Plot Twist' : 'Karma Vault', title: card.title, desc: card.desc };
    room.logs.unshift({
      time: Date.now(),
      text: `@${player.username} drew ${room.lastCard.deck}: "${card.title}" — ${card.desc}`
    });
    await applyDeckCardEffect(room, player, card);
    return;
  }

  if (tile.type === 'prop' || tile.type === 'transit' || tile.type === 'utility') {
    const propState = room.properties[tile.id];
    if (!propState || !propState.owner) {
      room.turnPhase = 'BUY_DECISION';
      return;
    }

    if (propState.owner === player.username || propState.mortgaged) {
      room.turnPhase = 'POST_ROLL';
      return;
    }

    const rentAmount = calculateRentForTile(room, tile, diceSum);
    if (rentAmount > 0) {
      chargePlayerOrCreateDebt(room, player, rentAmount, propState.owner, `Rent at ${tile.name}`);
    } else {
      room.turnPhase = 'POST_ROLL';
    }
  }
}

async function applyDeckCardEffect(room, player, card) {
  if (card.action === 'move') {
    const oldPos = player.position;
    if (card.target < oldPos) {
      player.money += 200;
      room.logs.unshift({
        time: Date.now(),
        text: `@${player.username} passed START LINE and collected $200.`
      });
    }
    player.position = card.target;
    selectedInspectTileId = card.target;
    await resolveLandingOnTile(room, player);
  } else if (card.action === 'moveback') {
    player.position = (player.position - card.steps + 40) % 40;
    selectedInspectTileId = player.position;
    await resolveLandingOnTile(room, player);
  } else if (card.action === 'gotojail') {
    sendPlayerToSlammer(room, player, card.title);
  } else if (card.action === 'jailcard') {
    player.jailFreeCards = (player.jailFreeCards || 0) + 1;
    playSfx('buy');
    room.turnPhase = 'POST_ROLL';
  } else if (card.action === 'cash') {
    if (card.amount >= 0) {
      player.money += card.amount;
      playSfx('cash');
      room.turnPhase = 'POST_ROLL';
    } else {
      chargePlayerOrCreateDebt(room, player, Math.abs(card.amount), null, card.title);
    }
  } else if (card.action === 'payeach') {
    const others = room.players.filter(p => !p.bankrupt && p.username !== player.username);
    const totalOwed = others.length * card.amount;
    if (player.money >= totalOwed) {
      player.money -= totalOwed;
      others.forEach(o => { o.money += card.amount; });
      playSfx('cash');
      room.turnPhase = 'POST_ROLL';
    } else {
      chargePlayerOrCreateDebt(room, player, totalOwed, null, card.title);
    }
  } else if (card.action === 'collecteach') {
    const others = room.players.filter(p => !p.bankrupt && p.username !== player.username);
    let collected = 0;
    others.forEach(o => {
      const give = Math.min(o.money, card.amount);
      o.money -= give;
      collected += give;
    });
    player.money += collected;
    playSfx('cash');
    room.turnPhase = 'POST_ROLL';
  } else if (card.action === 'repairs') {
    let fee = 0;
    Object.entries(room.properties).forEach(([tid, st]) => {
      if (st.owner === player.username && st.houses > 0) {
        if (st.houses === 5) fee += card.hotel;
        else fee += st.houses * card.house;
      }
    });
    if (fee > 0) {
      chargePlayerOrCreateDebt(room, player, fee, null, `${card.title} ($${fee})`);
    } else {
      room.turnPhase = 'POST_ROLL';
    }
  }
}

function chargePlayerOrCreateDebt(room, player, amount, creditorUsername, reason) {
  if (player.money >= amount) {
    player.money -= amount;
    if (creditorUsername) {
      const cred = room.players.find(p => p.username === creditorUsername);
      if (cred) cred.money += amount;
      room.logs.unshift({
        time: Date.now(),
        text: `@${player.username} paid $${amount} to @${creditorUsername} (${reason}).`
      });
    } else {
      room.logs.unshift({
        time: Date.now(),
        text: `@${player.username} paid $${amount} to the Bank (${reason}).`
      });
    }
    playSfx('cash');
    room.pendingDebt = null;
    room.turnPhase = 'POST_ROLL';
  } else {
    room.pendingDebt = {
      debtor: player.username,
      creditor: creditorUsername || null,
      amount,
      reason
    };
    room.turnPhase = 'DEBT_RESOLUTION';
    playSfx('jail');
    room.logs.unshift({
      time: Date.now(),
      text: `@${player.username} owes $${amount} (${reason}) but only has $${player.money}.`
    });
  }
}

async function executePayJailBail(room) {
  const player = room.players[room.turnIndex];
  if (!player || !player.inJail || player.money < 50) return;
  player.money -= 50;
  player.inJail = false;
  player.jailTurns = 0;
  playSfx('cash');
  room.logs.unshift({
    time: Date.now(),
    text: `@${player.username} paid $50 bail and left Jail.`
  });
  await saveRoomState(room);
}

async function executeUseJailCard(room) {
  const player = room.players[room.turnIndex];
  if (!player || !player.inJail || (player.jailFreeCards || 0) <= 0) return;
  player.jailFreeCards -= 1;
  player.inJail = false;
  player.jailTurns = 0;
  playSfx('buy');
  room.logs.unshift({
    time: Date.now(),
    text: `@${player.username} used a Get Out of Jail Free card.`
  });
  await saveRoomState(room);
}

async function executeBuyProperty(room) {
  const player = room.players[room.turnIndex];
  const tile = BOARD_TILES[player.position];
  if (!tile || player.money < tile.price) return;

  player.money -= tile.price;
  room.properties[tile.id] = {
    owner: player.username,
    houses: 0,
    mortgaged: false
  };
  room.turnPhase = 'POST_ROLL';
  playSfx('buy');
  room.logs.unshift({
    time: Date.now(),
    text: `@${player.username} bought ${tile.name} for $${tile.price}.`
  });
  await saveRoomState(room);
}

async function executeStartAuction(room) {
  const player = room.players[room.turnIndex];
  const tile = BOARD_TILES[player.position];
  room.activeAuction = {
    tileId: tile.id,
    highBid: 10,
    highBidder: player.username
  };
  playSfx('trade');
  room.logs.unshift({
    time: Date.now(),
    text: `${tile.name} is up for auction!`
  });
  await saveRoomState(room);
}

async function executePayPendingDebt(room) {
  const player = room.players[room.turnIndex];
  const debt = room.pendingDebt;
  if (!debt || player.money < debt.amount) return;
  chargePlayerOrCreateDebt(room, player, debt.amount, debt.creditor, debt.reason);
  await saveRoomState(room);
}

async function executeDeclareBankruptcy(room) {
  const player = room.players[room.turnIndex];
  const debt = room.pendingDebt;
  player.bankrupt = true;
  const creditor = debt && debt.creditor
    ? room.players.find(p => p.username === debt.creditor)
    : null;

  if (creditor) {
    creditor.money += Math.max(0, player.money);
    creditor.jailFreeCards = (creditor.jailFreeCards || 0) + (player.jailFreeCards || 0);
    Object.entries(room.properties).forEach(([tid, st]) => {
      if (st.owner === player.username) st.owner = creditor.username;
    });
    room.logs.unshift({
      time: Date.now(),
      text: `@${player.username} declared bankruptcy to @${creditor.username}.`
    });
  } else {
    Object.entries(room.properties).forEach(([tid, st]) => {
      if (st.owner === player.username) delete room.properties[tid];
    });
    room.logs.unshift({
      time: Date.now(),
      text: `@${player.username} declared bankruptcy to the Bank.`
    });
  }

  player.money = 0;
  player.jailFreeCards = 0;
  room.pendingDebt = null;
  room.turnPhase = 'POST_ROLL';

  const survivors = room.players.filter(p => !p.bankrupt);
  if (survivors.length === 1) {
    room.status = 'finished';
    room.winnerName = `${survivors[0].displayName} (@${survivors[0].username})`;
    room.logs.unshift({
      time: Date.now(),
      text: `GAME OVER! @${survivors[0].username} wins COPYPOLY!`
    });
    playSfx('trade');
    await saveRoomState(room);
    return;
  }

  await executeEndTurn(room);
}

async function executeEndTurn(room) {
  const totalPlayers = room.players.length;
  let nextIdx = room.turnIndex;
  for (let i = 0; i < totalPlayers; i++) {
    nextIdx = (nextIdx + 1) % totalPlayers;
    if (!room.players[nextIdx].bankrupt) break;
  }

  room.turnIndex = nextIdx;
  room.turnNumber = (room.turnNumber || 1) + 1;
  room.turnPhase = 'PRE_ROLL';
  room.doublesCount = 0;
  room.lastCard = null;

  const nextPlayer = room.players[nextIdx];
  selectedInspectTileId = nextPlayer.position;
  selectedPortfolioPlayerId = nextPlayer.username;

  await saveRoomState(room);
}

// ============================================================================
// 8. BUILDING HOUSES / HOTELS & MORTGAGING
// ============================================================================
function canBuildHouseOnTile(room, tile, ownerUsername) {
  if (tile.type !== 'prop') return false;
  const st = room.properties[tile.id];
  if (!st || st.owner !== ownerUsername || st.mortgaged) return false;
  if ((st.houses || 0) >= 5) return false;
  if (!playerOwnsFullColorGroup(room, ownerUsername, tile.group)) return false;

  const player = room.players.find(p => p.username === ownerUsername);
  if (!player || player.money < tile.houseCost) return false;

  const groupTiles = BOARD_TILES.filter(t => t.group === tile.group);
  const minHouses = Math.min(...groupTiles.map(t => room.properties[t.id]?.houses || 0));
  return (st.houses || 0) <= minHouses;
}

function canSellHouseOnTile(room, tile, ownerUsername) {
  if (tile.type !== 'prop') return false;
  const st = room.properties[tile.id];
  if (!st || st.owner !== ownerUsername || (st.houses || 0) <= 0) return false;

  const groupTiles = BOARD_TILES.filter(t => t.group === tile.group);
  const maxHouses = Math.max(...groupTiles.map(t => room.properties[t.id]?.houses || 0));
  return (st.houses || 0) >= maxHouses;
}

async function handleBuildHouse(room, tileId) {
  const tile = BOARD_TILES[tileId];
  const st = room.properties[tileId];
  if (!st || !canBuildHouseOnTile(room, tile, st.owner)) return;

  const player = room.players.find(p => p.username === st.owner);
  player.money -= tile.houseCost;
  st.houses = (st.houses || 0) + 1;

  const label = st.houses === 5 ? 'a Hotel' : `House #${st.houses}`;
  playSfx('buy');
  room.logs.unshift({
    time: Date.now(),
    text: `@${player.username} built ${label} on ${tile.name} ($${tile.houseCost}).`
  });
  await saveRoomState(room);
}

async function handleSellHouse(room, tileId) {
  const tile = BOARD_TILES[tileId];
  const st = room.properties[tileId];
  if (!st || !canSellHouseOnTile(room, tile, st.owner)) return;

  const player = room.players.find(p => p.username === st.owner);
  const refund = Math.floor(tile.houseCost / 2);
  st.houses -= 1;
  player.money += refund;

  playSfx('cash');
  room.logs.unshift({
    time: Date.now(),
    text: `@${player.username} sold a building on ${tile.name} (+$${refund}).`
  });
  await saveRoomState(room);
}

async function handleToggleMortgage(room, tileId) {
  const tile = BOARD_TILES[tileId];
  const st = room.properties[tileId];
  if (!st || !st.owner) return;

  const player = room.players.find(p => p.username === st.owner);
  if (!player) return;

  if (!st.mortgaged) {
    if ((st.houses || 0) > 0) {
      showToast('Sell houses on this property before mortgaging.', 'rose');
      return;
    }
    const mortgageVal = Math.floor(tile.price / 2);
    st.mortgaged = true;
    player.money += mortgageVal;
    playSfx('cash');
    room.logs.unshift({
      time: Date.now(),
      text: `@${player.username} mortgaged ${tile.name} (+$${mortgageVal}).`
    });
  } else {
    const unmortgageCost = Math.ceil((tile.price / 2) * 1.1);
    if (player.money < unmortgageCost) {
      showToast(`Need $${unmortgageCost} to unmortgage ${tile.name}.`, 'rose');
      return;
    }
    player.money -= unmortgageCost;
    st.mortgaged = false;
    playSfx('buy');
    room.logs.unshift({
      time: Date.now(),
      text: `@${player.username} unmortgaged ${tile.name} (-$${unmortgageCost}).`
    });
  }
  await saveRoomState(room);
}

// ============================================================================
// 9. SIDEBARS & CLASSIC WHITE PAPER TITLE DEED INSPECTOR
// ============================================================================
function renderPlayerRoster(room) {
  const container = document.getElementById('gamePlayerRoster');
  const activePlayer = room.players[room.turnIndex];

  container.innerHTML = room.players.map((p) => {
    const isTurn = activePlayer && activePlayer.username === p.username && !p.bankrupt;
    const propCount = Object.values(room.properties).filter(st => st.owner === p.username).length;
    const tileName = BOARD_TILES[p.position]?.name || 'Start Line';

    return `
      <div class="p-2.5 rounded-lg border transition flex items-center justify-between gap-2 ${
        p.bankrupt
          ? 'bg-slate-900/40 border-slate-800 opacity-45'
          : isTurn
          ? 'bg-slate-700 border-emerald-400 shadow'
          : 'bg-slate-900 border-slate-700'
      }">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
            style="background:${p.color}30; border:2px solid ${p.color}">
            ${p.emoji}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-white truncate">${p.displayName}</span>
              <span class="text-[11px] text-emerald-400">@${p.username}</span>
            </div>
            <div class="text-[11px] text-slate-400 truncate">
              ${p.bankrupt ? 'Bankrupt' : `${tileName} • ${propCount} properties`}
              ${p.inJail ? ' • <span class="text-red-400 font-bold">In Jail</span>' : ''}
            </div>
          </div>
        </div>

        <div class="text-right shrink-0">
          <div class="text-xs font-extrabold ${p.money < 100 ? 'text-red-400' : 'text-emerald-400'}">
            $${p.money}
          </div>
          ${!p.bankrupt ? `
            <button data-partner="${p.username}" class="btn-quick-trade text-[11px] text-amber-300 hover:underline font-semibold">
              Trade
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-quick-trade').forEach(btn => {
    btn.addEventListener('click', () => openTradeHubModal(room, btn.dataset.partner));
  });
}

function renderPortfolioSidebar(room) {
  const sel = document.getElementById('selectPortfolioPlayer');
  if (!selectedPortfolioPlayerId || !room.players.some(p => p.username === selectedPortfolioPlayerId)) {
    selectedPortfolioPlayerId = room.players[room.turnIndex]?.username || room.players[0]?.username;
  }

  sel.innerHTML = room.players.map(p => `
    <option value="${p.username}" ${p.username === selectedPortfolioPlayerId ? 'selected' : ''}>
      @${p.username} (${p.displayName})
    </option>
  `).join('');

  sel.onchange = () => {
    selectedPortfolioPlayerId = sel.value;
    renderPortfolioSidebar(room);
  };

  const ownedTiles = BOARD_TILES.filter(t => room.properties[t.id]?.owner === selectedPortfolioPlayerId);
  const listEl = document.getElementById('portfolioDeedList');

  if (ownedTiles.length === 0) {
    listEl.innerHTML = `<div class="text-xs text-slate-400 text-center py-4">No properties owned yet.</div>`;
    return;
  }

  listEl.innerHTML = ownedTiles.map(t => {
    const st = room.properties[t.id];
    const grp = GROUP_COLORS[t.group] || { hex: '#64748b' };
    return `
      <div data-tile="${t.id}" class="portfolio-item p-2 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 cursor-pointer flex items-center justify-between transition">
        <div class="flex items-center gap-2">
          <span class="w-3.5 h-5 rounded-sm border border-black/40 shrink-0" style="background:${grp.hex}"></span>
          <div>
            <div class="text-xs font-bold text-white">${t.name}</div>
            <div class="text-[10px] text-slate-400">
              ${st.mortgaged ? '<span class="text-red-400 font-bold">MORTGAGED</span>' : (st.houses === 5 ? 'Hotel' : st.houses > 0 ? `${st.houses} House(s)` : 'Unimproved')}
            </div>
          </div>
        </div>
        <span class="text-xs font-semibold text-slate-300">$${t.price}</span>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.portfolio-item').forEach(el => {
    el.addEventListener('click', () => {
      selectedInspectTileId = parseInt(el.dataset.tile, 10);
      renderMonopolyGrid(room);
      renderDeedInspector(room, selectedInspectTileId);
    });
  });
}

function renderDeedInspector(room, tileId) {
  const card = document.getElementById('deedInspectorCard');
  const tile = BOARD_TILES[tileId] || BOARD_TILES[0];
  const st = room.properties[tile.id] || null;
  const owner = st && st.owner ? room.players.find(p => p.username === st.owner) : null;
  const grp = tile.group ? GROUP_COLORS[tile.group] : null;

  if (tile.type !== 'prop' && tile.type !== 'transit' && tile.type !== 'utility') {
    card.innerHTML = `
      <div class="bg-white text-slate-900 border-2 border-slate-900 rounded-lg p-4 text-center space-y-1.5">
        <div class="text-3xl">${tile.icon || '🎲'}</div>
        <h3 class="text-base font-extrabold">${tile.name}</h3>
        <p class="text-xs text-slate-600">${tile.sub || 'Click any property space on the board to view its Title Deed card.'}</p>
      </div>
    `;
    return;
  }

  let rentTableHtml = '';
  if (tile.type === 'prop') {
    rentTableHtml = `
      <div class="space-y-1 text-xs my-3 text-slate-800">
        <div class="flex justify-between"><span>RENT</span><span class="font-bold">$${tile.rent[0]}</span></div>
        <div class="flex justify-between"><span>Rent with color set</span><span class="font-bold">$${tile.rent[0] * 2}</span></div>
        <div class="flex justify-between"><span>With 1 House</span><span>$${tile.rent[1]}</span></div>
        <div class="flex justify-between"><span>With 2 Houses</span><span>$${tile.rent[2]}</span></div>
        <div class="flex justify-between"><span>With 3 Houses</span><span>$${tile.rent[3]}</span></div>
        <div class="flex justify-between"><span>With 4 Houses</span><span>$${tile.rent[4]}</span></div>
        <div class="flex justify-between font-bold border-t border-slate-300 pt-1"><span>With HOTEL</span><span>$${tile.rent[5]}</span></div>
        <div class="flex justify-between text-[11px] text-slate-600 pt-1">
          <span>Houses cost $${tile.houseCost} each</span>
          <span>Mortgage $${Math.floor(tile.price / 2)}</span>
        </div>
      </div>
    `;
  } else if (tile.type === 'transit') {
    rentTableHtml = `
      <div class="space-y-1 text-xs my-3 text-slate-800">
        <div class="flex justify-between"><span>Rent (1 Station)</span><span class="font-bold">$25</span></div>
        <div class="flex justify-between"><span>If 2 Stations are owned</span><span class="font-bold">$50</span></div>
        <div class="flex justify-between"><span>If 3 Stations are owned</span><span class="font-bold">$100</span></div>
        <div class="flex justify-between font-bold"><span>If 4 Stations are owned</span><span>$200</span></div>
      </div>
    `;
  } else if (tile.type === 'utility') {
    rentTableHtml = `
      <div class="space-y-1.5 text-xs my-3 text-slate-800">
        <p>If one Utility is owned, rent is <strong>4 times</strong> amount shown on dice.</p>
        <p>If both Utilities are owned, rent is <strong>10 times</strong> amount shown on dice.</p>
      </div>
    `;
  }

  let manageControlsHtml = '';
  if (owner) {
    const canBuild = canBuildHouseOnTile(room, tile, owner.username);
    const canSell = canSellHouseOnTile(room, tile, owner.username);
    const unmortCost = Math.ceil((tile.price / 2) * 1.1);

    manageControlsHtml = `
      <div class="space-y-2 pt-2 border-t border-slate-300 text-slate-900">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-600">Owner:</span>
          <span class="font-bold">${owner.emoji} @${owner.username}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          ${tile.type === 'prop' ? `
            <button id="btnInspectorBuild" ${!canBuild ? 'disabled' : ''} class="px-2.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-30 text-white font-bold text-xs transition">
              + House ($${tile.houseCost})
            </button>
            <button id="btnInspectorSell" ${!canSell ? 'disabled' : ''} class="px-2.5 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-white font-bold text-xs transition">
              - Sell (+$${Math.floor(tile.houseCost / 2)})
            </button>
          ` : ''}
        </div>
        <button id="btnInspectorMortgage" class="w-full py-1.5 rounded font-bold text-xs border border-slate-400 bg-slate-100 hover:bg-slate-200 text-slate-800 transition">
          ${st.mortgaged ? `Unmortgage (-$${unmortCost})` : `Mortgage (+$${Math.floor(tile.price / 2)})`}
        </button>
      </div>
    `;
  } else {
    manageControlsHtml = `
      <div class="text-center py-1.5 px-3 rounded bg-slate-100 border border-slate-300 text-xs text-slate-700">
        Unowned — Price: <strong>$${tile.price}</strong>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="bg-white text-slate-900 border-2 border-slate-900 rounded-lg p-3 shadow">
      <div class="rounded border-2 border-slate-900 p-2.5 text-center" style="background-color: ${grp ? grp.hex : '#334155'}; color: ${grp ? grp.text : '#ffffff'}">
        <div class="text-[10px] uppercase tracking-wider font-bold opacity-90">Title Deed</div>
        <h3 class="text-base font-extrabold mt-0.5">${tile.name}</h3>
      </div>
      ${rentTableHtml}
      ${manageControlsHtml}
    </div>
  `;

  const bBuild = document.getElementById('btnInspectorBuild');
  if (bBuild) bBuild.addEventListener('click', () => handleBuildHouse(room, tile.id));

  const bSell = document.getElementById('btnInspectorSell');
  if (bSell) bSell.addEventListener('click', () => handleSellHouse(room, tile.id));

  const bMort = document.getElementById('btnInspectorMortgage');
  if (bMort) bMort.addEventListener('click', () => handleToggleMortgage(room, tile.id));
}

function renderActivityLog(room) {
  document.getElementById('logTurnCounter').textContent = `Turn #${room.turnNumber || 1}`;
  const logEl = document.getElementById('gameActivityLog');
  const logs = room.logs || [];

  logEl.innerHTML = logs.map((item, i) => `
    <div class="p-2 rounded ${i === 0 ? 'bg-slate-700 text-white font-semibold' : 'bg-slate-900/70 text-slate-300'}">
      ${item.text}
    </div>
  `).join('');
}

// ============================================================================
// 10. PLAYER-TO-PLAYER TRADING & AUCTION MODALS
// ============================================================================
function openTradeHubModal(room, defaultPartnerUsername = null) {
  const modal = document.getElementById('modalTradeHub');
  const activePlayers = room.players.filter(p => !p.bankrupt);
  if (activePlayers.length < 2) return;

  const selFrom = document.getElementById('selectTradeFromPlayer');
  const selTo = document.getElementById('selectTradeToPlayer');

  const defaultFrom = (myAccount && activePlayers.some(p => p.username === myAccount.username))
    ? myAccount.username
    : room.players[room.turnIndex].username;

  const defaultTo = defaultPartnerUsername && defaultPartnerUsername !== defaultFrom
    ? defaultPartnerUsername
    : (activePlayers.find(p => p.username !== defaultFrom)?.username || activePlayers[0].username);

  selFrom.innerHTML = activePlayers.map(p => `<option value="${p.username}" ${p.username === defaultFrom ? 'selected' : ''}>@${p.username} ($${p.money})</option>`).join('');
  selTo.innerHTML = activePlayers.map(p => `<option value="${p.username}" ${p.username === defaultTo ? 'selected' : ''}>@${p.username} ($${p.money})</option>`).join('');

  const refreshTradeCheckboxes = () => {
    const fromUser = selFrom.value;
    const toUser = selTo.value;
    const fromObj = room.players.find(p => p.username === fromUser);
    const toObj = room.players.find(p => p.username === toUser);

    document.getElementById('tradeFromMaxCash').textContent = `$${fromObj ? fromObj.money : 0}`;
    document.getElementById('tradeToMaxCash').textContent = `$${toObj ? toObj.money : 0}`;
    document.getElementById('tradeFromMaxCards').textContent = String(fromObj?.jailFreeCards || 0);
    document.getElementById('tradeToMaxCards').textContent = String(toObj?.jailFreeCards || 0);

    document.getElementById('inputTradeOfferCash').value = '0';
    document.getElementById('inputTradeRequestCash').value = '0';
    document.getElementById('inputTradeOfferCards').value = '0';
    document.getElementById('inputTradeRequestCards').value = '0';

    const fromProps = BOARD_TILES.filter(t => room.properties[t.id]?.owner === fromUser && (room.properties[t.id]?.houses || 0) === 0);
    const toProps = BOARD_TILES.filter(t => room.properties[t.id]?.owner === toUser && (room.properties[t.id]?.houses || 0) === 0);

    const renderPropList = (tiles, cls) => {
      if (tiles.length === 0) return `<div class="text-xs text-slate-400 py-2">No tradable properties.</div>`;
      return tiles.map(t => {
        const grp = GROUP_COLORS[t.group] || { hex: '#64748b' };
        return `
          <label class="flex items-center justify-between p-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer text-xs">
            <div class="flex items-center gap-2">
              <input type="checkbox" value="${t.id}" class="${cls} accent-emerald-500" />
              <span class="w-3 h-4 rounded-sm border border-black/40" style="background:${grp.hex}"></span>
              <span class="font-semibold text-white">${t.name}</span>
            </div>
            <span class="text-slate-300">$${t.price}</span>
          </label>
        `;
      }).join('');
    };

    document.getElementById('listTradeOfferProps').innerHTML = renderPropList(fromProps, 'chk-offer-prop');
    document.getElementById('listTradeRequestProps').innerHTML = renderPropList(toProps, 'chk-req-prop');
  };

  selFrom.onchange = refreshTradeCheckboxes;
  selTo.onchange = refreshTradeCheckboxes;
  refreshTradeCheckboxes();

  document.getElementById('tradeModalError').classList.add('hidden');
  modal.classList.remove('hidden');
}

async function submitTradeProposal() {
  if (!currentRoomId || !allRoomsMap[currentRoomId]) return;
  const room = allRoomsMap[currentRoomId];
  const fromUser = document.getElementById('selectTradeFromPlayer').value;
  const toUser = document.getElementById('selectTradeToPlayer').value;
  const errBox = document.getElementById('tradeModalError');

  if (fromUser === toUser) {
    errBox.textContent = 'Select two different players to trade.';
    errBox.classList.remove('hidden');
    return;
  }

  const fromPlayer = room.players.find(p => p.username === fromUser);
  const toPlayer = room.players.find(p => p.username === toUser);

  const offerCash = Math.max(0, parseInt(document.getElementById('inputTradeOfferCash').value, 10) || 0);
  const requestCash = Math.max(0, parseInt(document.getElementById('inputTradeRequestCash').value, 10) || 0);
  const offerCards = Math.max(0, parseInt(document.getElementById('inputTradeOfferCards').value, 10) || 0);
  const requestCards = Math.max(0, parseInt(document.getElementById('inputTradeRequestCards').value, 10) || 0);

  if (offerCash > fromPlayer.money || requestCash > toPlayer.money) {
    errBox.textContent = 'Cash amount exceeds player balance.';
    errBox.classList.remove('hidden');
    return;
  }

  const offerProps = Array.from(document.querySelectorAll('.chk-offer-prop:checked')).map(el => parseInt(el.value, 10));
  const requestProps = Array.from(document.querySelectorAll('.chk-req-prop:checked')).map(el => parseInt(el.value, 10));

  if (offerCash === 0 && requestCash === 0 && offerProps.length === 0 && requestProps.length === 0 && offerCards === 0 && requestCards === 0) {
    errBox.textContent = 'Select at least one item to trade.';
    errBox.classList.remove('hidden');
    return;
  }

  room.activeTrade = {
    id: 'tr_' + Date.now(),
    from: fromUser,
    to: toUser,
    offerCash,
    requestCash,
    offerCards,
    requestCards,
    offerProps,
    requestProps
  };

  room.logs.unshift({
    time: Date.now(),
    text: `@${fromUser} proposed a trade with @${toUser}.`
  });

  document.getElementById('modalTradeHub').classList.add('hidden');
  playSfx('trade');
  await saveRoomState(room);
}

async function executeAcceptActiveTrade(room) {
  const tr = room.activeTrade;
  if (!tr) return;

  const fromP = room.players.find(p => p.username === tr.from);
  const toP = room.players.find(p => p.username === tr.to);
  if (!fromP || !toP) return;

  fromP.money = fromP.money - tr.offerCash + tr.requestCash;
  toP.money = toP.money - tr.requestCash + tr.offerCash;

  fromP.jailFreeCards = (fromP.jailFreeCards || 0) - tr.offerCards + tr.requestCards;
  toP.jailFreeCards = (toP.jailFreeCards || 0) - tr.requestCards + tr.offerCards;

  (tr.offerProps || []).forEach(tid => {
    if (room.properties[tid] && room.properties[tid].owner === fromP.username) {
      room.properties[tid].owner = toP.username;
    }
  });
  (tr.requestProps || []).forEach(tid => {
    if (room.properties[tid] && room.properties[tid].owner === toP.username) {
      room.properties[tid].owner = fromP.username;
    }
  });

  room.logs.unshift({
    time: Date.now(),
    text: `Trade completed between @${fromP.username} and @${toP.username}!`
  });
  room.activeTrade = null;
  playSfx('trade');
  showToast('Trade accepted!', 'emerald');
  await saveRoomState(room);
}

async function executeDeclineActiveTrade(room) {
  const tr = room.activeTrade;
  if (!tr) return;
  room.logs.unshift({
    time: Date.now(),
    text: `Trade between @${tr.from} and @${tr.to} was declined.`
  });
  room.activeTrade = null;
  await saveRoomState(room);
}

function syncTradeAndAuctionModals(room) {
  const tradeModal = document.getElementById('modalIncomingTrade');
  if (room.activeTrade) {
    const tr = room.activeTrade;
    tradeModal.classList.remove('hidden');
    document.getElementById('incomingTradeSubtitle').textContent = `@${tr.from} ⇄ @${tr.to}`;

    const formatProps = (ids) => {
      if (!ids || ids.length === 0) return '<div class="text-slate-400 text-xs">No properties</div>';
      return ids.map(id => {
        const t = BOARD_TILES[id];
        const grp = GROUP_COLORS[t.group] || { hex: '#64748b' };
        return `<div class="flex items-center gap-1.5 text-xs text-white font-semibold"><span class="w-2.5 h-2.5 rounded-sm" style="background:${grp.hex}"></span>${t.name}</div>`;
      }).join('');
    };

    document.getElementById('incomingTradeBody').innerHTML = `
      <div class="p-3 rounded-lg bg-slate-900 border border-slate-700 space-y-1.5">
        <div class="text-xs font-bold text-emerald-400">@${tr.from} Offers:</div>
        <div class="text-sm font-bold text-white">$${tr.offerCash} Cash</div>
        <div class="space-y-1 pt-1 border-t border-slate-800">${formatProps(tr.offerProps)}</div>
      </div>
      <div class="p-3 rounded-lg bg-slate-900 border border-slate-700 space-y-1.5">
        <div class="text-xs font-bold text-sky-400">@${tr.to} Gives:</div>
        <div class="text-sm font-bold text-white">$${tr.requestCash} Cash</div>
        <div class="space-y-1 pt-1 border-t border-slate-800">${formatProps(tr.requestProps)}</div>
      </div>
    `;

    document.getElementById('incomingTradeActions').innerHTML = `
      <button id="btnDeclineTradeOffer" class="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 font-bold text-xs">
        Decline
      </button>
      <button id="btnAcceptTradeOffer" class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow">
        Accept Trade
      </button>
    `;

    document.getElementById('btnAcceptTradeOffer').onclick = () => executeAcceptActiveTrade(room);
    document.getElementById('btnDeclineTradeOffer').onclick = () => executeDeclineActiveTrade(room);
  } else {
    tradeModal.classList.add('hidden');
  }

  const auctionModal = document.getElementById('modalAuction');
  if (room.activeAuction) {
    const auc = room.activeAuction;
    const tile = BOARD_TILES[auc.tileId];
    auctionModal.classList.remove('hidden');

    document.getElementById('auctionTileName').textContent = `${tile.name} (Price: $${tile.price})`;
    document.getElementById('auctionHighBid').textContent = `$${auc.highBid}`;
    document.getElementById('auctionHighBidder').textContent = `Leader: @${auc.highBidder}`;

    const biddersHtml = room.players.filter(p => !p.bankrupt).map(p => {
      const next10 = auc.highBid + 10;
      const next50 = auc.highBid + 50;
      return `
        <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="text-xs font-bold text-white truncate">${p.emoji} @${p.username}</div>
            <div class="text-[11px] text-emerald-400">$${p.money}</div>
          </div>
          <div class="flex items-center gap-1">
            <button data-user="${p.username}" data-bid="${next10}" ${p.money < next10 ? 'disabled' : ''}
              class="btn-auction-bid px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-bold text-xs">
              +$10
            </button>
            <button data-user="${p.username}" data-bid="${next50}" ${p.money < next50 ? 'disabled' : ''}
              class="btn-auction-bid px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-30 text-white font-bold text-xs">
              +$50
            </button>
          </div>
        </div>
      `;
    }).join('');

    const listEl = document.getElementById('auctionBiddersList');
    listEl.innerHTML = biddersHtml;
    listEl.querySelectorAll('.btn-auction-bid').forEach(btn => {
      btn.addEventListener('click', async () => {
        room.activeAuction.highBidder = btn.dataset.user;
        room.activeAuction.highBid = parseInt(btn.dataset.bid, 10);
        playSfx('cash');
        await saveRoomState(room);
      });
    });

    document.getElementById('btnFinalizeAuction').onclick = async () => {
      const winner = room.players.find(p => p.username === auc.highBidder);
      if (winner && winner.money >= auc.highBid) {
        winner.money -= auc.highBid;
        room.properties[auc.tileId] = {
          owner: winner.username,
          houses: 0,
          mortgaged: false
        };
        room.logs.unshift({
          time: Date.now(),
          text: `@${winner.username} won ${tile.name} at auction for $${auc.highBid}!`
        });
      }
      room.activeAuction = null;
      room.turnPhase = 'POST_ROLL';
      playSfx('buy');
      await saveRoomState(room);
    };
  } else {
    auctionModal.classList.add('hidden');
  }
}

// ============================================================================
// 11. EVENT LISTENERS ON LOAD
// ============================================================================
window.addEventListener('DOMContentLoaded', async () => {
  renderAuthTokenPicker();

  document.getElementById('btnDbStatus').addEventListener('click', () => {
    showToast(dbDiagnosticMessage, isCloudConnected ? 'emerald' : 'rose');
  });

  document.getElementById('tabAuthRegister').addEventListener('click', () => setAuthTab('register'));
  document.getElementById('tabAuthLogin').addEventListener('click', () => setAuthTab('login'));
  document.getElementById('formAuth').addEventListener('submit', handleAuthSubmit);

  document.getElementById('btnToggleSound').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('iconSound');
    icon.className = soundEnabled ? 'fa-solid fa-volume-high text-emerald-400' : 'fa-solid fa-volume-xmark text-slate-500';
  });

  document.getElementById('btnSwitchAccount').addEventListener('click', () => {
    showViewSection('auth');
  });

  document.getElementById('btnLeaveRoom').addEventListener('click', () => {
    currentRoomId = null;
    document.getElementById('navRoomBadge').classList.add('hidden');
    showViewSection('lobby');
    renderLobbyViews();
  });

  document.getElementById('formCreateRoom').addEventListener('submit', handleCreateRoom);
  document.getElementById('formSendInvite').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('inputInviteUsername');
    sendUsernameInvite(input.value);
    input.value = '';
  });
  document.getElementById('btnAddHotseatPlayer').addEventListener('click', addHotseatSimulatedPlayer);
  document.getElementById('btnStartBoardGame').addEventListener('click', startRoomBoardGame);

  document.getElementById('btnOpenTradeHubSidebar').addEventListener('click', () => {
    if (currentRoomId && allRoomsMap[currentRoomId]) openTradeHubModal(allRoomsMap[currentRoomId]);
  });
  document.getElementById('btnCloseTradeModal').addEventListener('click', () => {
    document.getElementById('modalTradeHub').classList.add('hidden');
  });
  document.getElementById('btnCancelTradeModal').addEventListener('click', () => {
    document.getElementById('modalTradeHub').classList.add('hidden');
  });
  document.getElementById('btnSubmitTradeProposal').addEventListener('click', submitTradeProposal);

  await initDatabaseAndAuth();
});