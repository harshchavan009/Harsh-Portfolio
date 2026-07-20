// Harsh Chavan Portfolio Scripts
// Vanilla JS, Three.js, GitHub API Integration & Theme Toggling

document.addEventListener("DOMContentLoaded", () => {
  initThreeDuality();
  initThemeToggle();
  initMobileNav();
  initTiltCards();
  fetchGitHubRepos();
  initScrollReveal();
  initFloatingGlyphs();
  initActiveNavHighlight();
  initLeetcodeBars();
});

/* =========================================================================
   1. THREE.JS MORPHING ENGINE (Circuit-to-Neural-Network Duality)
   ========================================================================= */
function initThreeDuality() {
  const container = document.getElementById("three-canvas-container");
  if (!container) return;

  // Respect reduced motion
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    container.innerHTML = "";
    return;
  }

  // Draw soft circular dots
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

  const scene = new THREE.Scene();
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 8;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  container.appendChild(renderer.domElement);

  const mainGroup = new THREE.Group();
  scene.add(mainGroup);

  const nodeCount = 80;
  const posA = new Float32Array(nodeCount * 3); // Ladder Logic state
  const posB = new Float32Array(nodeCount * 3); // Neural network state
  const currentPos = new Float32Array(nodeCount * 3);

  // Generate Ladder Logic Coordinates (Grid Layout)
  for (let i = 0; i < nodeCount; i++) {
    const rung = Math.floor(i / 16);
    const col = i % 16;
    const idx = i * 3;
    posA[idx] = (col - 7.5) * 0.75;
    posA[idx + 1] = (rung - 2) * 1.1;
    posA[idx + 2] = (Math.random() - 0.5) * 0.05;
  }

  // Generate Neural Network Coordinates (Layered Layer Layout)
  for (let i = 0; i < nodeCount; i++) {
    const idx = i * 3;
    let x = 0; let y = 0;
    let z = (Math.random() - 0.5) * 1.8;
    if (i < 16) {
      x = -3.8;
      y = (i - 7.5) * 0.35;
    } else if (i < 40) {
      x = -1.2;
      y = ((i - 16) - 11.5) * 0.25;
    } else if (i < 64) {
      x = 1.2;
      y = ((i - 40) - 11.5) * 0.25;
    } else {
      x = 3.8;
      y = ((i - 64) - 7.5) * 0.35;
    }
    posB[idx] = x;
    posB[idx + 1] = y;
    posB[idx + 2] = z;
  }

  for (let i = 0; i < nodeCount * 3; i++) {
    currentPos[i] = posA[i];
  }

  const lineIndices = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 15; c++) {
      const n = r * 16 + c;
      lineIndices.push(n, n + 1);
    }
  }
  for (let r = 0; r < 4; r++) {
    lineIndices.push(r * 16, (r + 1) * 16);
    lineIndices.push(r * 16 + 15, (r + 1) * 16 + 15);
    const cols = [3, 7, 11];
    cols.forEach(col => {
      const n = r * 16 + col;
      lineIndices.push(n, n + 16);
    });
  }

  const pointsGeometry = new THREE.BufferGeometry();
  pointsGeometry.setAttribute("position", new THREE.BufferAttribute(currentPos, 3));

  const pointsMaterial = new THREE.PointsMaterial({
    color: 0xc13a1a, // Rust/Terracotta
    size: 0.24,
    map: createCircleTexture(),
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const nodePoints = new THREE.Points(pointsGeometry, pointsMaterial);
  mainGroup.add(nodePoints);

  const linePositions = new Float32Array(lineIndices.length * 3);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xc13a1a,
    transparent: true,
    opacity: 0.2,
    depthWrite: false
  });

  const connectionLines = new THREE.LineSegments(lineGeometry, lineMaterial);
  mainGroup.add(connectionLines);

  let mouseX = 0; let mouseY = 0;
  let targetMouseX = 0; let targetMouseY = 0;

  window.addEventListener("mousemove", (e) => {
    targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  let scrollPercent = 0;
  let currentT = 0;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    const scrollY = window.scrollY;
    const maxScroll = window.innerHeight * 0.8;
    scrollPercent = Math.min(1, Math.max(0, scrollY / maxScroll));
    currentT += (scrollPercent - currentT) * 0.1;

    // Dynamically adjust coloring based on theme class
    const isDark = document.body.classList.contains("dark");
    pointsMaterial.color.setHex(isDark ? 0xe5634a : 0xc13a1a);
    lineMaterial.color.setHex(isDark ? 0xe5634a : 0xc13a1a);

    // Interpolate coords
    const posAttr = pointsGeometry.attributes.position;
    for (let i = 0; i < nodeCount; i++) {
      const idx = i * 3;
      const targetX = posA[idx] * (1 - currentT) + posB[idx] * currentT;
      const targetY = posA[idx + 1] * (1 - currentT) + posB[idx + 1] * currentT;
      const targetZ = posA[idx + 2] * (1 - currentT) + posB[idx + 2] * currentT;

      const driftX = Math.sin(time * 0.4 + i) * 0.05 * currentT;
      const driftY = Math.cos(time * 0.4 + i) * 0.05 * currentT;

      currentPos[idx] = targetX + driftX;
      currentPos[idx + 1] = targetY + driftY;
      currentPos[idx + 2] = targetZ;
    }
    posAttr.needsUpdate = true;

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

    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    mainGroup.rotation.y = time * 0.02 + mouseX * 0.1;
    mainGroup.rotation.x = mouseY * 0.08;

    renderer.render(scene, camera);
  }

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
   2. LIGHT/DARK THEME TOGGLER
   ========================================================================= */
function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  const currentTheme = localStorage.getItem("theme") || "dark";
  if (currentTheme === "dark") {
    document.body.classList.add("dark");
    toggleBtn.innerText = "☀️";
  } else {
    document.body.classList.remove("dark");
    toggleBtn.innerText = "☾";
  }

  toggleBtn.addEventListener("click", () => {
    if (document.body.classList.contains("dark")) {
      document.body.classList.remove("dark");
      toggleBtn.innerText = "☾";
      localStorage.setItem("theme", "light");
    } else {
      document.body.classList.add("dark");
      toggleBtn.innerText = "☀️";
      localStorage.setItem("theme", "dark");
    }
  });
}

/* =========================================================================
   3. MOBILE NAVIGATION DRAWER
   ========================================================================= */
function initMobileNav() {
  const hamburger = document.getElementById("hamburger");
  const drawer = document.getElementById("mobile-drawer");
  if (!hamburger || !drawer) return;

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    drawer.classList.toggle("open");
  });
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    // Subtract header margin if needed
    const yOffset = -20; 
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
  
  // Collapse drawer
  document.getElementById("hamburger")?.classList.remove("open");
  document.getElementById("mobile-drawer")?.classList.remove("open");
}

/* =========================================================================
   4. ACTIVE NAV LINK HIGHLIGHT
   ========================================================================= */
function initActiveNavHighlight() {
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".nav-center .nav-a, .mobile-drawer .nav-a");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach(link => {
          const onClickAttr = link.getAttribute("onclick") || "";
          if (onClickAttr.includes(`'${id}'`)) {
            link.classList.add("on");
          } else {
            link.classList.remove("on");
          }
        });
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: "-48px 0px 0px 0px"
  });

  sections.forEach(s => observer.observe(s));
}

/* =========================================================================
   5. CURATED PROJECTS 3D HOVER TILT
   ========================================================================= */
function initTiltCards() {
  const cards = document.querySelectorAll(".proj-card, .ven-card");
  cards.forEach(card => {
    // Skip tilt effect on mobile viewports
    if (window.innerWidth < 900) {
      card.style.transform = "none";
      return;
    }
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xc = rect.width / 2;
      const yc = rect.height / 2;
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
   6. GITHUB REPOSITORIES DYNAMIC SYNC
   ========================================================================= */
async function fetchGitHubRepos() {
  const grid = document.getElementById("github-repo-grid");
  if (!grid) return;

  try {
    const response = await fetch("https://api.github.com/users/harshchavan009/repos?sort=updated&per_page=100");
    if (!response.ok) throw new Error("GitHub API error");
    const data = await response.json();

    if (!Array.isArray(data)) throw new Error("Invalid payload");

    // Filter out forks and sort by pushed/updated timestamp
    const activeRepos = data
      .filter(repo => !repo.fork)
      .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());

    // Take top 4 repositories
    const displayRepos = activeRepos.slice(0, 4);
    grid.innerHTML = ""; // Clear loader skeletons

    if (displayRepos.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-8 text-center text-xs font-mono text-text3">NO PUBLIC SYSTEM REPOSITORIES DETECTED</div>`;
      return;
    }

    // Metadata dictionary for authentic GitHub repos without API descriptions
    const repoMetadata = {
      "Multi-Agent-RAG": {
        description: "Enterprise multi-agent RAG orchestration framework combining graph knowledge bases and vector search.",
        tech: "Python · LangGraph · Neo4j"
      },
      "Harsh-Portfolio": {
        description: "Official personal portfolio codebase featuring AI & Generative AI Systems showcase and interactive telemetry.",
        tech: "HTML5 · CSS3 · JavaScript"
      },
      "Waste-Mangement-System": {
        description: "Automated smart waste classification and management system logic built with modern software architecture.",
        tech: "JavaScript · Node.js"
      },
      "harshchavan009": {
        description: "GitHub Profile configuration repository and central developer ecosystem hub for Harsh Chavan.",
        tech: "Markdown · Systems"
      }
    };

    displayRepos.forEach(repo => {
      const meta = repoMetadata[repo.name] || {};
      const desc = repo.description || meta.description || "Public repository hosted on GitHub by Harsh Chavan.";
      const tech = meta.tech || repo.language || "Python";

      const card = document.createElement("a");
      card.className = "proj-card";
      card.href = repo.html_url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.innerHTML = `
        <div class="proj-top">
          <svg class="proj-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <div class="proj-stars">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            ${repo.stargazers_count}
          </div>
        </div>
        <div class="proj-name">${repo.name}</div>
        <div class="proj-desc">${desc}</div>
        <div class="proj-footer">
          <span class="proj-tech">${tech}</span>
          <span class="proj-link">View Repo ↗</span>
        </div>
      `;
      grid.appendChild(card);
    });

    initTiltCards();
  } catch (err) {
    console.warn("GitHub dynamic repo sync failed. Rendering fallback:", err);
    grid.innerHTML = "";
  }
}

function getRelativeTime(date) {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return "today";
  if (diffDays <= 30) return `${diffDays} days ago`;
  const months = Math.floor(diffDays / 30);
  if (months <= 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

/* =========================================================================
   7. SCROLL REVEAL OBSERVER
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
    threshold: 0.08,
    rootMargin: "0px 0px -40px 0px"
  });

  reveals.forEach(el => observer.observe(el));
}

/* =========================================================================
   8. FLOATING BACKGROUND GLYPHS (AI Emojis & Code elements)
   ========================================================================= */
function initFloatingGlyphs() {
  const container = document.createElement("div");
  container.className = "fixed inset-0 pointer-events-none z-[-5] overflow-hidden";
  document.body.appendChild(container);

  const glyphs = ["🧠", "🤖", "⚡", "{ }", "[]", "=>", "01", "10", "TON", "PLC", "SYS", "LLM", "RAG", "< />"];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement("div");
    const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
    el.innerText = glyph;
    el.className = "floating-glyph";
    
    const size = Math.random() * 20 + 12;
    const left = Math.random() * 100;
    const duration = Math.random() * 30 + 20;
    const delay = Math.random() * -30;
    const opacity = Math.random() * 0.08 + 0.04;

    el.style.left = `${left}%`;
    el.style.fontSize = `${size}px`;
    el.style.setProperty("--op-target", opacity);
    el.style.animation = `float-drift ${duration}s linear infinite`;
    el.style.animationDelay = `${delay}s`;
    
    container.appendChild(el);
  }
}

/* =========================================================================
   9. VENTURE DETAILS MODAL TOGGLES
   ========================================================================= */
function openVentureModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.classList.add("open");
}

function closeVentureModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.classList.remove("open");
}

/* =========================================================================
   10. CONTACT FORM SUBMIT HANDLER
   ========================================================================= */
function handleContactSubmit(event) {
  event.preventDefault();
  const btn = document.getElementById("contact-btn");
  if (!btn) return;

  btn.innerText = "Sending...";
  btn.disabled = true;

  setTimeout(() => {
    btn.innerText = "Sent ✓";
    
    // Clear inputs
    document.getElementById("contact-name").value = "";
    document.getElementById("contact-email").value = "";
    document.getElementById("contact-message").value = "";

    setTimeout(() => {
      btn.innerText = "Send message ↗";
      btn.disabled = false;
    }, 3000);
  }, 1200);
}

/* =========================================================================
   11. LEETCODE PROGRESS BARS ANIMATION
   ========================================================================= */
function initLeetcodeBars() {
  const bars = document.querySelectorAll(".leetcode-bar-fill");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const targetWidth = bar.getAttribute("data-width");
        bar.style.width = targetWidth;
        observer.unobserve(bar); // Animate once
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px 0px -20px 0px"
  });

  bars.forEach(bar => observer.observe(bar));
}
