const grid = document.getElementById("grid");
const submitBtn = document.getElementById("submitBtn");
const card = document.querySelector(".captcha");

const cameraTile = document.getElementById("cameraTile");
const cameraVideo = document.getElementById("cameraVideo");
const cameraOverlay = document.getElementById("cameraOverlay");

let cameraStream = null;
const selected = new Set();

/* ---------------- CAMERA ---------------- */

async function startCamera() {
  if (cameraStream) return;

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    cameraVideo.srcObject = cameraStream;
    await cameraVideo.play();

    cameraTile.classList.add("enabled");
    cameraTile.classList.add("selected");
    selected.add(cameraTile.dataset.id);

  } catch (err) {
    console.error(err);
    cameraOverlay.textContent = "Camera blocked 😭 Allow permission";
  }
}

if (cameraTile) {
  cameraTile.addEventListener("click", async (e) => {
    e.stopPropagation();

    if (cameraTile.classList.contains("enabled")) {
      cameraTile.classList.toggle("selected");
      if (cameraTile.classList.contains("selected"))
        selected.add(cameraTile.dataset.id);
      else
        selected.delete(cameraTile.dataset.id);
      return;
    }

    await startCamera();
  });
}

/* ---------------- SHRINK TILE ---------------- */

const shrinkTile = [...document.querySelectorAll(".tile")].find(
  t => t.textContent.trim().toLowerCase() === "definitely not me"
);

let shrinkScale = 1;

/* ---------------- TELEPORT TILE (NEW SIMPLIFIED LOGIC) ---------------- */

const teleportTile = [...document.querySelectorAll(".tile")].find(
  t => t.textContent.trim().toLowerCase() === "ew who would want to do that"
);

let teleportStep = 0;
let teleportActive = false;

let teleportPlaceholder = null;

function activateTeleportTile() {
  if (!teleportTile || teleportActive) return;
  teleportActive = true;

  // Create placeholder so grid doesn't reflow
  teleportPlaceholder = document.createElement("div");
  teleportPlaceholder.className = "tile grid-hidden";
  teleportPlaceholder.setAttribute("aria-hidden", "true");

  teleportTile.parentNode.insertBefore(teleportPlaceholder, teleportTile);

  const cardRect = card.getBoundingClientRect();
  const tileRect = teleportTile.getBoundingClientRect();

  teleportTile.style.width = `${tileRect.width}px`;
  teleportTile.style.height = `${tileRect.height}px`;

  teleportTile.classList.add("teleport");
  teleportTile.style.left = `${tileRect.left - cardRect.left}px`;
  teleportTile.style.top = `${tileRect.top - cardRect.top}px`;
}



function teleportToNextSpot() {
  const cardRect = card.getBoundingClientRect();
  const tileRect = teleportTile.getBoundingClientRect();

  const spots = [
    { x: 20, y: 20 }, // Spot A
    { x: cardRect.width - tileRect.width - 20, y: cardRect.height - tileRect.height - 20 } // Spot B
  ];

  if (teleportStep === 0) {
    teleportTile.style.left = `${spots[0].x}px`;
    teleportTile.style.top = `${spots[0].y}px`;
  } else if (teleportStep === 1) {
    teleportTile.style.left = `${spots[1].x}px`;
    teleportTile.style.top = `${spots[1].y}px`;
  } else {
    teleportTile.classList.add("hide");
    setTimeout(() => teleportTile.remove(), 150);
  }

  teleportStep++;
}

if (teleportTile) {
  teleportTile.addEventListener("click", (e) => {
    e.stopPropagation();
    activateTeleportTile();
    teleportToNextSpot();
  });
}

/* ---------------- GRID CLICK LOGIC ---------------- */

grid.addEventListener("click", (e) => {
  const tile = e.target.closest(".tile");
  if (!tile) return;

  if (tile.dataset.type === "camera") return;
  if (tile === teleportTile) return;

  const type = tile.dataset.type;
  const id = tile.dataset.id;

  if (shrinkTile && tile === shrinkTile) {
    tile.classList.add("shrinking");
    shrinkScale *= 0.78;
    tile.style.transform = `scale(${shrinkScale})`;

    if (shrinkScale < 0.25) {
        tile.style.opacity = "0";
        tile.style.pointerEvents = "none";
        tile.style.transform = "scale(0.2)";
        tile.classList.add("grid-hidden"); // new class
    }

    return;
  }

  if (type === "correct") {
    tile.classList.toggle("selected");
    if (tile.classList.contains("selected")) selected.add(id);
    else selected.delete(id);
  }
});

let askedOnce = false;

function requestCameraOnFirstInteraction() {
  if (askedOnce) return;
  askedOnce = true;

  // Only try if the tile exists
  if (cameraTile) startCamera();
}

window.addEventListener("pointerdown", requestCameraOnFirstInteraction, { once: true });
window.addEventListener("keydown", requestCameraOnFirstInteraction, { once: true });


/* ---------------- TEMP VERIFY ---------------- */

submitBtn.addEventListener("click", () => {
  // Count all "required" tiles: correct + camera
  const requiredTiles = document.querySelectorAll(
    '.tile[data-type="correct"], .tile[data-type="camera"]'
  );

  const requiredCount = requiredTiles.length;

  // selected is your Set of ids
  const selectedCount = selected.size;

  if (selectedCount >= requiredCount) {
    // WIN ✅
    launchConfetti();
    showSuccess();
  } else {
    alert(`Not quite 😈 You selected ${selectedCount} of ${requiredCount}.`);
  }
});


const successOverlay = document.getElementById("successOverlay");
const successBtn = document.getElementById("successBtn");

function launchConfetti() {
  // small bursts
  const end = Date.now() + 1400;

  (function frame() {
    confetti({
      particleCount: 10,
      spread: 80,
      startVelocity: 45,
      ticks: 180,
      origin: { x: Math.random(), y: Math.random() * 0.3 }
    });

    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  // big center burst
  setTimeout(() => {
    confetti({
      particleCount: 220,
      spread: 120,
      startVelocity: 55,
      ticks: 220,
      origin: { x: 0.5, y: 0.55 }
    });
  }, 250);
}

function showSuccess() {
  successOverlay.classList.add("show");
  successOverlay.setAttribute("aria-hidden", "false");
}

if (successBtn) {
  successBtn.addEventListener("click", () => {
    successOverlay.classList.remove("show");
    successOverlay.setAttribute("aria-hidden", "true");
  });
}
