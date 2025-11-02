// Global Variables
let simulationData = null;
let currentStepIndex = 0;
let isPlaying = false;
let playInterval = null;
let playSpeed = 1000;
let selectedAlgorithm = 'fifo';

// DOM Elements
const algoButtons = document.querySelectorAll('.algo-btn');
const modeButtons = document.querySelectorAll('.mode-btn');
const randomGroup = document.getElementById('randomGroup');
const customGroup = document.getElementById('customGroup');
const randomLength = document.getElementById('randomLength');
const randomMax = document.getElementById('randomMax');
const referenceString = document.getElementById('referenceString');
const frameCount = document.getElementById('frameCount');
const speedControl = document.getElementById('speedControl');
const speedValue = document.getElementById('speedValue');
const timeline = document.getElementById('timeline');
const currentStep = document.getElementById('currentStep');
const totalSteps = document.getElementById('totalSteps');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const playText = document.getElementById('playText');
const nextStepBtn = document.getElementById('nextStepBtn');
const prevStepBtn = document.getElementById('prevStepBtn');
const resetBtn = document.getElementById('resetBtn');
const simulateBtn = document.getElementById('simulateBtn');
const screenshotBtn = document.getElementById('screenshotBtn');
const exportBtn = document.getElementById('exportBtn');

// Algorithm Descriptions
const algorithmInfo = {
    fifo: {
        title: 'FIFO',
        description: 'First In First Out - The simplest page replacement algorithm. Pages are replaced in the order they were loaded into memory.'
    },
    lru: {
        title: 'LRU',
        description: 'Least Recently Used - Replaces the page that has not been accessed for the longest period of time.'
    },
    optimal: {
        title: 'Optimal',
        description: 'Optimal Page Replacement - Replaces the page that will not be used for the longest time in the future. This is theoretical.'
    },
    secondChance: {
        title: 'Second Chance (Clock)',
        description: 'Second Chance gives pages a second opportunity before replacement using a reference bit. Improves upon FIFO.'
    },
    lfu: {
        title: 'LFU',
        description: 'Least Frequently Used - Replaces the page with the lowest access frequency count.'
    }
};

// Function to generate random page reference string
function generateRandomPages(length, maxPage) {
    return Array.from({length}, () => Math.floor(Math.random() * maxPage) + 1);
}

// Event Listeners
algoButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        algoButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedAlgorithm = btn.dataset.algo;
        updateAlgorithmDescription();
    });
});

modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        if (mode === 'random') {
            randomGroup.classList.remove('hidden');
            customGroup.classList.add('hidden');
        } else {
            randomGroup.classList.add('hidden');
            customGroup.classList.remove('hidden');
        }
    });
});

speedControl.addEventListener('input', (e) => {
    const speed = parseFloat(e.target.value);
    speedValue.textContent = speed.toFixed(1) + 'x';
    playSpeed = 1000 / speed;
    if (isPlaying) {
        stopPlayback();
        startPlayback();
    }
});

timeline.addEventListener('input', (e) => {
    if (simulationData) {
        currentStepIndex = parseInt(e.target.value);
        displayStep(currentStepIndex);
    }
});

simulateBtn.addEventListener('click', startSimulation);
playPauseBtn.addEventListener('click', togglePlayback);
nextStepBtn.addEventListener('click', nextStep);
prevStepBtn.addEventListener('click', prevStep);
resetBtn.addEventListener('click', resetSimulation);
screenshotBtn.addEventListener('click', takeScreenshot);
exportBtn.addEventListener('click', exportTrace);

// Initialize
updateAlgorithmDescription();

function updateAlgorithmDescription() {
    const info = algorithmInfo[selectedAlgorithm];
    document.getElementById('algoTitle').textContent = info.title;
    document.getElementById('algoDesc').textContent = info.description;
}

function startSimulation() {
    const activeMode = document.querySelector('.mode-btn.active').dataset.mode;
    let pages, frames;

    if (activeMode === 'random') {
        // Generate random pages
        const length = parseInt(randomLength.value);
        const maxPage = parseInt(randomMax.value);
        
        if (length < 5 || length > 50) {
            alert('Reference string length must be between 5 and 50!');
            return;
        }
        
        if (maxPage < 3 || maxPage > 20) {
            alert('Max page number must be between 3 and 20!');
            return;
        }
        
        pages = generateRandomPages(length, maxPage);
        frames = parseInt(frameCount.value);
        
        console.log(`Generated sequence: ${pages.join(', ')}`);
    } else {
        // Custom input
        const inputString = referenceString.value.trim();
        if (!inputString) {
            alert('Please enter a reference string!');
            return;
        }
        pages = inputString.split(/[\s,]+/).map(Number);
        frames = parseInt(frameCount.value);
        
        if (pages.some(isNaN)) {
            alert('Please enter valid numbers!');
            return;
        }
    }

    if (frames < 1 || frames > 10) {
        alert('Frame count must be between 1 and 10!');
        return;
    }

    // Run simulation
    simulationData = runAlgorithm(selectedAlgorithm, pages, frames);
    currentStepIndex = 0;
    
    // Update UI
    timeline.max = simulationData.steps.length - 1;
    timeline.value = 0;
    timeline.disabled = false;
    totalSteps.textContent = simulationData.steps.length;
    
    // Display first step
    displayStep(0);
    
    // Enable controls
    playPauseBtn.disabled = false;
    nextStepBtn.disabled = false;
    prevStepBtn.disabled = false;
}

function runAlgorithm(algorithm, pages, frameCount) {
    switch(algorithm) {
        case 'fifo': return fifoAlgorithm(pages, frameCount);
        case 'lru': return lruAlgorithm(pages, frameCount);
        case 'optimal': return optimalAlgorithm(pages, frameCount);
        case 'secondChance': return secondChanceAlgorithm(pages, frameCount);
        case 'lfu': return lfuAlgorithm(pages, frameCount);
    }
}

// FIFO Algorithm
function fifoAlgorithm(pages, frameCount) {
    let frames = [];
    let pageFaults = 0;
    let pageHits = 0;
    let steps = [];
    let queue = [];
    
    pages.forEach((page, index) => {
        let isHit = frames.includes(page);
        let action = '';
        let replacedPage = null;
        
        if (isHit) {
            pageHits++;
            action = `HIT: Page ${page} already in memory`;
        } else {
            pageFaults++;
            if (frames.length < frameCount) {
                frames.push(page);
                queue.push(page);
                action = `INSERT: Page ${page} inserted into frame ${frames.length - 1}`;
            } else {
                replacedPage = queue.shift();
                const replaceIndex = frames.indexOf(replacedPage);
                frames[replaceIndex] = page;
                queue.push(page);
                action = `FAULT: Page ${page} replaced page ${replacedPage} in frame ${replaceIndex}`;
            }
        }
        
        steps.push({
            stepNumber: index + 1,
            page: page,
            frames: [...frames],
            queue: [...queue],
            result: isHit ? 'HIT' : 'FAULT',
            action: action,
            pageFaults: pageFaults,
            pageHits: pageHits,
            replacedPage: replacedPage
        });
    });
    
    return {
        steps,
        pageFaults,
        pageHits,
        totalReferences: pages.length,
        hitRatio: ((pageHits / pages.length) * 100).toFixed(1),
        frameCount: frameCount
    };
}

// LRU Algorithm
function lruAlgorithm(pages, frameCount) {
    let frames = [];
    let pageFaults = 0;
    let pageHits = 0;
    let steps = [];
    let recentlyUsed = [];
    
    pages.forEach((page, index) => {
        let isHit = frames.includes(page);
        let action = '';
        let replacedPage = null;
        
        if (isHit) {
            pageHits++;
            recentlyUsed = recentlyUsed.filter(p => p !== page);
            recentlyUsed.push(page);
            action = `HIT: Page ${page} accessed, moved to most recently used`;
        } else {
            pageFaults++;
            if (frames.length < frameCount) {
                frames.push(page);
                recentlyUsed.push(page);
                action = `INSERT: Page ${page} inserted into frame ${frames.length - 1}`;
            } else {
                replacedPage = recentlyUsed.shift();
                const replaceIndex = frames.indexOf(replacedPage);
                frames[replaceIndex] = page;
                recentlyUsed.push(page);
                action = `FAULT: Page ${page} replaced least recently used page ${replacedPage}`;
            }
        }
        
        steps.push({
            stepNumber: index + 1,
            page: page,
            frames: [...frames],
            queue: [...recentlyUsed],
            result: isHit ? 'HIT' : 'FAULT',
            action: action,
            pageFaults: pageFaults,
            pageHits: pageHits,
            replacedPage: replacedPage
        });
    });
    
    return {
        steps,
        pageFaults,
        pageHits,
        totalReferences: pages.length,
        hitRatio: ((pageHits / pages.length) * 100).toFixed(1),
        frameCount: frameCount
    };
}

// Optimal Algorithm
function optimalAlgorithm(pages, frameCount) {
    let frames = [];
    let pageFaults = 0;
    let pageHits = 0;
    let steps = [];
    
    pages.forEach((page, index) => {
        let isHit = frames.includes(page);
        let action = '';
        let replacedPage = null;
        
        if (isHit) {
            pageHits++;
            action = `HIT: Page ${page} already in memory`;
        } else {
            pageFaults++;
            if (frames.length < frameCount) {
                frames.push(page);
                action = `INSERT: Page ${page} inserted into frame ${frames.length - 1}`;
            } else {
                let farthest = -1;
                let replaceIndex = 0;
                
                frames.forEach((frame, frameIndex) => {
                    let nextUse = pages.slice(index + 1).indexOf(frame);
                    if (nextUse === -1) {
                        replaceIndex = frameIndex;
                        farthest = Infinity;
                    } else if (nextUse > farthest && farthest !== Infinity) {
                        farthest = nextUse;
                        replaceIndex = frameIndex;
                    }
                });
                
                replacedPage = frames[replaceIndex];
                frames[replaceIndex] = page;
                action = `FAULT: Page ${page} replaced page ${replacedPage} (optimal choice)`;
            }
        }
        
        steps.push({
            stepNumber: index + 1,
            page: page,
            frames: [...frames],
            queue: [...frames],
            result: isHit ? 'HIT' : 'FAULT',
            action: action,
            pageFaults: pageFaults,
            pageHits: pageHits,
            replacedPage: replacedPage
        });
    });
    
    return {
        steps,
        pageFaults,
        pageHits,
        totalReferences: pages.length,
        hitRatio: ((pageHits / pages.length) * 100).toFixed(1),
        frameCount: frameCount
    };
}

// Second Chance Algorithm
function secondChanceAlgorithm(pages, frameCount) {
    let frames = [];
    let referenceBits = [];
    let pointer = 0;
    let pageFaults = 0;
    let pageHits = 0;
    let steps = [];
    
    pages.forEach((page, index) => {
        const pageIndex = frames.indexOf(page);
        let action = '';
        let replacedPage = null;
        
        if (pageIndex !== -1) {
            pageHits++;
            referenceBits[pageIndex] = 1;
            action = `HIT: Page ${page} found, reference bit set to 1`;
        } else {
            pageFaults++;
            
            if (frames.length < frameCount) {
                frames.push(page);
                referenceBits.push(0);
                action = `INSERT: Page ${page} inserted into frame ${frames.length - 1}`;
            } else {
                while (referenceBits[pointer] === 1) {
                    referenceBits[pointer] = 0;
                    pointer = (pointer + 1) % frameCount;
                }
                
                replacedPage = frames[pointer];
                frames[pointer] = page;
                referenceBits[pointer] = 0;
                action = `FAULT: Page ${page} replaced page ${replacedPage} (second chance given)`;
                pointer = (pointer + 1) % frameCount;
            }
        }
        
        steps.push({
            stepNumber: index + 1,
            page: page,
            frames: [...frames],
            queue: [...frames],
            result: pageIndex !== -1 ? 'HIT' : 'FAULT',
            action: action,
            pageFaults: pageFaults,
            pageHits: pageHits,
            replacedPage: replacedPage
        });
    });
    
    return {
        steps,
        pageFaults,
        pageHits,
        totalReferences: pages.length,
        hitRatio: ((pageHits / pages.length) * 100).toFixed(1),
        frameCount: frameCount
    };
}

// LFU Algorithm
function lfuAlgorithm(pages, frameCount) {
    let frames = [];
    let frequency = new Map();
    let pageFaults = 0;
    let pageHits = 0;
    let steps = [];
    
    pages.forEach((page, index) => {
        let isHit = frames.includes(page);
        let action = '';
        let replacedPage = null;
        
        if (isHit) {
            pageHits++;
            frequency.set(page, (frequency.get(page) || 0) + 1);
            action = `HIT: Page ${page} frequency increased to ${frequency.get(page)}`;
        } else {
            pageFaults++;
            
            if (frames.length < frameCount) {
                frames.push(page);
                frequency.set(page, 1);
                action = `INSERT: Page ${page} inserted into frame ${frames.length - 1}`;
            } else {
                let minFreq = Infinity;
                let lfuPage = frames[0];
                
                frames.forEach(frame => {
                    const freq = frequency.get(frame) || 0;
                    if (freq < minFreq) {
                        minFreq = freq;
                        lfuPage = frame;
                    }
                });
                
                const replaceIndex = frames.indexOf(lfuPage);
                replacedPage = lfuPage;
                frames[replaceIndex] = page;
                frequency.delete(lfuPage);
                frequency.set(page, 1);
                action = `FAULT: Page ${page} replaced least frequently used page ${replacedPage}`;
            }
        }
        
        steps.push({
            stepNumber: index + 1,
            page: page,
            frames: [...frames],
            queue: [...frames],
            result: isHit ? 'HIT' : 'FAULT',
            action: action,
            pageFaults: pageFaults,
            pageHits: pageHits,
            replacedPage: replacedPage
        });
    });
    
    return {
        steps,
        pageFaults,
        pageHits,
        totalReferences: pages.length,
        hitRatio: ((pageHits / pages.length) * 100).toFixed(1),
        frameCount: frameCount
    };
}

// Display Functions
function displayStep(stepIndex) {
    if (!simulationData || stepIndex < 0 || stepIndex >= simulationData.steps.length) return;
    
    const step = simulationData.steps[stepIndex];
    currentStepIndex = stepIndex;
    
    // Update timeline
    timeline.value = stepIndex;
    currentStep.textContent = stepIndex + 1;
    
    // Update memory frames
    displayMemoryFrames(step);
    
    // Update queue
    displayQueue(step);
    
    // Update statistics
    updateStatistics(step);
    
    // Update step information
    updateStepInfo(step);
}

function displayMemoryFrames(step) {
    const memoryFrames = document.getElementById('memoryFrames');
    memoryFrames.innerHTML = '';
    
    const frameCount = simulationData.frameCount;
    
    for (let i = 0; i < frameCount; i++) {
        const frameBox = document.createElement('div');
        frameBox.className = 'frame-box';
        
        const value = step.frames[i];
        
        if (value !== undefined) {
            if (step.result === 'HIT' && value === step.page) {
                frameBox.classList.add('hit');
            } else if (step.result === 'FAULT' && value === step.page) {
                frameBox.classList.add('fault');
            } else {
                frameBox.classList.add('normal');
            }
            
            frameBox.innerHTML = `
                <div class="frame-label">Frame ${i}</div>
                <div class="frame-value">${value}</div>
            `;
        } else {
            frameBox.classList.add('empty');
            frameBox.innerHTML = `
                <div class="frame-label">Frame ${i}</div>
                <div class="frame-value">-</div>
            `;
        }
        
        memoryFrames.appendChild(frameBox);
    }
}

function displayQueue(step) {
    const queueDisplay = document.getElementById('queueDisplay');
    queueDisplay.innerHTML = '';
    
    if (step.queue && step.queue.length > 0) {
        step.queue.forEach(page => {
            const queueItem = document.createElement('div');
            queueItem.className = 'queue-item';
            queueItem.textContent = page;
            queueDisplay.appendChild(queueItem);
        });
    } else {
        queueDisplay.innerHTML = '<p style="color: var(--text-secondary);">Empty</p>';
    }
}

function updateStatistics(step) {
    document.getElementById('statFaults').textContent = step.pageFaults;
    document.getElementById('statHitRate').textContent = 
        ((step.pageHits / step.stepNumber) * 100).toFixed(1) + '%';
    
    const utilization = (step.frames.length / simulationData.frameCount * 100).toFixed(0);
    document.getElementById('statUtilization').textContent = utilization + '%';
    document.getElementById('statTotal').textContent = step.stepNumber;
}

function updateStepInfo(step) {
    const stepInfo = document.getElementById('stepInfo');
    
    let infoHTML = `
        <p><strong>Step ${step.stepNumber}:</strong> Accessing page <strong style="color: var(--color-primary);">${step.page}</strong></p>
        <p><strong>Action:</strong> ${step.action}</p>
        <p><strong>Result:</strong> <span class="${step.result === 'HIT' ? 'hit' : 'fault'}" style="padding: 4px 12px; border-radius: 12px; font-weight: bold;">
            ${step.result}
        </span></p>
    `;
    
    if (step.replacedPage !== null) {
        infoHTML += `<p><strong>Replaced:</strong> Page ${step.replacedPage}</p>`;
    }
    
    infoHTML += `
        <p style="margin-top: 10px; color: var(--text-secondary);">
            <strong>Memory Frames:</strong> [${step.frames.join(', ')}]
        </p>
    `;
    
    stepInfo.innerHTML = infoHTML;
}

// Playback Controls
function togglePlayback() {
    if (isPlaying) {
        stopPlayback();
    } else {
        startPlayback();
    }
}

function startPlayback() {
    if (!simulationData) return;
    
    isPlaying = true;
    playIcon.textContent = '⏸';
    playText.textContent = 'Pause';
    playPauseBtn.classList.add('active');
    
    playInterval = setInterval(() => {
        if (currentStepIndex < simulationData.steps.length - 1) {
            nextStep();
        } else {
            stopPlayback();
        }
    }, playSpeed);
}

function stopPlayback() {
    isPlaying = false;
    playIcon.textContent = '▶';
    playText.textContent = 'Play';
    playPauseBtn.classList.remove('active');
    
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
    }
}

function nextStep() {
    if (!simulationData) return;
    
    if (currentStepIndex < simulationData.steps.length - 1) {
        displayStep(currentStepIndex + 1);
    }
}

function prevStep() {
    if (!simulationData) return;
    
    if (currentStepIndex > 0) {
        displayStep(currentStepIndex - 1);
    }
}

function resetSimulation() {
    stopPlayback();
    
    if (simulationData) {
        currentStepIndex = 0;
        displayStep(0);
    }
    
    timeline.value = 0;
    currentStep.textContent = '0';
}

// Export Functions
function takeScreenshot() {
    alert('Screenshot feature: Use your browser\'s screenshot tool (Ctrl+Shift+S in Firefox) or integrate html2canvas library for automatic screenshots.');
}

function exportTrace() {
    if (!simulationData) {
        alert('No simulation data to export!');
        return;
    }
    
    let csvContent = 'Step,Page,Result,Frames,Action\n';
    
    simulationData.steps.forEach(step => {
        const frames = step.frames.join('|');
        const action = step.action.replace(/,/g, ';');
        csvContent += `${step.stepNumber},${step.page},${step.result},"${frames}","${action}"\n`;
    });
    
    csvContent += `\nSummary\n`;
    csvContent += `Total References,${simulationData.totalReferences}\n`;
    csvContent += `Page Faults,${simulationData.pageFaults}\n`;
    csvContent += `Page Hits,${simulationData.pageHits}\n`;
    csvContent += `Hit Ratio,${simulationData.hitRatio}%\n`;
    csvContent += `Algorithm,${selectedAlgorithm.toUpperCase()}\n`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `page_replacement_${selectedAlgorithm}_trace.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!simulationData) return;
    
    switch(e.key) {
        case 'ArrowRight':
            nextStep();
            break;
        case 'ArrowLeft':
            prevStep();
            break;
        case ' ':
            e.preventDefault();
            togglePlayback();
            break;
        case 'r':
        case 'R':
            resetSimulation();
            break;
    }
});

console.log('OS Memory Simulator loaded successfully! 🚀');
console.log('Keyboard shortcuts: Arrow Keys, Spacebar, R');
