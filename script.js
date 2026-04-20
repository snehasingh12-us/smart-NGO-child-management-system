// --- Data Initialization ---
const defaultMockData = [
    { id: 'NGO-CH-1023', name: 'Aarav', age: 6, gender: 'Male', status: 'Available', timestamp: new Date().toISOString() },
    { id: 'NGO-CH-1024', name: 'Priya', age: 4, gender: 'Female', status: 'In Process', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 'NGO-CH-1025', name: 'Rohan', age: 8, gender: 'Male', status: 'Adopted', timestamp: new Date(Date.now() - 172800000).toISOString() },
    { id: 'NGO-CH-1026', name: 'Alia', age: 3, gender: 'Female', status: 'Available', timestamp: new Date(Date.now() - 200000000).toISOString() },
    { id: 'NGO-CH-1027', name: 'Kabir', age: 7, gender: 'Male', status: 'Available', timestamp: new Date(Date.now() - 300000000).toISOString() },
    { id: 'NGO-CH-1028', name: 'Zara', age: 5, gender: 'Female', status: 'Available', timestamp: new Date(Date.now() - 400000000).toISOString() },
    { id: 'NGO-CH-1029', name: 'Aman', age: 2, gender: 'Male', status: 'Available', timestamp: new Date(Date.now() - 500000000).toISOString() }
];

let childrenData = JSON.parse(localStorage.getItem('ngoChildrenData')) || defaultMockData;

const defaultTimeline = [
    { type: 'add', childId: 'NGO-CH-1025', title: 'Adoption Finalized', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { type: 'add', childId: 'System', title: 'AI Match Analysis Complete', timestamp: new Date(Date.now() - 86400000).toISOString() }
];
let timelineData = JSON.parse(localStorage.getItem('ngoTimelineData')) || defaultTimeline;

if (!localStorage.getItem('ngoChildrenData')) {
    localStorage.setItem('ngoChildrenData', JSON.stringify(childrenData));
    localStorage.setItem('ngoTimelineData', JSON.stringify(timelineData));
}

// --- DOM Elements ---
const navItems = document.querySelectorAll('.nav-item');
const pageSections = document.querySelectorAll('.page-section');

const addModal = document.getElementById('add-modal');
const btnOpenModal = document.getElementById('btn-open-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const addChildForm = document.getElementById('add-child-form');
const addMsgContainer = document.getElementById('add-message-container');

const childrenGrid = document.getElementById('children-grid');
const aiMatchesGrid = document.getElementById('ai-matches-grid');
const aiHeroContainer = document.getElementById('ai-hero-match-container');
const dashboardListsGrid = document.getElementById('dashboard-lists-grid');

const noChildrenMsg = document.getElementById('no-children-message');
const dbNoChildrenMsg = document.getElementById('db-no-children-msg');
const searchInput = document.getElementById('filter-search-id');
const globalSearchInput = document.querySelector('.global-search');
const filterStatus = document.getElementById('filter-status');

const matchingForm = document.getElementById('matching-form');
const matchesGrid = document.getElementById('matches-grid');
const matchingResultsContainer = document.getElementById('matching-results-container');
const noMatchesMsg = document.getElementById('no-matches-message');
const loadingSpinner = document.getElementById('loading-spinner');
const matchCountBadge = document.getElementById('match-count-badge');

const timelineContainer = document.getElementById('timeline-container');

// --- Navigation Logic ---
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        pageSections.forEach(s => s.classList.remove('active'));

        item.classList.add('active');
        const targetId = item.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');

        if (targetId === 'dashboard') {
            updateDashboard();
        } else if (targetId === 'view-children') {
            filterAndSearch();
        }
    });
});

globalSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const val = globalSearchInput.value;
        navItems.forEach(n => n.classList.remove('active'));
        document.querySelector('[data-target="view-children"]').classList.add('active');
        pageSections.forEach(s => s.classList.remove('active'));
        document.getElementById('view-children').classList.add('active');
        
        searchInput.value = val;
        filterAndSearch();
    }
});

function openModal() { addModal.classList.remove('hidden'); }
function closeModal() {
    addModal.classList.add('hidden');
    addChildForm.reset();
    addMsgContainer.innerHTML = '';
}

btnOpenModal.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);
btnCancelModal.addEventListener('click', closeModal);

addModal.addEventListener('click', (e) => {
    if (e.target === addModal) closeModal();
});


function saveData() {
    localStorage.setItem('ngoChildrenData', JSON.stringify(childrenData));
    localStorage.setItem('ngoTimelineData', JSON.stringify(timelineData));
    updateDashboard();
    renderTimeline();
}

// --- Dynamic Timeline ---
function logTimelineActivity(type, childId, customTitle = null) {
    const title = customTitle || (type === 'add' ? 'New Profile Registered' : 'Profile Deleted');
    const timestamp = new Date().toISOString();
    
    timelineData.unshift({ type, childId, title, timestamp });
    if (timelineData.length > 8) timelineData.pop();
}

function renderTimeline() {
    timelineContainer.innerHTML = '';
    if (timelineData.length === 0) {
        timelineContainer.innerHTML = '<p style="color: var(--text-tertiary); font-size: 0.85rem;">No recent activity to display.</p>';
        return;
    }

    timelineData.forEach(item => {
        const dateObj = new Date(item.timestamp);
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const dotClass = item.type === 'add' ? 'add' : 'delete';
        
        timelineContainer.innerHTML += `
            <div class="tl-item">
                <div class="tl-dot ${dotClass}"></div>
                <div class="tl-content">
                    <div class="tl-title">${item.title}</div>
                    <div class="tl-time">${item.childId} • ${dateStr}, ${timeStr}</div>
                </div>
            </div>
        `;
    });
}

// --- Chart.js ---
let adoptionChartInstance = null;
function renderChart() {
    const ctx = document.getElementById('adoptionLineChart').getContext('2d');
    
    if (adoptionChartInstance) {
        adoptionChartInstance.destroy();
    }

    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)'); 

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const adoptionsData = [4, 6, 5, 8, 12, childrenData.filter(c => c.status === 'Adopted').length + 5];

    adoptionChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Successful Adoptions',
                data: adoptionsData,
                borderColor: '#8B5CF6',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#8B5CF6',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { family: 'Inter', size: 13 },
                    bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                x: { grid: { display: false, drawBorder: false }, ticks: { color: 'rgba(255,255,255,0.7)', font: { family: 'Inter' } } },
                y: { grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false }, ticks: { color: 'rgba(255,255,255,0.7)', font: { family: 'Inter' }, stepSize: 4 } }
            },
            interaction: { intersect: false, mode: 'index' },
        }
    });
}

const defaultApplicant = { minAge: 2, maxAge: 7, location: 'NY', healthCapacity: 3, acceptedBehaviors: 'Calm, Playful, Quiet' };

function analyzeCompatibility(child, applicant = defaultApplicant) {
    let score = 100;
    let breakdown = [];
    
    // fallbacks just in case child data doesn't have it (from old localStorage)
    const cLoc = child.location || 'NY';
    const cHealth = child.healthNeeds || 2;
    const cBeh = child.behavior || 'Playful';

    // 1. Age Match
    if (child.age >= applicant.minAge && child.age <= applicant.maxAge) {
        breakdown.push({ level: 'High', color: 'var(--status-adopted)', factor: 'Age Match', reason: `Applicant age preference aligns precisely with age ${child.age}.` });
    } else {
        score -= 20;
        breakdown.push({ level: 'Low', color: '#EF4444', factor: 'Age Match', reason: `Age ${child.age} falls outside the preferred range.` });
    }

    // 2. Location Match
    if (cLoc === applicant.location) {
        breakdown.push({ level: 'High', color: 'var(--status-adopted)', factor: 'Location Match', reason: `Both parties reside in ${cLoc}, ensuring highly compatible logistics.` });
    } else {
        score -= 10;
        breakdown.push({ level: 'Medium', color: 'var(--status-process)', factor: 'Location Match', reason: `Minor region variance, requiring some travel coordination.` });
    }

    // 3. Health Compatibility
    if (applicant.healthCapacity >= cHealth) {
        breakdown.push({ level: 'High', color: 'var(--status-adopted)', factor: 'Health Compatibility', reason: `Applicant holds required medical support for all necessary needs.` });
    } else {
        score -= 25;
        breakdown.push({ level: 'Low', color: '#EF4444', factor: 'Health Compatibility', reason: `Applicant's medical support capacity may be insufficient.` });
    }

    // 4. Behavioral Compatibility
    if (applicant.acceptedBehaviors.includes(cBeh) || applicant.acceptedBehaviors === 'Any') {
        breakdown.push({ level: 'High', color: 'var(--status-adopted)', factor: 'Behavioral Compatibility', reason: `Perfect alignment with the child's ${cBeh} temperament.` });
    } else {
        score -= 15;
        breakdown.push({ level: 'Medium', color: 'var(--status-process)', factor: 'Behavioral Compatibility', reason: `Moderate differences in ideal home environment expectations.` });
    }

    // Add a small deterministic variance based on ID to make the AI score feel more organic / realistic
    const organicVariance = child.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 8;
    score -= organicVariance;

    // Cap the score to prevent "too perfect" 100% numbers, and ensure a minimum.
    score = Math.min(Math.max(score, 35), 96);

    let insight = score >= 80 
        ? "AI predicts an exceptional match due to strong alignment across age, health support, and behavioral compatibility, with only minor location differences."
        : "AI identifies this as a moderate-to-low match. Certain mismatches regarding standard alignments require further manual review.";

    return { score, breakdown, insight };
}

function getMatchScore(child) {
    return analyzeCompatibility(child).score;
}

// --- Dashboard Statistics ---
function updateDashboard() {
    const total = childrenData.length;
    const available = childrenData.filter(c => c.status === 'Available');
    const adopted = childrenData.filter(c => c.status === 'Adopted').length;
    const inProcess = childrenData.filter(c => c.status === 'In Process').length;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-available').innerText = available.length;
    document.getElementById('stat-adopted').innerText = adopted;
    document.getElementById('stat-process').innerText = inProcess;

    renderChart();
    
    // Top AI Matches - Filter for Available, rank by Match Score
    const topMatches = [...available].sort((a,b) => getMatchScore(b) - getMatchScore(a));
    aiHeroContainer.innerHTML = '';
    
    if(topMatches.length > 0) {
        document.querySelector('.ai-matches').classList.remove('hidden');
        
        // 1. Render Top #1 Match as Hero
        const topHero = topMatches[0];
        const seed = topHero.name ? topHero.name : topHero.id;
        const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=e2e8f0,c7d2fe,bae6fd,fde68a,a7f3d0&textColor=475569`;
        
        // Use Dynamic Match Analysis function
        const analysis = analyzeCompatibility(topHero);
        const score = analysis.score;
        const itemsHTML = analysis.breakdown.map(item => `
            <div style="display:flex; gap: 8px; font-size: 0.9rem;">
                <span style="color:${item.color}; font-weight:700; width: 60px;">${item.level}</span>
                <span><strong>${item.factor}:</strong> <span style="color:var(--text-secondary);">${item.reason}</span></span>
            </div>
        `).join('');

        aiHeroContainer.innerHTML = `
            <div class="ai-hero-card hover-lift">
                <div class="hero-score-area">
                    <span class="mega-percentage">${score}%</span>
                    <span class="hero-match-label">#1 Optimal Match</span>
                </div>
                <div class="hero-details-area">
                    <div style="display:flex; align-items:center; gap: 16px; margin-bottom:12px;">
                        <img src="${avatarUrl}" alt="Avatar" style="width:64px; height:64px; border-radius:16px;">
                        <div>
                            <h3 style="font-size: 1.5rem; font-weight:800; margin:0; line-height:1.2;">${topHero.name || 'Unknown'}</h3>
                            <span style="font-size: 0.95rem; color: var(--text-secondary);">Age ${topHero.age} &bull; Internal ID: ${topHero.id}</span>
                        </div>
                    </div>
                    
                    <!-- AI Insight & Breakdown Layout (Dynamic) -->
                    <div class="hero-breakdown" style="display: grid; gap: 6px; margin-bottom: 16px;">
                        ${itemsHTML}
                    </div>

                    <div class="hero-insight" style="background: rgba(79, 70, 229, 0.05); padding: 12px 16px; border-radius: 8px; border-left: 3px solid var(--accent-indigo); margin-bottom: 12px;">
                        <strong style="color:var(--accent-indigo); display:block; font-size: 0.8rem; text-transform:uppercase; margin-bottom:4px; letter-spacing:0.5px;">AI Insight</strong>
                        <p style="font-size: 0.95rem; color: var(--text-primary); font-weight:500; margin: 0;">${analysis.insight}</p>
                    </div>

                    <div style="display:inline-block; font-size: 0.75rem; font-weight: 700; color: #8B5CF6; background: rgba(139, 92, 246, 0.1); padding: 4px 10px; border-radius: 12px; margin-bottom: 16px;">
                        ✨ AI Generated Recommendation
                    </div>

                    <div class="hero-actions">
                        <button class="btn-gradient" onclick="document.querySelector('[data-target=\\'matching\\']').click()">Review Match Details</button>
                        <button class="btn-outline">Start Adoption Process</button>
                    </div>
                </div>
            </div>
        `;

        // 2. Render remaining top matches in grid
        const remainingMatches = topMatches.slice(1, 4);
        if(remainingMatches.length > 0) {
            aiMatchesGrid.classList.remove('hidden');
            renderChildrenGrid(remainingMatches, aiMatchesGrid, null, false, true); // isAiCard = true
        } else {
            aiMatchesGrid.classList.add('hidden');
        }
    } else {
        document.querySelector('.ai-matches').classList.add('hidden');
    }

    // New Profiles Area - Render as Horizontal List
    const recent = childrenData.slice(0, 4);
    renderHorizontalLists(recent, dashboardListsGrid, dbNoChildrenMsg);
}

// --- Add Child ---
addChildForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('child-id').value.trim();
    const name = document.getElementById('child-name').value.trim();
    const age = parseInt(document.getElementById('child-age').value);
    const gender = document.getElementById('child-gender').value;
    const status = document.getElementById('child-status').value;

    if (childrenData.some(c => c.id.toLowerCase() === id.toLowerCase())) {
        showModalMessage('This ID already exists in the system.', 'error');
        return;
    }

    const newChild = { id, name, age, gender, status, timestamp: new Date().toISOString() };
    childrenData.unshift(newChild); 
    
    logTimelineActivity('add', id, `Profile added for ${name}`);
    saveData();
    
    showModalMessage('Record secured successfully! Close window to view.', 'success');
    addChildForm.reset();
    
    if (document.getElementById('view-children').classList.contains('active')) {
        filterAndSearch();
    }
});

function showModalMessage(text, type) {
    const colorClass = type === 'error' ? 'msg-error' : 'msg-success';
    addMsgContainer.innerHTML = `<span class="${colorClass}">${text}</span>`;
    setTimeout(() => { addMsgContainer.innerHTML = ''; }, 4000);
}


function getBadgeClass(status) {
    if (status === 'Available') return 'available';
    if (status === 'In Process') return 'process';
    if (status === 'Adopted') return 'adopted';
    return '';
}

// --- Render Horizontal List Cards ---
function createHorizontalCardHTML(child) {
    const badgeClass = getBadgeClass(child.status);
    const seed = child.name ? child.name : child.id;
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=e2e8f0,c7d2fe,bae6fd,fde68a,a7f3d0&textColor=475569`;

    return `
        <div class="card-horizontal hover-lift">
            <div class="card-avatar">
                <img src="${avatarUrl}" alt="Avatar" style="width:100%; border-radius:10px;">
            </div>
            <div class="info-block">
                <div>
                    <span class="card-name" style="font-size:1rem;">${child.name || 'Unknown'}, Age ${child.age}</span>
                    <span class="card-internal-id" style="font-size:0.7rem;">ID: ${child.id} &bull; ${child.gender}</span>
                </div>
                
                <div style="display:flex; align-items:center; gap: 20px;">
                    <span class="badge-pill ${badgeClass}">
                        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:currentColor;"></span>
                        ${child.status}
                    </span>
                    <button class="link-subtle" onclick="document.querySelector('[data-target=\\'view-children\\']').click()">Review Profile</button>
                </div>
            </div>
        </div>
    `;
}

function renderHorizontalLists(data, container, emptyMsg) {
    container.innerHTML = '';
    if (data.length === 0) {
        if(emptyMsg) emptyMsg.classList.remove('hidden');
    } else {
        if(emptyMsg) emptyMsg.classList.add('hidden');
        data.forEach((child) => {
            container.innerHTML += createHorizontalCardHTML(child);
        });
    }
}

// --- Render Vertical Rich/AI Cards ---
function createCardHTML(child, isAiCard = false) {
    const badgeClass = getBadgeClass(child.status);
    const seed = child.name ? child.name : child.id;
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=e2e8f0,c7d2fe,bae6fd,fde68a,a7f3d0&textColor=475569`;
    const matchScore = getMatchScore(child);
    let scoreColor = matchScore >= 85 ? '#10B981' : (matchScore >= 70 ? '#F59E0B' : '#6366F1');

    const cardClass = isAiCard ? 'card-rich ai-card hover-lift' : 'card-rich hover-lift';
    
    let matchHeaderHTML = '';
    if(isAiCard) {
        matchHeaderHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 15px;">
                <span class="detail-label" style="display:flex; align-items:center; gap:6px; color:var(--accent-purple);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Top Match
                </span>
                <span style="font-size: 2.2rem; font-weight: 800; line-height: 1; letter-spacing: -1px; color:${scoreColor}">${matchScore}%</span>
            </div>
        `;
    }

    return `
        <div class="${cardClass}">
            ${matchHeaderHTML}
            <div class="card-header">
                <div style="display:flex; gap: 12px; align-items:center; width:100%;">
                    <div class="card-avatar">
                        <img src="${avatarUrl}" alt="Avatar" style="width:100%; border-radius:14px;">
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; width:100%;">
                            <span class="card-name">${child.name || 'Unknown'}, Age ${child.age}</span>
                            <span class="badge-pill ${badgeClass}">
                                <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:currentColor;"></span>
                                ${child.status}
                            </span>
                        </div>
                        <span class="card-internal-id">Internal ID: ${child.id}</span>
                    </div>
                </div>
            </div>
            
            ${!isAiCard ? `
            <div class="match-score-container mb-4 mt-4">
                <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
                    <span class="detail-label" style="display:flex; align-items:center; gap:4px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                        AI Match Potential
                    </span>
                    <span style="font-size:0.8rem; font-weight:700; color:var(--text-primary);">${matchScore}%</span>
                </div>
                <div class="progress-bg">
                    <div class="progress-bar" style="width: ${matchScore}%; background: ${scoreColor};"></div>
                </div>
            </div>
            ` : ''}

            <div class="card-details">
                <div class="detail-item">
                    <span class="detail-label">Gender</span>
                    <span class="detail-value">${child.gender}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Enrolled</span>
                    <span class="detail-value">${new Date(child.timestamp).toLocaleDateString()}</span>
                </div>
            </div>
            ${!isAiCard ? `<button class="btn-danger mt-4" onclick="deleteChild('${child.id}')">Delete Profile</button>` : ''}
        </div>
    `;
}

function renderChildrenGrid(data, container = childrenGrid, emptyMsg = noChildrenMsg, isMatch = false, isAiCard = false) {
    container.innerHTML = '';
    
    if (data.length === 0) {
        if(emptyMsg) emptyMsg.classList.remove('hidden');
        if (container === matchesGrid) container.classList.add('hidden');
    } else {
        if(emptyMsg) emptyMsg.classList.add('hidden');
        container.classList.remove('hidden');
        
        data.forEach((child, index) => {
            const html = createCardHTML(child, isAiCard);
            container.innerHTML += html;
        });

        if (isMatch || isAiCard) {
            const cards = container.querySelectorAll('.card-rich');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.animationDelay = `${index * 0.15}s`;
                card.classList.add('match-anim');
            });
        }
    }
}

// --- Delete Record ---
window.deleteChild = function(id) {
    if (confirm(`Warning: This action is permanent. Delete internal profile ${id}?`)) {
        childrenData = childrenData.filter(c => c.id !== id);
        logTimelineActivity('delete', id, `Profile deleted.`);
        saveData();
        filterAndSearch();
        if (!matchingResultsContainer.classList.contains('hidden')) {
             matchingForm.dispatchEvent(new Event('submit'));
        }
    }
};

// --- Directory Filtering ---
function filterAndSearch() {
    const term = searchInput.value.toLowerCase();
    const status = filterStatus.value;

    const filtered = childrenData.filter(c => {
        const matchSearch = c.id.toLowerCase().includes(term) || (c.name && c.name.toLowerCase().includes(term));
        const matchStatus = status === 'All' || c.status === status;
        return matchSearch && matchStatus;
    });

    renderChildrenGrid(filtered, childrenGrid, noChildrenMsg, false, false);
}

searchInput.addEventListener('input', filterAndSearch);
filterStatus.addEventListener('change', filterAndSearch);

// --- Adoption Matching ---
matchingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    matchesGrid.innerHTML = '';
    noMatchesMsg.classList.add('hidden');
    matchingResultsContainer.classList.remove('hidden');
    matchCountBadge.innerText = '';
    matchCountBadge.style.display = 'none';
    
    loadingSpinner.classList.remove('hidden');

    const minAge = parseInt(document.getElementById('match-min-age').value);
    const maxAge = parseInt(document.getElementById('match-max-age').value);
    const genderPref = document.getElementById('match-gender').value;

    setTimeout(() => {
        loadingSpinner.classList.add('hidden');
        const matches = childrenData.filter(child => {
            const isAvail = child.status === 'Available';
            const ageValid = child.age >= minAge && child.age <= maxAge;
            const genderValid = genderPref === 'Any' || child.gender === genderPref;
            return isAvail && ageValid && genderValid;
        });

        if (matches.length > 0) {
            matchCountBadge.className = 'badge-pill available';
            matchCountBadge.innerText = `${matches.length} FOUND`;
            matchCountBadge.style.display = 'inline-flex';
        }

        renderChildrenGrid(matches, matchesGrid, noMatchesMsg, true, false);

    }, 800);
});

// --- Initial Setup ---
updateDashboard();
renderTimeline();
