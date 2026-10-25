import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ============================================================================
// 1. EXACT 40-TILE COPYPOLY BOARD DEFINITION
// ============================================================================
const GROUP_COLORS = {
  brown:     { hex: '#92400e', label: 'Brown Sector',     text: '#fbbf24', size: 2 },
  lightblue: { hex: '#38bdf8', label: 'Sky Sector',       text: '#38bdf8', size: 3 },
  pink:      { hex: '#ec4899', label: 'Neon Pink Sector', text: '#f472b6', size: 3 },
  orange:    { hex: '#f97316', label: 'Amber Sector',     text: '#fb923c', size: 3 },
  red:       { hex: '#ef4444', label: 'Crimson Sector',   text: '#f87171', size: 3 },
  yellow:    { hex: '#eab308', label: 'Solar Sector',     text: '#facc15', size: 3 },
  green:     { hex: '#10b981', label: 'Emerald Sector',   text: '#34d399', size: 3 },
  darkblue:  { hex: '#6366f1', label: 'Citadel Sector',   text: '#818cf8', size: 2 },
  transit:   { hex: '#64748b', label: 'Transit Network',  text: '#cbd5e1', size: 4 },
  utility:   { hex: '#06b6d4', label: 'Grid Utility',     text: '#67e8f9', size: 2 }
};

const BOARD_TILES = [
  { id: 0,  name: 'START LINE',            type: 'go',      price: 0,   icon: '🏁', sub: 'Collect $200' },
  { id: 1,  name: 'Rusty Alley',           type: 'prop',    group: 'brown',     price: 60,  houseCost: 50,  rent: [2, 10, 30, 90, 160, 250] },
  { id: 2,  name: 'Karma Vault',           type: 'chest',   price: 0,   icon: '📦' },
  { id: 3,  name: 'Cobble Lane',           type: 'prop',    group: 'brown',     price: 60,  houseCost: 50,  rent: [4, 20, 60, 180, 320, 450] },
  { id: 4,  name: 'Income Audit Tax',      type: 'tax',     price: 200, icon: '💸', sub: 'Pay $200' },
  { id: 5,  name: 'North Metro Line',      type: 'transit', group: 'transit',   price: 200, icon: '🚝', rent: [25, 50, 100, 200] },
  { id: 6,  name: 'Breeze Avenue',         type: 'prop',    group: 'lightblue', price: 100, houseCost: 50,  rent: [6, 30, 90, 270, 400, 550] },
  { id: 7,  name: 'Plot Twist',            type: 'chance',  price: 0,   icon: '⚡' },
  { id: 8,  name: 'Cloud Nine Rd',         type: 'prop',    group: 'lightblue', price: 100, houseCost: 50,  rent: [6, 30, 90, 270, 400, 550] },
  { id: 9,  name: 'Skyline Terrace',       type: 'prop',    group: 'lightblue', price: 120, houseCost: 50,  rent: [8, 40, 100, 300, 450, 600] },
  { id: 10, name: 'THE SLAMMER',           type: 'jail',    price: 0,   icon: '⛓️', sub: 'Visiting / Incarcerated' },
  { id: 11, name: 'Neon Plaza',            type: 'prop',    group: 'pink',      price: 140, houseCost: 100, rent: [10, 50, 150, 450, 625, 750] },
  { id: 12, name: 'GigaWatt Electric Co.', type: 'utility', group: 'utility',   price: 150, icon: '⚡' },
  { id: 13, name: 'Velvet Arcade',         type: 'prop',    group: 'pink',      price: 140, houseCost: 100, rent: [10, 50, 150, 450, 625, 750] },
  { id: 14, name: 'Flamingo Blvd',         type: 'prop',    group: 'pink',      price: 160, houseCost: 100, rent: [12, 60, 180, 500, 700, 900] },
  { id: 15, name: 'East Hyperloop',        type: 'transit', group: 'transit',   price: 200, icon: '🚝', rent: [25, 50, 100, 200] },
  { id: 16, name: 'Amber Way',             type: 'prop',    group: 'orange',    price: 180, houseCost: 100, rent: [14, 70, 200, 550, 750, 950] },
  { id: 17, name: 'Karma Vault',           type: 'chest',   price: 0,   icon: '📦' },
  { id: 18, name: 'Tangerine Drive',       type: 'prop',    group: 'orange',    price: 180, houseCost: 100, rent: [14, 70, 200, 550, 750, 950] },
  { id: 19, name: 'Sunburst Square',       type: 'prop',    group: 'orange',    price: 200, houseCost: 100, rent: [16, 80, 220, 600, 800, 1000] },
  { id: 20, name: 'FREE LOUNGE',           type: 'parking', price: 0,   icon: '🌴', sub: 'Chill Zone' },
  { id: 21, name: 'Crimson Strand',        type: 'prop',    group: 'red',       price: 220, houseCost: 150, rent: [18, 90, 250, 700, 875, 1050] },
  { id: 22, name: 'Plot Twist',            type: 'chance',  price: 0,   icon: '⚡' },
  { id: 23, name: 'Scarlet Cross',         type: 'prop',    group: 'red',       price: 220, houseCost: 150, rent: [18, 90, 250, 700, 875, 1050] },
  { id: 24, name: 'Ruby Heights',          type: 'prop',    group: 'red',       price: 240, houseCost: 150, rent: [20, 100, 300, 750, 925, 1100] },
  { id: 25, name: 'South Monorail',        type: 'transit', group: 'transit',   price: 200, icon: '🚝', rent: [25, 50, 100, 200] },
  { id: 26, name: 'Lemon Drop St',         type: 'prop',    group: 'yellow',    price: 260, houseCost: 150, rent: [22, 110, 330, 800, 975, 1150] },
  { id: 27, name: 'Gold Rush Ave',         type: 'prop',    group: 'yellow',    price: 260, houseCost: 150, rent: [22, 110, 330, 800, 975, 1150] },
  { id: 28, name: 'HydroFlow Water Works', type: 'utility', group: 'utility',   price: 150, icon: '💧' },
  { id: 29, name: 'Sovereign Gardens',     type: 'prop',    group: 'yellow',    price: 280, houseCost: 150, rent: [24, 120, 360, 850, 1025, 1200] },
  { id: 30, name: 'BUSTED!',               type: 'gotojail',price: 0,   icon: '🚨', sub: 'Go To Slammer' },
  { id: 31, name: 'Emerald Park',          type: 'prop',    group: 'green',     price: 300, houseCost: 200, rent: [26, 130, 390, 900, 1100, 1275] },
  { id: 32, name: 'Jade Vista',            type: 'prop',    group: 'green',     price: 300, houseCost: 200, rent: [26, 130, 390, 900, 1100, 1275] },
  { id: 33, name: 'Karma Vault',           type: 'chest',   price: 0,   icon: '📦' },
  { id: 34, name: 'Forest Canopy Blvd',    type: 'prop',    group: 'green',     price: 320, houseCost: 200, rent: [28, 150, 450, 1000, 1200, 1400] },
  { id: 35, name: 'West Maglev Station',   type: 'transit', group: 'transit',   price: 200, icon: '🚝', rent: [25, 50, 100, 200] },
  { id: 36, name: 'Plot Twist',            type: 'chance',  price: 0,   icon: '⚡' },
  { id: 37, name: 'Sapphire Promenade',    type: 'prop',    group: 'darkblue',  price: 350, houseCost: 200, rent: [35, 175, 500, 1100, 1300, 1500] },
  { id: 38, name: 'Luxury Tariff',         type: 'tax',     price: 100, icon: '💎', sub: 'Pay $100' },
  { id: 39, name: 'Apex Citadel',          type: 'prop',    group: 'darkblue',  price: 400, houseCost: 200, rent: [50, 200, 600, 1400, 1700, 2000] }
];

// 8 Distinct Tokens & High-Contrast Colors
const PLAYER_TOKENS = [
  { id: 'boot',    name: 'Cyber Boot',    emoji: '🥾', color: '#ef4444' },
  { id: 'duck',    name: 'Golden Duck',   emoji: '🦆', color: '#f59e0b' },
  { id: 'mug',     name: 'Espresso Mug',  emoji: '☕', color: '#10b981' },
  { id: 'cart',    name: 'Turbo Cart',    emoji: '🏎️', color: '#3b82f6' },
  { id: 'hat',     name: 'Top Hat',       emoji: '🎩', color: '#a855f7' },
  { id: 'rocket',  name: 'Neon Rocket',   emoji: '🚀', color: '#ec4899' },
  { id: 'floppy',  name: 'Floppy Disk',   emoji: '💾', color: '#06b6d4' },
  { id: 'cruiser', name: 'Retro Cruiser', emoji: '🛸', color: '#84cc16' }
];

// Plot Twist (Chance) & Karma Vault (Community Chest) Decks
const PLOT_TWIST_CARDS = [
  { title: 'Warp to Start Line!', desc: 'Advance to START LINE (Collect $200).', action: 'move', target: 0 },
  { title: 'Citadel Penthouse Tour', desc: 'Advance directly to Apex Citadel.', action: 'move', target: 39 },
  { title: 'Ruby Rooftop Party', desc: 'Advance to Ruby Heights. Collect $200 if you pass Start Line.', action: 'move', target: 24 },
  { title: 'Catch the North Metro', desc: 'Take a ride to North Metro Line. Collect $200 if you pass Start Line.', action: 'move', target: 5 },
  { title: 'Neon Plaza VIP Pass', desc: 'Advance to Neon Plaza. Collect $200 if you pass Start Line.', action: 'move', target: 11 },
  { title: 'Venture Capital Dividend', desc: 'The Syndicate pays you a dividend of $50.', action: 'cash', amount: 50 },
  { title: 'Series A Funding Closed!', desc: 'Your startup loan matures. Collect $150.', action: 'cash', amount: 150 },
  { title: 'Slammer Override Key', desc: 'Get Out of The Slammer Free. Keep this card or trade it!', action: 'jailcard' },
  { title: 'Busted by Cyber Patrol!', desc: 'Go directly to The Slammer. Do not pass Start Line, do not collect $200.', action: 'gotojail' },
  { title: 'Chairman of the Syndicate', desc: 'You have been elected Chairman! Pay each active player $50.', action: 'payeach', amount: 50 },
  { title: 'Smart Grid Upgrade Levy', desc: 'Make general repairs on all your properties: Pay $25 per House and $100 per Mega-Hotel.', action: 'repairs', house: 25, hotel: 100 },
  { title: 'Speeding in the Hyperlane', desc: 'Pay a traffic fine of $15.', action: 'cash', amount: -15 },
  { title: 'Glitch in the Matrix', desc: 'Go back 3 spaces!', action: 'moveback', steps: 3 }
];

const KARMA_VAULT_CARDS = [
  { title: 'Full Sprint to Start Line', desc: 'Advance to START LINE (Collect $200).', action: 'move', target: 0 },
  { title: 'Server Bank Error in Your Favor', desc: 'Collect $200 from the bank!', action: 'cash', amount: 200 },
  { title: 'Cybernetic Clinic Bill', desc: 'Pay medical upgrade fee of $50.', action: 'cash', amount: -50 },
  { title: 'Liquidated NFT Collection', desc: 'From sale of digital stock, you get $50.', action: 'cash', amount: 50 },
  { title: 'Slammer Bailout Pass', desc: 'Get Out of The Slammer Free. Keep or trade with other players!', action: 'jailcard' },
  { title: 'Caught Mining on Mainframe!', desc: 'Go directly to The Slammer. Do not pass Start Line.', action: 'gotojail' },
  { title: 'It Is Your Launch Day!', desc: 'Collect $20 from every active player in the room!', action: 'collecteach', amount: 20 },
  { title: 'Tax Overpayment Refund', desc: 'Income tax audit rebounds in your favor. Collect $20.', action: 'cash', amount: 20 },
  { title: 'Bug Bounty Reward', desc: 'You won 2nd prize in a hackathon! Collect $10.', action: 'cash', amount: 10 },
  { title: 'Angel Investor Inheritance', desc: 'You inherit $100 in cold hard cash.', action: 'cash', amount: 100 },
  { title: 'Hospitality Consulting Fee', desc: 'Receive $25 consultancy fee.', action: 'cash', amount: 25 },
  { title: 'Infrastructure Assessment', desc: 'You are assessed for street upgrades: $40 per House, $115 per Mega-Hotel.', action: 'repairs', house: 40, hotel: 115 }
];

// ============================================================================
// 2. SOUND SYNTHESIZER (Web Audio API - No External Assets Needed)
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
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'cash') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.07);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'buy') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.08);
      osc.frequency.setValueAtTime(659.25, now + 0.16);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (type === 'jail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.35);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.36);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'trade') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.09);
      osc.frequency.setValueAtTime(783.99, now + 0.18);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    // Ignore audio context restrictions
  }
}

function showToast(msg, variant = 'emerald') {
  const container = document.getElementById('toastContainer');
  const colors = {
    emerald: 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200',
    cyan:    'bg-cyan-950/95 border-cyan-500/50 text-cyan-200',
    amber:   'bg-amber-950/95 border-amber-500/50 text-amber-200',
    rose:    'bg-rose-950/95 border-rose-500/50 text-rose-200'
  };
  const el = document.createElement('div');
  el.className = `px-4 py-2.5 rounded-xl border shadow-xl text-xs font-semibold backdrop-blur-md transition-all duration-300 ${colors[variant] || colors.emerald}`;
  el.innerHTML = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 3600);
}

// ============================================================================
// 3. STATE & CLOUD DATABASE INITIALIZATION (FOLLOWING STRICT FIRESTORE RULES)
// ============================================================================
const appId = typeof __app_id !== 'undefined' ? __app_id : 'copypoly-vibe-app';
let db = null;
let auth = null;
let currentUser = null;
let isCloudConnected = false;

// Application In-Memory Mirrors
let myAccount = null; // { uid, username, displayName, token, pin }
let registeredUsersMap = {}; // username_lower -> userObj
let allRoomsMap = {}; // roomId -> roomObj
let allInvitesMap = {}; // inviteId -> inviteObj
let currentRoomId = null;
let selectedInspectTileId = 39; // Default inspect Apex Citadel
let selectedPortfolioPlayerId = null;
let authMode = 'register'; // 'register' | 'login'
let selectedAuthToken = PLAYER_TOKENS[0].id;
let isRollingAnim = false;

// Collection Helpers (RULE 1: Strict Paths)
function colUsers()    { return collection(db, 'artifacts', appId, 'public', 'data', 'copypoly_users'); }
function colProfiles() { return collection(db, 'artifacts', appId, 'public', 'data', 'copypoly_profiles'); }
function colRooms()    { return collection(db, 'artifacts', appId, 'public', 'data', 'copypoly_rooms'); }
function colInvites()  { return collection(db, 'artifacts', appId, 'public', 'data', 'copypoly_invites'); }

async function initDatabaseAndAuth() {
  try {
    // 1. Paste your exact config keys from the Firebase console here:
    const firebaseConfig = {
        apiKey: "AIzaSyCldKp2jJARkLGojexuUZGoARMt4-QrL20",
        authDomain: "copypoly-47ef9.firebaseapp.com",
        projectId: "copypoly-47ef9",
        storageBucket: "copypoly-47ef9.firebasestorage.app",
        messagingSenderId: "36147138911",
        appId: "1:36147138911:web:0c703611175d45559ea6ea",
        measurementId: "G-ZE6WF1L3DC"
    };

    // 2. Initialize Firebase with your live config
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // 3. Authenticate the user silently in the background
    await signInAnonymously(auth);
    
    currentUser = auth.currentUser;
    isCloudConnected = true;

    onAuthStateChanged(auth, (u) => {
      if (u) currentUser = u;
    });

    setupRealtimeListeners();
    await restoreExistingSession();
    
  } catch (err) {
    console.error("Database init fallback:", err);
    currentUser = { uid: 'local-' + Math.random().toString(36).slice(2, 9) };
    isCloudConnected = false;
  }
}

function setupRealtimeListeners() {
  if (!isCloudConnected || !currentUser) return;

  // 1. Listen to all registered @usernames
  onSnapshot(colUsers(), (snap) => {
    const nextMap = {};
    snap.forEach((d) => { nextMap[d.id] = d.data(); });
    registeredUsersMap = nextMap;
    renderRegisteredUsersDirectory();
  }, (err) => console.error("Users listener error:", err));

  // 2. Listen to all COPYPOLY rooms
  onSnapshot(colRooms(), (snap) => {
    const nextRooms = {};
    snap.forEach((d) => {
      const data = d.data();
      if (data && data.id) {
        nextRooms[d.id] = normalizeRoomData(data);
      }
    });
    allRoomsMap = nextRooms;
    renderLobbyViews();
    if (currentRoomId && allRoomsMap[currentRoomId]) {
      syncActiveRoomUI(allRoomsMap[currentRoomId]);
    }
  }, (err) => console.error("Rooms listener error:", err));

  // 3. Listen to live @username invitations
  onSnapshot(colInvites(), (snap) => {
    const nextInvites = {};
    snap.forEach((d) => { nextInvites[d.id] = d.data(); });
    allInvitesMap = nextInvites;
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

  if (isCloudConnected && currentUser) {
    const payload = {
      id: normalized.id,
      title: normalized.title,
      code: normalized.code,
      hostUsername: normalized.hostUsername,
      status: normalized.status, // 'waiting' | 'playing' | 'finished'
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
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'copypoly_rooms', normalized.id), payload);
  } else {
    renderLobbyViews();
    if (currentRoomId === normalized.id) {
      syncActiveRoomUI(normalized);
    }
  }
}

async function restoreExistingSession() {
  if (!isCloudConnected || !currentUser) return;
  try {
    const profSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'copypoly_profiles', currentUser.uid));
    if (profSnap.exists()) {
      const prof = profSnap.data();
      if (prof && prof.username) {
        myAccount = prof;
        enterAuthenticatedState();
      }
    }
  } catch (e) {
    console.error("Restore profile error:", e);
  }
}

// ============================================================================
// 4. AUTHENTICATION & @USERNAME REGISTRATION LOGIC
// ============================================================================
function renderAuthTokenPicker() {
  const grid = document.getElementById('authTokenGrid');
  grid.innerHTML = PLAYER_TOKENS.map((t) => {
    const active = t.id === selectedAuthToken;
    return `
      <button type="button" data-token="${t.id}"
        class="auth-token-btn p-2 rounded-xl border flex flex-col items-center gap-1 transition ${
          active
            ? 'bg-slate-800 border-emerald-400 shadow-md shadow-emerald-500/20'
            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
        }">
        <span class="w-7 h-7 rounded-full flex items-center justify-center text-base" style="background:${t.color}25; border: 1.5px solid ${t.color}">
          ${t.emoji}
        </span>
        <span class="text-[10px] font-semibold text-slate-300 truncate w-full text-center">${t.name}</span>
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
    tabReg.className = 'py-2 text-xs font-bold rounded-lg bg-emerald-500 text-slate-950 transition';
    tabLog.className = 'py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition';
    fieldDisp.classList.remove('hidden');
    fieldTok.classList.remove('hidden');
  } else {
    tabLog.className = 'py-2 text-xs font-bold rounded-lg bg-emerald-500 text-slate-950 transition';
    tabReg.className = 'py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition';
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
    errBox.textContent = 'Username must be at least 3 alphanumeric characters.';
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
      errBox.textContent = `@${rawUsername} is already claimed! Switch to "Existing @username" tab if this is your account.`;
      errBox.classList.remove('hidden');
      return;
    }
    const userRecord = {
      uid: currentUser?.uid || ('u-' + Date.now()),
      username: rawUsername,
      displayName: displayName,
      token: selectedAuthToken,
      pin: pin,
      createdAt: Date.now()
    };
    registeredUsersMap[rawUsername] = userRecord;
    myAccount = userRecord;

    if (isCloudConnected && currentUser) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'copypoly_users', rawUsername), userRecord);
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'copypoly_profiles', currentUser.uid), userRecord);
    }
    playSfx('buy');
    showToast(`Account @${rawUsername} ready!`, 'emerald');
    enterAuthenticatedState();
  } else {
    if (!existing) {
      errBox.textContent = `No account found with @${rawUsername}. Create it first!`;
      errBox.classList.remove('hidden');
      return;
    }
    if (existing.pin !== pin) {
      errBox.textContent = `Incorrect passcode for @${rawUsername}.`;
      errBox.classList.remove('hidden');
      return;
    }
    myAccount = existing;
    if (isCloudConnected && currentUser) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'copypoly_profiles', currentUser.uid), existing);
    }
    playSfx('buy');
    showToast(`Welcome back, @${rawUsername}!`, 'cyan');
    enterAuthenticatedState();
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

  document.getElementById('viewAuth').classList.add('hidden');
  if (currentRoomId && allRoomsMap[currentRoomId]) {
    syncActiveRoomUI(allRoomsMap[currentRoomId]);
  } else {
    document.getElementById('viewGame').classList.add('hidden');
    document.getElementById('viewLobby').classList.remove('hidden');
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

  const title = document.getElementById('inputRoomTitle').value.trim() || `${myAccount.displayName}'s Syndicate`;
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
      { time: Date.now(), text: `Room "${title}" created by @${myAccount.username}. Waiting for up to 8 players!` }
    ],
    activeTrade: null,
    activeAuction: null,
    pendingDebt: null
  };

  currentRoomId = roomId;
  await saveRoomState(newRoom);
  playSfx('buy');
  showToast(`Room "${title}" created! Invite friends via @username.`, 'emerald');
  syncActiveRoomUI(newRoom);
}

async function sendUsernameInvite(targetUsernameRaw) {
  if (!currentRoomId || !allRoomsMap[currentRoomId] || !myAccount) return;
  const room = allRoomsMap[currentRoomId];
  const cleanUser = targetUsernameRaw.trim().toLowerCase().replace(/^@/, '');
  const feedback = document.getElementById('inviteStatusFeedback');

  if (!cleanUser) return;
  if (room.players.length >= 8) {
    showToast('Room is already at the 8-player maximum!', 'rose');
    return;
  }
  if (room.players.some(p => p.username === cleanUser)) {
    showToast(`@${cleanUser} is already seated in this room!`, 'amber');
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
  if (isCloudConnected && currentUser) {
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'copypoly_invites', inviteId), inviteObj);
  }

  feedback.textContent = `Live invitation sent to @${cleanUser}! They can accept from their Lobby Inbox.`;
  feedback.className = 'text-xs mt-2 text-emerald-400 font-semibold';
  feedback.classList.remove('hidden');
  playSfx('cash');
  showToast(`Invitation sent to @${cleanUser}!`, 'emerald');
}

async function addHotseatSimulatedPlayer() {
  if (!currentRoomId || !allRoomsMap[currentRoomId]) return;
  const room = allRoomsMap[currentRoomId];
  if (room.players.length >= 8) {
    showToast('Maximum of 8 players reached!', 'rose');
    return;
  }

  const botNames = [
    { username: 'neon_whale',   displayName: 'Neon Whale' },
    { username: 'pixel_baron',  displayName: 'Pixel Baron' },
    { username: 'lady_ledger',  displayName: 'Lady Ledger' },
    { username: 'crypto_duke',  displayName: 'Crypto Duke' },
    { username: 'synth_queen',  displayName: 'Synth Queen' },
    { username: 'byte_mogul',   displayName: 'Byte Mogul' },
    { username: 'alpha_shark',  displayName: 'Alpha Shark' }
  ];

  const usedIds = new Set(room.players.map(p => p.username));
  const pick = botNames.find(b => !usedIds.has(b.username)) || {
    username: 'tycoon_' + (room.players.length + 1),
    displayName: 'Tycoon #' + (room.players.length + 1)
  };

  const seatIdx = room.players.length;
  const newSeat = createPlayerSeatObject(pick, seatIdx, room.startingCash || 1500, true);
  room.players.push(newSeat);
  room.logs.unshift({
    time: Date.now(),
    text: `Seat #${seatIdx + 1} filled by @${newSeat.username} (${newSeat.displayName}).`
  });

  await saveRoomState(room);
  playSfx('buy');
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
      text: `@${myAccount.username} joined the room (${room.players.length}/8 players).`
    });
    await saveRoomState(room);
  }

  // Clean up invite if exists
  const invId = `inv_${roomId}_${myAccount.username}`;
  if (allInvitesMap[invId]) {
    delete allInvitesMap[invId];
    if (isCloudConnected && currentUser) {
      try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'copypoly_invites', invId)); } catch (e) {}
    }
  }

  currentRoomId = roomId;
  playSfx('buy');
  syncActiveRoomUI(room);
}

async function startRoomBoardGame() {
  if (!currentRoomId || !allRoomsMap[currentRoomId]) return;
  const room = allRoomsMap[currentRoomId];
  if (room.players.length < 2) {
    showToast('Add at least 2 players (invite via @username or click "+ Add Local Seat") to start!', 'amber');
    return;
  }

  room.status = 'playing';
  room.turnIndex = 0;
  room.turnNumber = 1;
  room.turnPhase = 'PRE_ROLL';
  room.logs.unshift({
    time: Date.now(),
    text: `🚀 COPYPOLY Board Launched with ${room.players.length} players! @${room.players[0].username} is up first.`
  });

  await saveRoomState(room);
  playSfx('trade');
}

function renderRegisteredUsersDirectory() {
  const container = document.getElementById('listRegisteredUsers');
  const users = Object.values(registeredUsersMap);
  document.getElementById('badgeUserCount').textContent = `${users.length} registered`;

  if (users.length === 0) {
    container.innerHTML = `<span class="text-xs text-slate-500">No other @usernames registered yet.</span>`;
    return;
  }

  container.innerHTML = users.map(u => {
    const isMe = myAccount && u.username === myAccount.username;
    return `
      <button type="button" data-username="${u.username}"
        class="dir-user-chip text-xs font-mono-num px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
          isMe
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-cyan-300'
        }">
        <span>@${u.username}</span>
        ${isMe ? '<span class="text-[9px] uppercase text-emerald-400">(You)</span>' : '<i class="fa-solid fa-plus text-[9px] text-slate-400"></i>'}
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
        showToast(`Create a room first to invite @${target}!`, 'cyan');
      }
    });
  });
}

function renderIncomingInvites() {
  const container = document.getElementById('listIncomingInvites');
  if (!myAccount) return;

  const myInvites = Object.values(allInvitesMap).filter(
    inv => inv.toUsername === myAccount.username && allRoomsMap[inv.roomId]
  );
  document.getElementById('badgeInviteCount').textContent = String(myInvites.length);

  if (myInvites.length === 0) {
    container.innerHTML = `
      <div class="text-xs text-slate-500 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
        No pending invites for <span class="text-emerald-400 font-mono-num">@${myAccount.username}</span>.
      </div>
    `;
    return;
  }

  container.innerHTML = myInvites.map(inv => `
    <div class="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center justify-between gap-2">
      <div>
        <div class="text-xs font-bold text-white">${inv.roomTitle}</div>
        <div class="text-[11px] text-slate-400">Invited by <span class="text-emerald-400 font-mono-num">@${inv.fromUsername}</span></div>
      </div>
      <button data-room="${inv.roomId}" class="btn-accept-invite px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition">
        Accept & Join
      </button>
    </div>
  `).join('');

  container.querySelectorAll('.btn-accept-invite').forEach(btn => {
    btn.addEventListener('click', () => joinRoomById(btn.dataset.room));
  });
}

function renderLobbyViews() {
  const listEl = document.getElementById('listPublicRooms');
  const rooms = Object.values(allRoomsMap).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  if (rooms.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-8 bg-slate-950/50 border border-slate-800/80 rounded-xl">
        <div class="text-2xl mb-1">🎲</div>
        <div class="text-sm font-bold text-slate-300">No rooms created yet</div>
        <div class="text-xs text-slate-500 mt-0.5">Use the form on the left to host the first 8-player COPYPOLY room!</div>
      </div>
    `;
  } else {
    listEl.innerHTML = rooms.map(r => {
      const isMember = myAccount && r.players.some(p => p.username === myAccount.username);
      const statusBadge = r.status === 'waiting'
        ? `<span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Open Lobby</span>`
        : `<span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">In Progress (Turn #${r.turnNumber || 1})</span>`;

      return `
        <div class="p-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 transition flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-display font-bold text-sm text-white">${r.title}</span>
              ${statusBadge}
              <span class="font-mono-num text-[11px] text-slate-400">#${r.code}</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Host: <strong class="text-emerald-400 font-mono-num">@${r.hostUsername}</strong></span>
              <span>•</span>
              <span>Players: <strong class="text-white">${r.players.length} / 8</strong></span>
            </div>
            <div class="flex items-center gap-1 mt-2">
              ${r.players.map(p => `
                <span class="inline-flex items-center gap-1 text-[10px] font-mono-num px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                  <span>${p.emoji}</span> @${p.username}
                </span>
              `).join('')}
            </div>
          </div>
          <div>
            <button data-room="${r.id}" class="btn-join-room px-4 py-2 rounded-xl font-display font-bold text-xs transition ${
              isMember
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }">
              ${isMember ? 'Resume Room' : (r.status === 'waiting' ? 'Join Room' : 'Spectate / Join')}
            </button>
          </div>
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
    document.getElementById('stagingRoomCode').textContent = `CODE: ${room.code}`;
    document.getElementById('stagingSeatCounter').textContent = `${room.players.length} / 8 Players`;

    const slotsHtml = [];
    for (let i = 0; i < 8; i++) {
      const p = room.players[i];
      if (p) {
        slotsHtml.push(`
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-base" style="background:${p.color}25; border:2px solid ${p.color}">
                ${p.emoji}
              </div>
              <div>
                <div class="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>${p.displayName}</span>
                  ${p.isSimulated ? '<span class="text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded">Local Seat</span>' : ''}
                </div>
                <div class="text-[11px] font-mono-num text-emerald-400">@${p.username}</div>
              </div>
            </div>
            <span class="text-[11px] font-mono-num text-slate-400">$${p.money}</span>
          </div>
        `);
      } else {
        slotsHtml.push(`
          <div class="p-3 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 flex items-center justify-between text-slate-500">
            <span class="text-xs">Seat #${i + 1} — Open</span>
            <span class="text-[10px] font-mono-num">Invite @username</span>
          </div>
        `);
      }
    }
    document.getElementById('gridStagingPlayers').innerHTML = slotsHtml.join('');
  } else {
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
    document.getElementById('viewGame').classList.add('hidden');
    document.getElementById('viewLobby').classList.remove('hidden');
    renderLobbyViews();
  } else {
    document.getElementById('viewLobby').classList.add('hidden');
    document.getElementById('viewGame').classList.remove('hidden');
    renderFullBoardGame(room);
  }
}

// ============================================================================
// 6. EXACT 11x11 PERIMETER MONOPOLY BOARD RENDERER & DEED INSPECTOR
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
        pipsHtml = Array(houses).fill('<span class="w-2 h-2 rounded-full bg-emerald-300 border border-slate-950 shadow"></span>').join('');
      } else if (houses === 5) {
        pipsHtml = '<span class="text-[9px] leading-none">🏨</span>';
      }
      headerBarHtml = `
        <div class="color-bar" style="background-color: ${grp.hex}">
          ${pipsHtml}
        </div>
      `;
    }

    const ownerStripHtml = owner
      ? `<div class="w-full h-1.5 rounded-sm" style="background-color: ${owner.color}" title="Owned by @${owner.username}"></div>`
      : '';

    const isSelected = selectedInspectTileId === tile.id;

    return `
      <div data-tile-id="${tile.id}"
        style="grid-row: ${pos.row}; grid-column: ${pos.col};"
        class="board-tile ${isMortgaged ? 'mortgaged' : ''} ${isSelected ? 'ring-2 ring-cyan-400 z-10' : ''}">
        ${headerBarHtml}
        <div class="flex-1 flex flex-col items-center justify-center px-0.5">
          ${tile.icon ? `<div class="text-xs leading-none mb-0.5">${tile.icon}</div>` : ''}
          <div class="tile-name">${tile.name}</div>
          ${tile.price > 0 ? `<div class="tile-price">${isMortgaged ? 'MORT' : '$' + tile.price}</div>` : ''}
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
        <h2 class="text-3xl font-display font-black text-emerald-400">SYNDICATE WINNER!</h2>
        <p class="text-lg font-bold text-white mt-2">${room.winnerName} conquered COPYPOLY!</p>
      </div>
    `;
  }

  let phaseActionsHtml = '';
  if (room.turnPhase === 'PRE_ROLL') {
    if (activePlayer.inJail) {
      phaseActionsHtml = `
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button id="btnRollDice" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:opacity-95 text-slate-950 font-display font-extrabold text-xs shadow-lg">
            🎲 Roll for Doubles (Attempt ${activePlayer.jailTurns + 1}/3)
          </button>
          <button id="btnPayBail" ${activePlayer.money < 50 ? 'disabled' : ''} class="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs">
            💸 Pay $50 Bail
          </button>
          ${activePlayer.jailFreeCards > 0 ? `
            <button id="btnUseJailCard" class="px-3.5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs">
              🃏 Use Slammer Pass
            </button>
          ` : ''}
        </div>
      `;
    } else {
      phaseActionsHtml = `
        <button id="btnRollDice" class="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 hover:scale-105 text-slate-950 font-display font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition flex items-center gap-2">
          <i class="fa-solid fa-dice text-base"></i> Roll Dice
        </button>
      `;
    }
  } else if (room.turnPhase === 'BUY_DECISION') {
    const canAfford = activePlayer.money >= currentTile.price;
    phaseActionsHtml = `
      <div class="flex flex-col items-center gap-2">
        <div class="text-xs font-bold text-cyan-300">Unowned Deed: <span class="text-white">${currentTile.name} ($${currentTile.price})</span></div>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button id="btnBuyProperty" ${!canAfford ? 'disabled' : ''} class="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 font-display font-extrabold text-xs shadow-lg">
            💰 Buy for $${currentTile.price}
          </button>
          <button id="btnStartAuction" class="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs">
            🔨 Auction to Room
          </button>
        </div>
      </div>
    `;
  } else if (room.turnPhase === 'DEBT_RESOLUTION' && room.pendingDebt) {
    const debt = room.pendingDebt;
    const canPayNow = activePlayer.money >= debt.amount;
    phaseActionsHtml = `
      <div class="bg-rose-950/80 border border-rose-500/50 rounded-xl p-3 text-center space-y-2 max-w-md">
        <div class="text-xs font-bold text-rose-300">
          ⚠️ @${activePlayer.username} owes <span class="font-mono-num text-white">$${debt.amount}</span> (${debt.reason})
        </div>
        <div class="text-[11px] text-slate-300">Sell houses, mortgage deeds in the Inspector, or Trade with players to raise cash!</div>
        <div class="flex items-center justify-center gap-2 pt-1">
          <button id="btnPayPendingDebt" ${!canPayNow ? 'disabled' : ''} class="px-4 py-2 rounded-lg bg-emerald-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs">
            ✅ Pay $${debt.amount} Now
          </button>
          <button id="btnDeclareBankruptcy" class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs">
            🏳️ Declare Bankruptcy
          </button>
        </div>
      </div>
    `;
  } else if (room.turnPhase === 'POST_ROLL') {
    const rolledDoubles = d1 === d2 && !activePlayer.inJail && room.doublesCount > 0;
    phaseActionsHtml = `
      <div class="flex flex-wrap items-center justify-center gap-2.5">
        ${rolledDoubles ? `
          <button id="btnRollDice" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-display font-extrabold text-xs shadow-lg">
            🎲 Rolled Doubles! Roll Again
          </button>
        ` : `
          <button id="btnEndTurn" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:opacity-95 text-slate-950 font-display font-extrabold text-xs shadow-lg">
            End Turn <i class="fa-solid fa-forward-step ml-1"></i>
          </button>
        `}
      </div>
    `;
  }

  return `
    <div class="board-center">
      <div class="flex items-center justify-between gap-2">
        <div class="flex-1 bg-slate-900/90 border border-amber-500/30 rounded-xl p-2 flex items-center gap-2">
          <div class="w-8 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-slate-950 font-bold text-base shadow">⚡</div>
          <div class="leading-tight">
            <div class="text-[10px] font-mono-num uppercase text-amber-400 font-bold">Plot Twist</div>
            <div class="text-[10px] text-slate-400">16-Card Deck</div>
          </div>
        </div>
        <div class="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-center hidden sm:block">
          <div class="font-display font-black text-sm tracking-wider bg-gradient-to-r from-emerald-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">COPYPOLY</div>
          <div class="text-[9px] font-mono-num text-slate-400">8-PLAYER SYNDICATE</div>
        </div>
        <div class="flex-1 bg-slate-900/90 border border-cyan-500/30 rounded-xl p-2 flex items-center justify-end gap-2 text-right">
          <div class="leading-tight">
            <div class="text-[10px] font-mono-num uppercase text-cyan-400 font-bold">Karma Vault</div>
            <div class="text-[10px] text-slate-400">16-Card Deck</div>
          </div>
          <div class="w-8 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-base shadow">📦</div>
        </div>
      </div>

      <div class="flex-1 flex flex-col items-center justify-center my-2 px-3 py-3 rounded-2xl bg-slate-900/75 border border-slate-800/90 relative">
        <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-700 mb-2">
          <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs" style="background:${activePlayer.color}">${activePlayer.emoji}</span>
          <span class="text-xs font-bold text-white">${activePlayer.displayName}</span>
          <span class="text-xs font-mono-num text-emerald-400">(@${activePlayer.username})</span>
          <span class="text-xs font-mono-num font-bold text-amber-300 ml-1">$${activePlayer.money}</span>
        </div>

        <div class="flex items-center gap-4 my-2">
          <div id="dieBox1" class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-white to-slate-200 text-slate-950 font-mono-num font-black text-2xl flex items-center justify-center shadow-lg border-2 border-emerald-400 ${isRollingAnim ? 'dice-rolling' : ''}">
            ${d1}
          </div>
          <div id="dieBox2" class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-white to-slate-200 text-slate-950 font-mono-num font-black text-2xl flex items-center justify-center shadow-lg border-2 border-cyan-400 ${isRollingAnim ? 'dice-rolling' : ''}">
            ${d2}
          </div>
        </div>

        <div class="text-[11px] text-slate-400 mb-3 text-center">
          Standing on <strong class="text-white">${currentTile.name}</strong>
          ${activePlayer.inJail ? '<span class="ml-1 text-rose-400 font-bold">(In The Slammer)</span>' : ''}
        </div>

        ${phaseActionsHtml}

        ${room.lastCard ? `
          <div class="mt-3 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-center max-w-md">
            <div class="text-[10px] font-mono-num uppercase text-amber-300 font-bold">${room.lastCard.deck}: ${room.lastCard.title}</div>
            <div class="text-[11px] text-slate-200">${room.lastCard.desc}</div>
          </div>
        ` : ''}
      </div>

      <div class="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2">
        <div class="text-[11px] text-slate-400 truncate">
          <i class="fa-solid fa-hand-pointer text-cyan-400 mr-1"></i> Click any tile to build houses, mortgage, or inspect rent
        </div>
        <button id="btnCenterProposeTrade" class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-extrabold text-xs transition whitespace-nowrap flex items-center gap-1.5 shadow">
          <i class="fa-solid fa-handshake"></i> Propose Trade
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
// 7. COMPLETE MONOPOLY GAMEPLAY MECHANICS (MOVEMENT, RENT, CARDS, SLAMMER)
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

  await new Promise(r => setTimeout(r, 380));
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
        text: `🎲 @${player.username} rolled doubles (${d1}+${d2}) and broke out of The Slammer!`
      });
      await movePlayerAndResolveTile(room, player, total, false);
    } else {
      player.jailTurns += 1;
      if (player.jailTurns >= 3) {
        player.inJail = false;
        player.jailTurns = 0;
        room.logs.unshift({
          time: Date.now(),
          text: `⛓️ @${player.username} missed doubles 3 times — mandatory $50 bail charged and moving ${total} spaces.`
        });
        chargePlayerOrCreateDebt(room, player, 50, null, 'Slammer Mandatory Bail');
        if (room.turnPhase !== 'DEBT_RESOLUTION') {
          await movePlayerAndResolveTile(room, player, total, false);
        }
      } else {
        room.logs.unshift({
          time: Date.now(),
          text: `⛓️ @${player.username} rolled ${d1}+${d2} (no doubles) and stays in The Slammer (${player.jailTurns}/3).`
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
      sendPlayerToSlammer(room, player, 'Rolled 3 consecutive doubles (Speeding!)');
      await saveRoomState(room);
      return;
    }
  } else {
    room.doublesCount = 0;
  }

  room.logs.unshift({
    time: Date.now(),
    text: `🎲 @${player.username} rolled ${d1} + ${d2} = ${total}${isDoubles ? ' (DOUBLES!)' : ''}.`
  });

  await movePlayerAndResolveTile(room, player, total, isDoubles);
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
    text: `🚨 BUSTED! @${player.username} sent to The Slammer (${reason}).`
  });
}

async function movePlayerAndResolveTile(room, player, steps, allowExtraTurn) {
  const oldPos = player.position;
  const newPos = (oldPos + steps + 40) % 40;

  if (steps > 0 && newPos < oldPos) {
    player.money += 200;
    playSfx('cash');
    room.logs.unshift({
      time: Date.now(),
      text: `🏁 @${player.username} passed START LINE and collected $200!`
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
    sendPlayerToSlammer(room, player, 'Landed on BUSTED!');
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
      text: `🃏 @${player.username} drew ${room.lastCard.deck}: "${card.title}" — ${card.desc}`
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

    if (propState.owner === player.username) {
      room.turnPhase = 'POST_ROLL';
      return;
    }

    if (propState.mortgaged) {
      room.logs.unshift({
        time: Date.now(),
        text: `💤 @${player.username} landed on ${tile.name} (Mortgaged by @${propState.owner} — No rent).`
      });
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
        text: `🏁 @${player.username} passed START LINE and collected $200!`
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
        text: `💸 @${player.username} paid $${amount} to @${creditorUsername} (${reason}).`
      });
    } else {
      room.logs.unshift({
        time: Date.now(),
        text: `💸 @${player.username} paid $${amount} to the Bank (${reason}).`
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
      text: `⚠️ @${player.username} owes $${amount} (${reason}) but only has $${player.money}! Raise funds or declare bankruptcy.`
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
    text: `🔓 @${player.username} paid $50 bail and stepped out of The Slammer.`
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
    text: `🃏 @${player.username} used a Get Out of Slammer Free pass!`
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
    text: `🏠 @${player.username} purchased ${tile.name} for $${tile.price}!`
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
    text: `🔨 @${player.username} sent ${tile.name} to an open floor auction!`
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
      if (st.owner === player.username) {
        st.owner = creditor.username;
      }
    });
    room.logs.unshift({
      time: Date.now(),
      text: `💀 @${player.username} declared BANKRUPTCY! All assets transferred to @${creditor.username}.`
    });
  } else {
    Object.entries(room.properties).forEach(([tid, st]) => {
      if (st.owner === player.username) {
        delete room.properties[tid];
      }
    });
    room.logs.unshift({
      time: Date.now(),
      text: `💀 @${player.username} declared BANKRUPTCY to the Bank! All their properties are now unowned.`
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
      text: `🏆 GAME OVER! @${survivors[0].username} is the last tycoon standing and wins COPYPOLY!`
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
// 8. BUILDING HOUSES / MEGA-HOTELS & MORTGAGING
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

  const label = st.houses === 5 ? 'a Mega-Hotel 🏨' : `House #${st.houses} 🏠`;
  playSfx('buy');
  room.logs.unshift({
    time: Date.now(),
    text: `🏗️ @${player.username} built ${label} on ${tile.name} for $${tile.houseCost}.`
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
    text: `🔨 @${player.username} sold an upgrade on ${tile.name} for $${refund}.`
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
      showToast('Sell buildings on this property before mortgaging!', 'rose');
      return;
    }
    const mortgageVal = Math.floor(tile.price / 2);
    st.mortgaged = true;
    player.money += mortgageVal;
    playSfx('cash');
    room.logs.unshift({
      time: Date.now(),
      text: `🏦 @${player.username} mortgaged ${tile.name} for +$${mortgageVal}.`
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
      text: `🔓 @${player.username} unmortgaged ${tile.name} for $${unmortgageCost}.`
    });
  }
  await saveRoomState(room);
}

// ============================================================================
// 9. SIDEBARS: 8-PLAYER ROSTER, PORTFOLIO & DEED INSPECTOR
// ============================================================================
function renderPlayerRoster(room) {
  const container = document.getElementById('gamePlayerRoster');
  const activePlayer = room.players[room.turnIndex];

  container.innerHTML = room.players.map((p, idx) => {
    const isTurn = activePlayer && activePlayer.username === p.username && !p.bankrupt;
    const propCount = Object.values(room.properties).filter(st => st.owner === p.username).length;
    const tileName = BOARD_TILES[p.position]?.name || 'Start Line';

    return `
      <div class="p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
        p.bankrupt
          ? 'bg-slate-950/40 border-slate-800/60 opacity-45'
          : isTurn
          ? 'bg-slate-800/95 border-emerald-400 shadow-md shadow-emerald-500/10'
          : 'bg-slate-950/80 border-slate-800/90'
      }">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 relative"
            style="background:${p.color}25; border:2px solid ${p.color}">
            ${p.emoji}
            ${isTurn ? '<span class=" -top-1 -right-1 absolute w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950"></span>' : ''}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-white truncate">${p.displayName}</span>
              <span class="text-[10px] font-mono-num text-emerald-400">@${p.username}</span>
            </div>
            <div class="text-[10px] text-slate-400 truncate">
              ${p.bankrupt ? '💀 BANKRUPT' : `📍 ${tileName} • ${propCount} deeds`}
              ${p.inJail ? ' • <span class="text-rose-400 font-bold">⛓️ Slammer</span>' : ''}
              ${p.jailFreeCards > 0 ? ` • <span class="text-amber-300">🃏x${p.jailFreeCards}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="text-right shrink-0">
          <div class="text-xs font-mono-num font-extrabold ${p.money < 100 ? 'text-rose-400' : 'text-emerald-400'}">
            $${p.money}
          </div>
          ${!p.bankrupt ? `
            <button data-partner="${p.username}" class="btn-quick-trade text-[10px] text-amber-300 hover:underline font-semibold">
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
    listEl.innerHTML = `<div class="text-xs text-slate-500 text-center py-4">No properties owned yet by @${selectedPortfolioPlayerId}.</div>`;
    return;
  }

  listEl.innerHTML = ownedTiles.map(t => {
    const st = room.properties[t.id];
    const grp = GROUP_COLORS[t.group] || { hex: '#64748b' };
    return `
      <div data-tile="${t.id}" class="portfolio-item p-2 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 cursor-pointer flex items-center justify-between transition">
        <div class="flex items-center gap-2">
          <span class="w-3 h-5 rounded-sm shrink-0" style="background:${grp.hex}"></span>
          <div>
            <div class="text-xs font-bold text-white">${t.name}</div>
            <div class="text-[10px] text-slate-400">
              ${st.mortgaged ? '<span class="text-rose-400 font-bold">MORTGAGED</span>' : (st.houses === 5 ? '🏨 Mega-Hotel' : st.houses > 0 ? `🏠 ${st.houses} House(s)` : 'Unimproved')}
            </div>
          </div>
        </div>
        <span class="text-xs font-mono-num text-slate-400">$${t.price}</span>
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
      <div class="text-center py-4 space-y-2">
        <div class="text-3xl">${tile.icon || '🎲'}</div>
        <h3 class="text-base font-display font-extrabold text-white">${tile.name}</h3>
        <p class="text-xs text-slate-400">${tile.sub || 'Special Board Tile — Click any property deed on the perimeter to inspect full rent schedules & build upgrades.'}</p>
      </div>
    `;
    return;
  }

  let rentTableHtml = '';
  if (tile.type === 'prop') {
    rentTableHtml = `
      <div class="space-y-1 text-xs my-3 bg-slate-950/90 p-3 rounded-xl border border-slate-800">
        <div class="flex justify-between"><span class="text-slate-400">Base Rent</span><span class="font-mono-num font-bold text-white">$${tile.rent[0]}</span></div>
        <div class="flex justify-between"><span class="text-emerald-400">Full Color Set (2x)</span><span class="font-mono-num font-bold text-emerald-400">$${tile.rent[0] * 2}</span></div>
        <div class="flex justify-between"><span class="text-slate-300">With 1 House</span><span class="font-mono-num">$${tile.rent[1]}</span></div>
        <div class="flex justify-between"><span class="text-slate-300">With 2 Houses</span><span class="font-mono-num">$${tile.rent[2]}</span></div>
        <div class="flex justify-between"><span class="text-slate-300">With 3 Houses</span><span class="font-mono-num">$${tile.rent[3]}</span></div>
        <div class="flex justify-between"><span class="text-slate-300">With 4 Houses</span><span class="font-mono-num">$${tile.rent[4]}</span></div>
        <div class="flex justify-between border-t border-slate-800 pt-1"><span class="text-amber-300 font-bold">With Mega-Hotel 🏨</span><span class="font-mono-num font-extrabold text-amber-300">$${tile.rent[5]}</span></div>
        <div class="flex justify-between text-[11px] text-slate-400 pt-1">
          <span>Upgrade Cost: $${tile.houseCost}</span>
          <span>Mortgage: $${Math.floor(tile.price / 2)}</span>
        </div>
      </div>
    `;
  } else if (tile.type === 'transit') {
    rentTableHtml = `
      <div class="space-y-1 text-xs my-3 bg-slate-950/90 p-3 rounded-xl border border-slate-800">
        <div class="flex justify-between"><span class="text-slate-400">1 Transit Station</span><span class="font-mono-num font-bold">$25</span></div>
        <div class="flex justify-between"><span class="text-slate-300">2 Transit Stations</span><span class="font-mono-num font-bold">$50</span></div>
        <div class="flex justify-between"><span class="text-slate-300">3 Transit Stations</span><span class="font-mono-num font-bold">$100</span></div>
        <div class="flex justify-between"><span class="text-emerald-400 font-bold">All 4 Stations</span><span class="font-mono-num font-extrabold text-emerald-400">$200</span></div>
      </div>
    `;
  } else if (tile.type === 'utility') {
    rentTableHtml = `
      <div class="space-y-1.5 text-xs my-3 bg-slate-950/90 p-3 rounded-xl border border-slate-800">
        <div class="flex justify-between"><span class="text-slate-300">1 Utility Owned</span><span class="font-mono-num font-bold text-cyan-300">4x Dice Roll</span></div>
        <div class="flex justify-between"><span class="text-emerald-400 font-bold">Both Utilities Owned</span><span class="font-mono-num font-extrabold text-emerald-400">10x Dice Roll</span></div>
      </div>
    `;
  }

  let manageControlsHtml = '';
  if (owner) {
    const canBuild = canBuildHouseOnTile(room, tile, owner.username);
    const canSell = canSellHouseOnTile(room, tile, owner.username);
    const unmortCost = Math.ceil((tile.price / 2) * 1.1);

    manageControlsHtml = `
      <div class="space-y-2 pt-2 border-t border-slate-800">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400">Owner:</span>
          <span class="font-bold text-white flex items-center gap-1">
            <span>${owner.emoji}</span> @${owner.username}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          ${tile.type === 'prop' ? `
            <button id="btnInspectorBuild" ${!canBuild ? 'disabled' : ''} class="px-2.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 font-bold text-xs transition">
              + Build ($${tile.houseCost})
            </button>
            <button id="btnInspectorSell" ${!canSell ? 'disabled' : ''} class="px-2.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-30 text-amber-300 border border-amber-500/40 font-bold text-xs transition">
              - Sell (+$${Math.floor(tile.houseCost / 2)})
            </button>
          ` : ''}
        </div>
        <button id="btnInspectorMortgage" class="w-full py-2 rounded-xl font-bold text-xs border transition ${
          st.mortgaged
            ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40'
            : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
        }">
          ${st.mortgaged ? `🔓 Unmortgage Deed (-$${unmortCost})` : `🏦 Mortgage Deed (+$${Math.floor(tile.price / 2)})`}
        </button>
      </div>
    `;
  } else {
    manageControlsHtml = `
      <div class="text-center py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
        Unowned Deed — Land here to purchase for <strong class="text-white font-mono-num">$${tile.price}</strong>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="rounded-xl p-3 text-center shadow-inner" style="background-color: ${grp ? grp.hex : '#334155'}">
      <div class="text-[10px] font-mono-num uppercase tracking-widest text-white/80 font-bold">${grp ? grp.label : 'Deed'}</div>
      <h3 class="text-base font-display font-extrabold text-white mt-0.5">${tile.name}</h3>
    </div>
    ${rentTableHtml}
    ${manageControlsHtml}
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
    <div class="p-2 rounded-lg ${i === 0 ? 'bg-slate-800/90 border border-emerald-500/30 text-white font-medium' : 'bg-slate-950/60 text-slate-300'}">
      ${item.text}
    </div>
  `).join('');
}

// ============================================================================
// 10. PLAYER-TO-PLAYER TRADING ENGINE & AUCTION MODAL
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
      if (tiles.length === 0) return `<div class="text-xs text-slate-500 py-2">No tradable unimproved properties.</div>`;
      return tiles.map(t => {
        const grp = GROUP_COLORS[t.group] || { hex: '#64748b' };
        return `
          <label class="flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer text-xs">
            <div class="flex items-center gap-2">
              <input type="checkbox" value="${t.id}" class="${cls} accent-emerald-400" />
              <span class="w-2.5 h-4 rounded-sm" style="background:${grp.hex}"></span>
              <span class="font-semibold text-white">${t.name}</span>
            </div>
            <span class="font-mono-num text-slate-400">$${t.price}</span>
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
    errBox.textContent = 'Select two different players to make a trade!';
    errBox.classList.remove('hidden');
    return;
  }

  const fromPlayer = room.players.find(p => p.username === fromUser);
  const toPlayer = room.players.find(p => p.username === toUser);

  const offerCash = Math.max(0, parseInt(document.getElementById('inputTradeOfferCash').value, 10) || 0);
  const requestCash = Math.max(0, parseInt(document.getElementById('inputTradeRequestCash').value, 10) || 0);
  const offerCards = Math.max(0, parseInt(document.getElementById('inputTradeOfferCards').value, 10) || 0);
  const requestCards = Math.max(0, parseInt(document.getElementById('inputTradeRequestCards').value, 10) || 0);

  if (offerCash > fromPlayer.money) {
    errBox.textContent = `@${fromUser} only has $${fromPlayer.money}!`;
    errBox.classList.remove('hidden');
    return;
  }
  if (requestCash > toPlayer.money) {
    errBox.textContent = `@${toUser} only has $${toPlayer.money}!`;
    errBox.classList.remove('hidden');
    return;
  }
  if (offerCards > (fromPlayer.jailFreeCards || 0) || requestCards > (toPlayer.jailFreeCards || 0)) {
    errBox.textContent = 'Invalid number of Slammer Free cards selected.';
    errBox.classList.remove('hidden');
    return;
  }

  const offerProps = Array.from(document.querySelectorAll('.chk-offer-prop:checked')).map(el => parseInt(el.value, 10));
  const requestProps = Array.from(document.querySelectorAll('.chk-req-prop:checked')).map(el => parseInt(el.value, 10));

  if (offerCash === 0 && requestCash === 0 && offerProps.length === 0 && requestProps.length === 0 && offerCards === 0 && requestCards === 0) {
    errBox.textContent = 'Include at least one property, dollar amount, or card in the trade!';
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
    text: `🤝 @${fromUser} sent a live trade offer to @${toUser}!`
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
    text: `✅ TRADE COMPLETED between @${fromP.username} and @${toP.username}!`
  });
  room.activeTrade = null;
  playSfx('trade');
  showToast('Trade accepted and assets swapped!', 'emerald');
  await saveRoomState(room);
}

async function executeDeclineActiveTrade(room) {
  const tr = room.activeTrade;
  if (!tr) return;
  room.logs.unshift({
    time: Date.now(),
    text: `❌ Trade proposal between @${tr.from} and @${tr.to} was declined.`
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
      if (!ids || ids.length === 0) return '<div class="text-slate-500 text-xs">No properties</div>';
      return ids.map(id => {
        const t = BOARD_TILES[id];
        const grp = GROUP_COLORS[t.group] || { hex: '#64748b' };
        return `<div class="flex items-center gap-1.5 text-xs text-white font-semibold"><span class="w-2.5 h-2.5 rounded-full" style="background:${grp.hex}"></span>${t.name} ($${t.price})</div>`;
      }).join('');
    };

    document.getElementById('incomingTradeBody').innerHTML = `
      <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <div class="text-xs font-bold uppercase text-emerald-400">@${tr.from} Gives:</div>
        <div class="text-sm font-mono-num font-bold text-white">💵 $${tr.offerCash} Cash</div>
        ${tr.offerCards > 0 ? `<div class="text-xs text-amber-300">🃏 ${tr.offerCards}x Slammer Free Card</div>` : ''}
        <div class="space-y-1 pt-1 border-t border-slate-800">${formatProps(tr.offerProps)}</div>
      </div>
      <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <div class="text-xs font-bold uppercase text-cyan-400">@${tr.to} Gives:</div>
        <div class="text-sm font-mono-num font-bold text-white">💵 $${tr.requestCash} Cash</div>
        ${tr.requestCards > 0 ? `<div class="text-xs text-amber-300">🃏 ${tr.requestCards}x Slammer Free Card</div>` : ''}
        <div class="space-y-1 pt-1 border-t border-slate-800">${formatProps(tr.requestProps)}</div>
      </div>
    `;

    document.getElementById('incomingTradeActions').innerHTML = `
      <button id="btnDeclineTradeOffer" class="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs">
        Decline / Cancel
      </button>
      <button id="btnAcceptTradeOffer" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-display font-extrabold text-xs shadow-lg">
        ✅ Accept Trade (@${tr.to})
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

    document.getElementById('auctionTileName').textContent = `${tile.name} (List: $${tile.price})`;
    document.getElementById('auctionHighBid').textContent = `$${auc.highBid}`;
    document.getElementById('auctionHighBidder').textContent = `Highest Bidder: @${auc.highBidder}`;

    const biddersHtml = room.players.filter(p => !p.bankrupt).map(p => {
      const next10 = auc.highBid + 10;
      const next50 = auc.highBid + 50;
      return `
        <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="text-xs font-bold text-white truncate">${p.emoji} @${p.username}</div>
            <div class="text-[10px] font-mono-num text-emerald-400">Cash: $${p.money}</div>
          </div>
          <div class="flex items-center gap-1">
            <button data-user="${p.username}" data-bid="${next10}" ${p.money < next10 ? 'disabled' : ''}
              class="btn-auction-bid px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 font-mono-num font-bold text-[11px]">
              +$10
            </button>
            <button data-user="${p.username}" data-bid="${next50}" ${p.money < next50 ? 'disabled' : ''}
              class="btn-auction-bid px-2 py-1 rounded bg-cyan-400 hover:bg-cyan-300 disabled:opacity-30 text-slate-950 font-mono-num font-bold text-[11px]">
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
          text: `🔨 Auction Hammered! @${winner.username} won ${tile.name} for $${auc.highBid}!`
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
// 11. EVENT LISTENERS & INITIALIZATION ON LOAD
// ============================================================================
window.addEventListener('DOMContentLoaded', async () => {
  renderAuthTokenPicker();

  document.getElementById('tabAuthRegister').addEventListener('click', () => setAuthTab('register'));
  document.getElementById('tabAuthLogin').addEventListener('click', () => setAuthTab('login'));
  document.getElementById('formAuth').addEventListener('submit', handleAuthSubmit);

  document.getElementById('btnToggleSound').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('iconSound');
    icon.className = soundEnabled ? 'fa-solid fa-volume-high text-emerald-400' : 'fa-solid fa-volume-xmark text-slate-500';
  });

  document.getElementById('btnSwitchAccount').addEventListener('click', () => {
    document.getElementById('viewLobby').classList.add('hidden');
    document.getElementById('viewGame').classList.add('hidden');
    document.getElementById('viewAuth').classList.remove('hidden');
  });

  document.getElementById('btnLeaveRoom').addEventListener('click', () => {
    currentRoomId = null;
    document.getElementById('navRoomBadge').classList.add('hidden');
    document.getElementById('viewGame').classList.add('hidden');
    document.getElementById('viewLobby').classList.remove('hidden');
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