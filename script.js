// Drop Table Pool with accurate tier configurations and sorting weights
const lootTable = [
    { name: "M4A4 | Poly Mag", tier: "Mil-Spec", css: "rarity-mil-spec", weight: 70, rank: 1 },
    { name: "Glock-18 | Vogue", tier: "Restricted", css: "rarity-restricted", weight: 16, rank: 2 },
    { name: "AK-47 | Neon Rider", tier: "Classified", css: "rarity-classified", weight: 11, rank: 3 },
    { name: "AWP | Asiimov", tier: "Covert", css: "rarity-covert", weight: 2.6, rank: 4 },
    { name: "★ Karambit | Marble Fade", tier: "Special Gold", css: "rarity-gold", weight: 0.4, rank: 5 }
];

// Configuration Metrics
const CARD_WIDTH = 130;  
const TOTAL_CARDS = 50;  
const WINNING_INDEX = 38; 
let walletBalance = 250.00;
let isSpinning = false;

// Dedicated inventory tracking state map (Keys are weapon names)
let inventoryMap = {}; 
let totalInventoryCount = 0;

// Web Audio API Synthesizer Engine
const AudioEngine = {
    ctx: null,
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    playTick() {
        this.init();
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    },
    playWin(isRare) {
        this.init();
        let freq = isRare ? 587.33 : 329.63; 
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.8);
    }
};

function getWeightedItem() {
    let roll = Math.random() * 100;
    let accum = 0;
    for (let item of lootTable) {
        accum += item.weight;
        if (roll <= accum) return item;
    }
    return lootTable[0];
}

function spinCase() {
    if (isSpinning) return;
    if (walletBalance < 2.50) {
        document.getElementById("statusMessage").innerText = "INSUFFICIENT FUNDS // RECHARGE REQUIRED";
        document.getElementById("statusMessage").style.color = "#eb4b4b";
        return;
    }

    const isInstant = document.getElementById("instantToggle").checked;

    walletBalance -= 2.50;
    document.getElementById("walletBalance").innerText = walletBalance.toFixed(2);
    
    const strip = document.getElementById("itemStrip");
    const openBtn = document.getElementById("openBtn");
    const statusText = document.getElementById("statusMessage");

    let winningItem = getWeightedItem();
    const isRareDrop = winningItem.tier === "Covert" || winningItem.tier === "Special Gold";

    // --- BRANCH A: INSTANT RESOLUTION LOOP ---
    if (isInstant) {
        strip.style.transition = "none";
        strip.innerHTML = "";
        
        let dummyLeft = document.createElement("div");
        dummyLeft.style.width = "360px"; 
        
        let card = document.createElement("div");
        card.className = `item-card ${winningItem.css}`;
        card.innerHTML = `<div class="card-name">${winningItem.name.split(" | ")}</div>`;
        
        strip.appendChild(dummyLeft);
        strip.appendChild(card);
        strip.style.transform = `translateX(0px)`;

        statusText.innerText = `INSTANT ACQUIRED: ${winningItem.name.toUpperCase()}`;
        statusText.style.color = "var(--neon-cyan)";
        
        AudioEngine.playWin(isRareDrop);
        handleNewDrop(winningItem, true); // true flags this as a personal player drop
        return; 
    }

    // --- BRANCH B: CINEMATIC 5-SECOND ROLL ENGINE ---
    isSpinning = true;
    openBtn.disabled = true;
    statusText.innerText = "DECRYPTING AMMUNITION CACHE...";
    statusText.style.color = "var(--neon-gold)";

    strip.style.transition = "none";
    strip.style.transform = "translateX(0px)";
    strip.innerHTML = "";

    for (let i = 0; i < TOTAL_CARDS; i++) {
        let item = (i === WINNING_INDEX) ? winningItem : getWeightedItem();
        let card = document.createElement("div");
        card.className = `item-card ${item.css}`;
        card.innerHTML = `<div class="card-name">${item.name.split(" | ")}</div>`;
        strip.appendChild(card);
    }

    strip.offsetHeight; 

    const viewWidth = document.querySelector('.spinner-viewport').offsetWidth;
    const centerPoint = viewWidth / 2;
    const baseOffset = (WINNING_INDEX * CARD_WIDTH) + (CARD_WIDTH / 2) - centerPoint;
    const internalCardShift = Math.floor(Math.random() * 90) - 45;
    const targetFinalTranslate = baseOffset + internalCardShift;

    let lastTickCardIndex = 0;
    const startTime = performance.now();
    const duration = 5000; 

    function trackTicks(now) {
        if (!isSpinning) return;
        let elapsed = now - startTime;
        if (elapsed > duration) elapsed = duration;

        let t = elapsed / duration;
        let progress = 1 - Math.pow(1 - t, 4); 
        let currentTranslate = progress * targetFinalTranslate;

        let currentPassedIndex = Math.floor((currentTranslate + centerPoint) / CARD_WIDTH);
        if (currentPassedIndex > lastTickCardIndex) {
            AudioEngine.playTick();
            lastTickCardIndex = currentPassedIndex;
        }

        if (elapsed < duration) requestAnimationFrame(trackTicks);
    }
    requestAnimationFrame(trackTicks);

    strip.style.transition = "transform 5s cubic-bezier(0.1, 0.8, 0.1, 1)";
    strip.style.transform = `translateX(-${targetFinalTranslate}px)`;

    setTimeout(() => {
        isSpinning = false;
        openBtn.disabled = false;
        
        statusText.innerText = `ACQUIRED: ${winningItem.name.toUpperCase()}`;
        statusText.style.color = "var(--neon-cyan)";
        
        AudioEngine.playWin(isRareDrop);
        handleNewDrop(winningItem, true);
    }, duration);
}

// Global master router handler mapping inventory state mutations and drop alerts
function handleNewDrop(item, isPlayerDrop) {
    // 1. Process Internal Data Maps
    if (!inventoryMap[item.name]) {
        inventoryMap[item.name] = { data: item, count: 1 };
    } else {
        inventoryMap[item.name].count++;
    }
    
    totalInventoryCount++;
    document.getElementById("invCount").innerText = totalInventoryCount;

    // 2. Refresh HTML presentation view patterns
    renderSortedInventory();

    // 3. Inject drop alert straight into live global display frames
    pushToLiveTicker(item, isPlayerDrop);
}

// Renders the grid using sorted entries and card stacking logic
function renderSortedInventory() {
    const grid = document.getElementById("inventoryGrid");
    grid.innerHTML = ""; // Clear active grid elements

    // Convert object data references into sortable array matrices
    let sortedList = Object.values(inventoryMap);

    // Sort items by descending rarity (Rarity Rank 5 down to Rank 1)
    sortedList.sort((a, b) => b.data.rank - a.data.rank);

    if (sortedList.length === 0) {
        grid.innerHTML = `<div class="empty-notice">Your acquired weapons storage is currently empty.</div>`;
        return;
    }

    // Build the inventory structure
    sortedList.forEach(entry => {
        const item = entry.data;
        
        let wrapper = document.createElement("div");
        wrapper.className = "inv-card-wrapper";

        // Inject a stack counter badge if the player owns duplicates
        if (entry.count > 1) {
            let badge = document.createElement("div");
            badge.className = "stack-badge";
            badge.innerText = `x${entry.count}`;
            wrapper.appendChild(badge);
        }

        let card = document.createElement("div");
        card.className = `item-card ${item.css}`;
        card.style.height = "110px";
        card.innerHTML = `<div class="card-name">${item.name.split(" | ")}</div>`;
        
        wrapper.appendChild(card);
        grid.appendChild(wrapper);
    });
}

// Unified interface method writing drop alerts straight to the live ticker
function pushToLiveTicker(item, isPlayerDrop) {
    const ticker = document.getElementById("liveTicker");
    
    let feedNode = document.createElement("div");
    // Assign custom styling classes based on whether the drop belongs to the player or a bot
    feedNode.className = isPlayerDrop ? "feed-item my-drop" : "feed-item";
    feedNode.style.borderLeftColor = `var(--${item.css})`;
    
    const userLabel = isPlayerDrop ? `<span class="my-drop-tag">YOU</span>` : `User_${Math.floor(Math.random() * 900) + 100}`;
    
    feedNode.innerHTML = `${userLabel} <span style="color:rgba(255,255,255,0.4)">opened</span> <span style="font-weight:bold">${item.name.split(" | ")}</span>`;
    
    ticker.insertBefore(feedNode, ticker.firstChild);
    
    // Maintain ticker display boundaries by pruning elements older than 6 indexes
    if (ticker.children.length > 6) {
        ticker.removeChild(ticker.lastChild);
    }
}

function addFunds() {
    walletBalance += 50.00;
    document.getElementById("walletBalance").innerText = walletBalance.toFixed(2);
    AudioEngine.playWin(true);
}

// Background simulation cycle simulating activity from other online users
setInterval(() => {
    let simulatedBotItem = getWeightedItem();
    // Setting false hides background bot drops from your inventory map
    handleNewDrop(simulatedBotItem, false);
}, 4500);
