const cameraSource = document.getElementById("cameraSource");
const cameraView = document.getElementById("cameraView");
const snapshot = document.getElementById("snapshot");
const previewImage = document.getElementById("previewImage");
const reviewPanel = document.getElementById("reviewPanel");
const startButton = document.getElementById("startButton");
const rotateButton = document.getElementById("rotateButton");
const captureButton = document.getElementById("captureButton");
const retakeButton = document.getElementById("retakeButton");
const statusPill = document.getElementById("statusPill");

const viewContext = cameraView.getContext("2d");
const previewContext = snapshot.getContext("2d");

let cameraStream = null;
let latestFrame = "";
let rotationIndex = 2;
const rotationOptions = [0, 90, 180, 270];
let renderHandle = null;

function setStatus(message, state = "idle") {
  statusPill.textContent = message;
  statusPill.dataset.state = state;
}

function getRotationDegrees() {
  return rotationOptions[rotationIndex];
}

function configureCanvas(canvas, size) {
  if (canvas.width !== size) canvas.width = size;
  if (canvas.height !== size) canvas.height = size;
}

function drawSquareFrame(source, targetContext, size, degrees) {
  const offsetX = (source.videoWidth - size) / 2;
  const offsetY = (source.videoHeight - size) / 2;

  targetContext.save();
  targetContext.clearRect(0, 0, size, size);
  targetContext.translate(size / 2, size / 2);
  targetContext.rotate((degrees * Math.PI) / 180);
  targetContext.scale(-1, 1);
  targetContext.drawImage(
    source,
    offsetX,
    offsetY,
    size,
    size,
    -size / 2,
    -size / 2,
    size,
    size
  );
  targetContext.restore();
}

function renderLiveView() {
  if (!cameraSource.videoWidth || !cameraSource.videoHeight) {
    renderHandle = requestAnimationFrame(renderLiveView);
    return;
  }

  const size = Math.min(cameraSource.videoWidth, cameraSource.videoHeight);
  configureCanvas(cameraView, size);
  drawSquareFrame(cameraSource, viewContext, size, getRotationDegrees());

  renderHandle = requestAnimationFrame(renderLiveView);
}

async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 1280 },
      },
      audio: false,
    });

    cameraSource.srcObject = cameraStream;
    rotateButton.disabled = false;
    captureButton.disabled = false;
    startButton.textContent = "Camera ready";
    startButton.disabled = true;
    setStatus(`Live camera on · ${getRotationDegrees()}°`, "live");

    if (renderHandle) cancelAnimationFrame(renderHandle);
    renderHandle = requestAnimationFrame(renderLiveView);
  } catch (error) {
    console.error(error);
    setStatus("Camera blocked", "idle");
    startButton.textContent = "Camera unavailable";
  }
}

function applyRotationLabel() {
  const nextDegrees = rotationOptions[(rotationIndex + 1) % rotationOptions.length];
  rotateButton.textContent = `Rotate ${nextDegrees}°`;
}

function rotateCamera() {
  rotationIndex = (rotationIndex + 1) % rotationOptions.length;
  applyRotationLabel();
  setStatus(`Live camera on · ${getRotationDegrees()}°`, "live");
}

function showReview() {
  reviewPanel.hidden = false;
  reviewPanel.classList.add("is-hidden");
  requestAnimationFrame(() => {
    reviewPanel.classList.remove("is-hidden");
  });
}

function hideReview() {
  reviewPanel.hidden = true;
}

function capturePhoto() {
  if (!cameraSource.videoWidth || !cameraSource.videoHeight) {
    setStatus("Wait for camera", "idle");
    return;
  }

  const size = Math.min(cameraSource.videoWidth, cameraSource.videoHeight);
  configureCanvas(snapshot, size);
  drawSquareFrame(cameraSource, previewContext, size, getRotationDegrees());

  latestFrame = snapshot.toDataURL("image/png");
  previewImage.src = latestFrame;

  cameraView.classList.add("is-hidden");
  captureButton.hidden = true;
  retakeButton.hidden = false;
  setStatus("Sample captured", "idle");
  showReview();
}

function retakePhoto() {
  hideReview();
  cameraView.classList.remove("is-hidden");
  captureButton.hidden = false;
  retakeButton.hidden = true;
  setStatus(`Live camera on · ${getRotationDegrees()}°`, "live");
}

startButton.addEventListener("click", startCamera);
rotateButton.addEventListener("click", rotateCamera);
captureButton.addEventListener("click", capturePhoto);
retakeButton.addEventListener("click", retakePhoto);

applyRotationLabel();
setStatus("Camera idle", "idle");

window.addEventListener("beforeunload", () => {
  if (renderHandle) cancelAnimationFrame(renderHandle);
  if (!cameraStream) return;
  for (const track of cameraStream.getTracks()) track.stop();
});
