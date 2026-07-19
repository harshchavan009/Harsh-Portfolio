// Harsh Chavan Portfolio Scripts
// Vanilla JS, Three.js, LeetCode & GitHub APIs integration

document.addEventListener("DOMContentLoaded", () => {
  initThreeDuality();
  initTiltCards();
  fetchGitHubRepos();
  fetchLeetCodeStats();
  initContactForm();
  initInteractiveTerminal();
  initScrollTracker();
  initScrollReveal();
  initFloatingGlyphs();
});

/* =========================================================================
   1. THREE.JS MORPHING ENGINE (Circuit-to-Neural-Network Duality)
   ========================================================================= */
function initThreeDuality() {
  const container = document.getElementById("three-canvas-container");
  if (!container) return;

  // Accessibility Check: respects reduced motion
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    container.innerHTML = `<div class="absolute inset-0 bg-gradient-to-tr from-brass-accent/5 to-transparent pointer-events-none"></div>`;
    return;
  }

  // Helper to draw soft circular dots
  function createCircleTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
  }

  // Setup Three.js Scene
  const scene = new THREE.Scene();
  
  // Calculate robust starting dimensions (preventing 0 width/height failures)
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  // Perspective Camera
  const camera = new THREE.PerspectiveCamera(
    45, 
    width / height, 
    0.1, 
    100
  );
  camera.position.z = 8;

  // WebGL Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  container.appendChild(renderer.domElement);

  // Group to hold all objects (nodes + lines)
  const mainGroup = new THREE.Group();
  scene.add(mainGroup);

  // Node configuration
  const nodeCount = 80;
  
  // Base coordinates arrays
  const posA = new Float32Array(nodeCount * 3); // State A: Ladder Logic Grid
  const posB = new Float32Array(nodeCount * 3); // State B: Neural Network Layers
  const currentPos = new Float32Array(nodeCount * 3); // Active runtime coordinates

  // Generate Coordinates for State A (Ladder Logic - Flat Grid)
  // 5 rungs, 16 nodes per rung
  for (let i = 0; i < nodeCount; i++) {
    const rung = Math.floor(i / 16); // 0 to 4
    const col = i % 16;             // 0 to 15
    const idx = i * 3;

    // Arrange as horizontal parallel rungs
    posA[idx] = (col - 7.5) * 0.75;           // X
    posA[idx + 1] = (rung - 2) * 1.1;         // Y
    posA[idx + 2] = (Math.random() - 0.5) * 0.05; // Z (nearly flat)
  }

  // Generate Coordinates for State B (Neural Network - Layered 3D Clusters)
  // Input (16), Hidden 1 (24), Hidden 2 (24), Output (16)
  for (let i = 0; i < nodeCount; i++) {
    const idx = i * 3;
    let x = 0;
    let y = 0;
    let z = (Math.random() - 0.5) * 1.8; // z-depth spacing

    if (i < 16) {
      // Input Layer
      x = -3.8;
      y = (i - 7.5) * 0.35;
    } else if (i < 40) {
      // Hidden Layer 1
      x = -1.2;
      const localIdx = i - 16;
      y = (localIdx - 11.5) * 0.25;
    } else if (i < 64) {
      // Hidden Layer 2
      x = 1.2;
      const localIdx = i - 40;
      y = (localIdx - 11.5) * 0.25;
    } else {
      // Output Layer
      x = 3.8;
      const localIdx = i - 64;
      y = (localIdx - 7.5) * 0.35;
    }

    posB[idx] = x;
    posB[idx + 1] = y;
    posB[idx + 2] = z;
  }

  // Initialize active coordinates to State A
  for (let i = 0; i < nodeCount * 3; i++) {
    currentPos[i] = posA[i];
  }

  // Set up connected line pairs (Indices)
  // We establish lines representing horizontal rungs and rails in State A
  // In State B, these same indices stretch across layers, twisting into network connections
  const lineIndices = [];
  
  // 1. Horizontal connections (rungs)
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 15; c++) {
      const nodeI = r * 16 + c;
      lineIndices.push(nodeI, nodeI + 1);
    }
  }

  // 2. Vertical connections (coils, contacts, rail borders)
  for (let r = 0; r < 4; r++) {
    // Left boundary rail
    lineIndices.push(r * 16, (r + 1) * 16);
    // Right boundary rail
    lineIndices.push(r * 16 + 15, (r + 1) * 16 + 15);
    
    // Vertical contacts spaced along columns
    const contactCols = [3, 7, 11];
    contactCols.forEach(col => {
      const nodeI = r * 16 + col;
      lineIndices.push(nodeI, nodeI + 16);
    });
  }

  // Create Node points mesh
  const pointsGeometry = new THREE.BufferGeometry();
  pointsGeometry.setAttribute("position", new THREE.BufferAttribute(currentPos, 3));

  // Visual styled shader material for Node Points (Glowing Terminals)
  const pointsMaterial = new THREE.PointsMaterial({
    color: 0xC69749, // Brass/Gold
    size: 0.26,
    map: createCircleTexture(),
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending // glowing nodes
  });

  const nodePoints = new THREE.Points(pointsGeometry, pointsMaterial);
  mainGroup.add(nodePoints);

  // Create Connection Lines mesh
  const linePositions = new Float32Array(lineIndices.length * 3);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xC69749,
    transparent: true,
    opacity: 0.38, // highly visible connections
    depthWrite: false
  });

  const connectionLines = new THREE.LineSegments(lineGeometry, lineMaterial);
  mainGroup.add(connectionLines);

  // Mouse interactivity coordinates tracking
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  window.addEventListener("mousemove", (e) => {
    targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // Render & Animation Loop
  let scrollPercent = 0;
  let currentT = 0;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // Scroll interpolation tracking
    const scrollY = window.scrollY;
    const maxScroll = window.innerHeight * 0.8;
    scrollPercent = Math.min(1, Math.max(0, scrollY / maxScroll));
    
    // Smooth easing interpolation for t (morph factor)
    currentT += (scrollPercent - currentT) * 0.1;

    // Fade fixed background canvas as scroll value increases to preserve text legibility
    const fadeStart = 100;
    const fadeEnd = window.innerHeight * 1.2;
    let canvasOpacity = 0.6;
    if (scrollY > fadeStart) {
      const fraction = (scrollY - fadeStart) / (fadeEnd - fadeStart);
      canvasOpacity = 0.6 - fraction * 0.45; // fade down to 0.15
      canvasOpacity = Math.max(0.15, canvasOpacity);
    }
    container.style.opacity = canvasOpacity;

    // Update progress indicator on the right hero dashboard
    const progressBar = document.getElementById("hero-progress-bar");
    if (progressBar) {
      progressBar.style.width = (currentT * 100) + "%";
    }

    // Interpolate node positions between State A (0) and State B (1)
    const posAttr = pointsGeometry.attributes.position;
    for (let i = 0; i < nodeCount; i++) {
      const idx = i * 3;
      
      // Calculate morph
      const targetX = posA[idx] * (1 - currentT) + posB[idx] * currentT;
      const targetY = posA[idx + 1] * (1 - currentT) + posB[idx + 1] * currentT;
      const targetZ = posA[idx + 2] * (1 - currentT) + posB[idx + 2] * currentT;

      // Add dynamic float drift in 3D
      const driftX = Math.sin(time * 0.4 + i) * 0.05 * currentT;
      const driftY = Math.cos(time * 0.4 + i) * 0.05 * currentT;

      currentPos[idx] = targetX + driftX;
      currentPos[idx + 1] = targetY + driftY;
      currentPos[idx + 2] = targetZ;
    }
    posAttr.needsUpdate = true;

    // Update lines based on updated node positions
    const linePosAttr = lineGeometry.attributes.position;
    let linePosIdx = 0;
    for (let i = 0; i < lineIndices.length; i++) {
      const nodeIndex = lineIndices[i];
      const nodeCoordIdx = nodeIndex * 3;
      linePositions[linePosIdx++] = currentPos[nodeCoordIdx];
      linePositions[linePosIdx++] = currentPos[nodeCoordIdx + 1];
      linePositions[linePosIdx++] = currentPos[nodeCoordIdx + 2];
    }
    linePosAttr.needsUpdate = true;

    // Eased mouse-parallax rotations
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    // Slowly rotate group, skewing slightly via mouse pointer
    mainGroup.rotation.y = time * 0.03 + mouseX * 0.15;
    mainGroup.rotation.x = mouseY * 0.1;

    renderer.render(scene, camera);
  }

  // Handle Resize events
  window.addEventListener("resize", () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  animate();
}

/* =========================================================================
   2. CURATED PROJECTS 3D HOVER TILT
   ========================================================================= */
function initTiltCards() {
  const cards = document.querySelectorAll(".tilt-card");
  
  cards.forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      
      // Maximum 6 degrees tilt
      const rotateY = (x - xc) / (rect.width / 12);
      const rotateX = -(y - yc) / (rect.height / 12);
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
  });
}

/* =========================================================================
   3. GITHUB REPOSITORIES DYNAMIC SYNC
   ========================================================================= */
async function fetchGitHubRepos() {
  const grid = document.getElementById("github-repo-grid");
  if (!grid) return;

  try {
    const response = await fetch("https://api.github.com/users/harshchavan009/repos?sort=updated&per_page=100");
    if (!response.ok) throw new Error("GitHub API unreachable");
    const data = await response.json();

    if (!Array.isArray(data)) throw new Error("Invalid payload format");

    // Filter out forks and sort by pushed/updated timestamp
    const activeRepos = data
      .filter(repo => !repo.fork)
      .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());

    // Slice first 6 repositories
    const displayRepos = activeRepos.slice(0, 6);

    grid.innerHTML = ""; // Clear loader skeletons

    if (displayRepos.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-8 text-center text-xs font-mono text-text-slate">NO PUBLIC SYSTEM REPOSITORIES DETECTED</div>`;
      return;
    }

    displayRepos.forEach(repo => {
      const date = new Date(repo.pushed_at || repo.updated_at);
      const formattedDate = getRelativeTime(date);
      const language = repo.language || "Markdown";
      const langColor = getLanguageColor(language);

      const card = document.createElement("div");
      card.className = "tilt-card glass-panel chip-card p-6 rounded flex flex-col justify-between h-[230px] transition-all duration-300";
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="font-mono text-[9px] text-text-slate flex items-center gap-1.5">
              <span class="inline-block w-1.5 h-1.5 rounded-full" style="background-color: ${langColor}"></span>
              ${language.toUpperCase()}
            </span>
            <div class="flex items-center gap-3 font-mono text-[9px] text-text-slate">
              <span class="flex items-center gap-1">
                <svg class="w-3 h-3 text-brass-accent/80" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.17 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                ${repo.stargazers_count}
              </span>
            </div>
          </div>
          <h3 class="text-sm font-sans font-bold text-text-ivory mb-2 truncate hover:text-brass-accent transition-colors">
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
          </h3>
          <p class="text-xs text-text-slate leading-relaxed line-clamp-3 font-sans">
            ${repo.description || "No project description provided in repository logs."}
          </p>
        </div>
        <div class="flex items-center justify-between pt-4 border-t border-border-dark/30 font-mono text-[9px] text-text-slate">
          <span class="uppercase">Updated: ${formattedDate}</span>
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="text-brass-accent hover:text-text-ivory transition-colors uppercase tracking-widest flex items-center gap-1">
            CODE
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
        </div>
      `;
      grid.appendChild(card);
    });

    // Re-bind the 3D mouse tilt handlers to include newly rendered cards
    initTiltCards();
  } catch (err) {
    console.warn("GitHub dynamic repo sync failed. Rendering fallback link:", err);
    grid.innerHTML = `
      <div class="col-span-full py-12 border border-border-dark/60 bg-card-dark/30 rounded text-center">
        <p class="font-mono text-xs text-text-slate mb-4">COULD NOT ESTABLISH LINK TO DYNAMIC REPOSITORY LOGS</p>
        <a href="https://github.com/harshchavan009" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-5 py-2.5 border border-brass-accent/30 text-brass-accent font-mono text-[10px] uppercase tracking-widest rounded hover:bg-brass-accent/5 transition-all">
          View Projects directly on GitHub
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </a>
      </div>
    `;
  }
}

// Relative time calculation helper
function getRelativeTime(date) {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) return "today";
  if (diffDays <= 7) return `${diffDays} days ago`;
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Minimal language color mapper
function getLanguageColor(lang) {
  const colors = {
    Python: "#3572A5",
    JavaScript: "#f1e05a",
    Java: "#b07219",
    HTML: "#e34c26",
    CSS: "#563d7c",
    TypeScript: "#3178c6",
    C: "#555555",
    "C++": "#f34b7d",
  };
  return colors[lang] || "#8b8b8b";
}

/* =========================================================================
   4. LEETCODE METRICS TELEMETRY
   ========================================================================= */
async function fetchLeetCodeStats() {
  const container = document.getElementById("leetcode-container");
  if (!container) return;

  const username = "ChavanHarshSantosh";
  const api1 = `https://leetcode-stats-api.herokuapp.com/${username}`;
  const api2 = `https://alfa-leetcode-api.onrender.com/${username}/solved`;

  try {
    // Attempt Primary API
    const response = await fetch(api1);
    if (!response.ok) throw new Error("Primary API failed");
    const data = await response.json();

    if (data.status !== "success") throw new Error("Invalid user status returned");

    renderLeetCode(container, {
      solved: data.totalSolved,
      total: data.totalQuestions,
      easy: data.easySolved,
      easyTotal: data.totalEasy,
      medium: data.mediumSolved,
      mediumTotal: data.totalMedium,
      hard: data.hardSolved,
      hardTotal: data.totalHard,
      acceptance: data.acceptanceRate,
      rank: data.ranking,
    });
  } catch (err) {
    console.warn("LeetCode primary stats fetch failed. Retrying fallback api:", err);
    try {
      // Attempt Fallback API
      const fallbackResponse = await fetch(api2);
      if (!fallbackResponse.ok) throw new Error("Fallback API failed");
      const fallbackData = await fallbackResponse.json();

      // Alfa API returns a slightly different structure:
      // { solvedProblem: 250, easySolved: 100, ... }
      renderLeetCode(container, {
        solved: fallbackData.solvedProblem || 0,
        total: 3100, // Approximate total question pool
        easy: fallbackData.easySolved || 0,
        easyTotal: 800,
        medium: fallbackData.mediumSolved || 0,
        mediumTotal: 1600,
        hard: fallbackData.hardSolved || 0,
        hardTotal: 700,
        acceptance: 50.5, // Fallback placeholder
        rank: 0,          // Not provided in simple solved payload
      });
    } catch (fallbackErr) {
      console.error("All LeetCode APIs failed. Rendering profile link:", fallbackErr);
      renderLeetCodeFallback(container);
    }
  }
}

function renderLeetCode(container, stats) {
  // Calculate percentages
  const easyPct = Math.round((stats.easy / stats.easyTotal) * 100) || 0;
  const medPct = Math.round((stats.medium / stats.mediumTotal) * 100) || 0;
  const hardPct = Math.round((stats.hard / stats.hardTotal) * 100) || 0;
  const rankStr = stats.rank > 0 ? stats.rank.toLocaleString() : "ACTIVE";

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
      
      <!-- Circle summary metrics -->
      <div class="md:col-span-4 flex flex-col items-center justify-center text-center md:border-r border-border-dark/40 pr-0 md:pr-8 py-4">
        <div class="relative w-28 h-28 flex items-center justify-center rounded-full border border-brass-accent/15">
          <div class="text-center">
            <div class="text-2xl font-mono font-bold text-brass-accent">${stats.solved}</div>
            <div class="text-[9px] font-mono uppercase text-text-slate">SOLVED</div>
          </div>
        </div>
        <div class="mt-4 font-mono text-[10px] text-text-slate leading-relaxed">
          RANK: <span class="text-text-ivory">${rankStr}</span> <br>
          ACCEPTANCE: <span class="text-text-ivory">${stats.acceptance}%</span>
        </div>
      </div>

      <!-- Difficulty distribution progress bars -->
      <div class="md:col-span-8 space-y-4">
        
        <!-- Easy Difficulty -->
        <div>
          <div class="flex justify-between items-center text-xs font-mono text-text-slate mb-1">
            <span>EASY // SYSTEMS BASIC</span>
            <span>${stats.easy}/${stats.easyTotal}</span>
          </div>
          <div class="w-full h-2 bg-bg-dark border border-border-dark/60 rounded-full overflow-hidden">
            <div class="leetcode-bar h-full bg-emerald-500/80 rounded-full" style="width: 0%" data-width="${easyPct}%"></div>
          </div>
        </div>

        <!-- Medium Difficulty -->
        <div>
          <div class="flex justify-between items-center text-xs font-mono text-text-slate mb-1">
            <span>MEDIUM // GRAPH ALGORITHMS</span>
            <span>${stats.medium}/${stats.mediumTotal}</span>
          </div>
          <div class="w-full h-2 bg-bg-dark border border-border-dark/60 rounded-full overflow-hidden">
            <div class="leetcode-bar h-full bg-amber-500/80 rounded-full" style="width: 0%" data-width="${medPct}%"></div>
          </div>
        </div>

        <!-- Hard Difficulty -->
        <div>
          <div class="flex justify-between items-center text-xs font-mono text-text-slate mb-1">
            <span>HARD // OPTIMIZATION RUNS</span>
            <span>${stats.hard}/${stats.hardTotal}</span>
          </div>
          <div class="w-full h-2 bg-bg-dark border border-border-dark/60 rounded-full overflow-hidden">
            <div class="leetcode-bar h-full bg-rose-500/80 rounded-full" style="width: 0%" data-width="${hardPct}%"></div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Trigger anim width after layout render
  setTimeout(() => {
    const bars = container.querySelectorAll(".leetcode-bar");
    bars.forEach(bar => {
      const targetWidth = bar.getAttribute("data-width");
      if (targetWidth) {
        bar.style.width = targetWidth;
      }
    });
  }, 100);
}

function renderLeetCodeFallback(container) {
  container.innerHTML = `
    <div class="text-center py-6">
      <p class="font-mono text-xs text-text-slate mb-4">LIVE LEETCODE TELEMETRY UNREACHABLE AT THIS TIME</p>
      <a href="https://leetcode.com/u/ChavanHarshSantosh" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-5 py-2.5 border border-brass-accent/30 text-brass-accent font-mono text-[10px] uppercase tracking-widest rounded hover:bg-brass-accent/5 transition-all">
        Inspect statistics on LeetCode
        <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
      </a>
    </div>
  `;
}

/* =========================================================================
   5. DYNAMIC FORM SUBMISSIONS (confetti triggers)
   ========================================================================= */
function initContactForm() {
  const form = document.getElementById("contact-form");
  const feedback = document.getElementById("form-feedback");
  if (!form || !feedback) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    feedback.className = "p-4 rounded border text-xs font-mono mb-4 text-brass-accent border-brass-accent/20 bg-brass-accent/5";
    feedback.innerText = "TRANSMITTING MESSAGE LOGS...";
    feedback.classList.remove("hidden");

    try {
      // In production, this targets endpoints like Formspree or EmailJS
      // We will perform local simulation for the static page:
      await new Promise(resolve => setTimeout(resolve, 1000));

      feedback.className = "p-4 rounded border text-xs font-mono mb-4 text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
      feedback.innerText = "SYS_TRANSMISSION: SUCCESSFUL. LOG RECEIVED.";
      form.reset();

      // Trigger Confetti blast on success
      if (typeof confetti === "function") {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#C69749", "#F2EFE9", "#2B2E34"],
        });
      }
    } catch (err) {
      feedback.className = "p-4 rounded border text-xs font-mono mb-4 text-rose-400 border-rose-500/20 bg-rose-500/5";
      feedback.innerText = "SYS_TRANSMISSION: FAILED. ROUTE BROKEN.";
    }
  });
}

/* =========================================================================
   6. INTERACTIVE COMMAND TERMINAL
   ========================================================================= */
function initInteractiveTerminal() {
  const terminalInput = document.getElementById("terminal-input");
  const terminalOutput = document.getElementById("terminal-output");
  const terminalScreen = document.getElementById("terminal-screen");
  if (!terminalInput || !terminalOutput || !terminalScreen) return;

  const commands = {
    "/help": `Available commands: <br>
      <span class="text-brass-accent">/about</span> - Bio & background context <br>
      <span class="text-brass-accent">/projects</span> - Summary of system works <br>
      <span class="text-brass-accent">/skills</span> - Core engineering tech stack <br>
      <span class="text-brass-accent">/contact</span> - Get direct transmission details <br>
      <span class="text-brass-accent">/clear</span> - Clear logs`,
    "/about": `<strong>Harsh Chavan</strong> is a rare hybrid systems engineer. <br>
      Academic base: B.Tech CSE (AI/ML) at Parul University (2024-2028). <br>
      Core focus: Bridging deterministic industrial logic (Siemens PLC ladder logic) and generative intelligence architectures (Multi-Agent RAG).`,
    "/projects": `<strong>Featured System Integrations:</strong> <br>
      1. <span class="text-brass-accent">Enterprise Multi-Agent Graph RAG</span> - LangGraph + Neo4j reasoning engine.<br>
      2. <span class="text-brass-accent">AI-Integrated PLC Compiler</span> - automating S7-1500 LAD generation via byLLM prompt frameworks.<br>
      3. <span class="text-brass-accent">EcoVision AI</span> - waste classification pipeline containerized with Docker.`,
    "/skills": `<strong>Core Engineering Stack:</strong> <br>
      - Languages: Python, Java, C++, SQL, JS <br>
      - AI / GenAI: LLMs, LangGraph, RAG, Prompt Engineering, byLLM <br>
      - Environment: Docker, Azure, Linux, Git, Postman`,
    "/contact": `<strong>Transmission Details:</strong> <br>
      - Email: <a href="mailto:harshchavan1030@gmail.com" class="underline hover:text-brass-accent">harshchavan1030@gmail.com</a> <br>
      - Phone: +91 8208701176 <br>
      - LinkedIn: harsh-chavan-5804a5344 <br>
      - GitHub: harshchavan009`,
  };

  terminalInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const rawInput = terminalInput.value.trim();
      if (!rawInput) return;

      const cmd = rawInput.toLowerCase();
      
      // Append entered command
      const cmdLine = document.createElement("p");
      cmdLine.className = "text-text-ivory font-bold mt-2";
      cmdLine.innerHTML = `sys_guest$ ${rawInput}`;
      terminalOutput.appendChild(cmdLine);

      // Process command
      const responseLine = document.createElement("p");
      responseLine.className = "text-text-slate text-[9px] mt-1 pl-2 border-l border-border-dark/60 leading-relaxed";

      if (cmd === "/clear") {
        terminalOutput.innerHTML = `<p class="text-brass-accent font-bold">// HARSH_CHAVAN_SYS LOGS CLEARED</p>`;
      } else if (commands[cmd]) {
        responseLine.innerHTML = commands[cmd];
        terminalOutput.appendChild(responseLine);
      } else {
        responseLine.innerHTML = `Command not recognized: <span class="text-rose-400 font-bold">${rawInput}</span>. Type <span class="text-brass-accent">/help</span> for assistance.`;
        terminalOutput.appendChild(responseLine);
      }

      // Reset & scroll
      terminalInput.value = "";
      setTimeout(() => {
        terminalScreen.scrollTop = terminalScreen.scrollHeight;
      }, 20);
    }
  });

  // Keep terminal input focused when clicking the container
  terminalScreen.parentNode.addEventListener("click", () => {
    terminalInput.focus();
  });
}

/* =========================================================================
   7. SCHEMATIC SCROLL RAIL TRACKER
   ========================================================================= */
function initScrollTracker() {
  const dot = document.getElementById("schematic-tracker-dot");
  if (!dot) return;

  window.addEventListener("scroll", () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const scrollPct = (window.scrollY / docHeight) * 100;
    dot.style.top = scrollPct + "%";
  });
}

/* =========================================================================
   8. SCROLL REVEAL OBSERVER (Framer-like transitions)
   ========================================================================= */
function initScrollReveal() {
  const reveals = document.querySelectorAll(".reveal-on-scroll");
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
      }
    });
  }, {
    threshold: 0.08, // trigger when 8% visible
    rootMargin: "0px 0px -40px 0px"
  });

  reveals.forEach(el => observer.observe(el));
}

/* =========================================================================
   9. FLOATING BG GLYPHS (AI Emojis & Code elements)
   ========================================================================= */
function initFloatingGlyphs() {
  const container = document.createElement("div");
  container.className = "fixed inset-0 pointer-events-none z-[-5] overflow-hidden";
  document.body.appendChild(container);

  // Diverse mix of AI emojis, code syntax, and industrial logic tokens
  const glyphs = ["🧠", "🤖", "⚡", "{ }", "[]", "=>", "01", "10", "TON", "PLC", "SYS", "LLM", "RAG", "< />"];
  
  for (let i = 0; i < 22; i++) {
    const el = document.createElement("div");
    const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
    el.innerText = glyph;
    
    // Position/sizing parameters
    const size = Math.random() * 24 + 14;      // 14px to 38px
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const duration = Math.random() * 35 + 25; // 25s to 60s
    const delay = Math.random() * -45;        // negative offset to kick off immediate drift
    const opacity = Math.random() * 0.12 + 0.05; // 5% to 17% visibility

    el.className = "absolute font-mono font-bold text-brass-accent/30 select-none pointer-events-none";
    el.style.left = `${left}%`;
    el.style.top = `${top}%`;
    el.style.fontSize = `${size}px`;
    el.style.setProperty("--op-target", opacity);
    el.style.animation = `float-drift ${duration}s linear infinite`;
    el.style.animationDelay = `${delay}s`;
    
    container.appendChild(el);
  }
}
