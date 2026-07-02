const camera = document.getElementById("camera");
const snapshot = document.getElementById("snapshot");
const previewImage = document.getElementById("previewImage");
const reviewPanel = document.getElementById("reviewPanel");
const startButton = document.getElementById("startButton");
const captureButton = document.getElementById("captureButton");
const retakeButton = document.getElementById("retakeButton");
const statusPill = document.getElementById("statusPill");

const previewContext = snapshot.getContext("2d");
let cameraStream = null;
let latestFrame = "";

function setStatus(message) {
  statusPill.textContent = message;
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

    camera.srcObject = cameraStream;
    captureButton.disabled = false;
    startButton.textContent = "Camera ready";
    startButton.disabled = true;
    setStatus("Live camera on");
  } catch (error) {
    console.error(error);
    setStatus("Camera blocked");
    startButton.textContent = "Camera unavailable";
  }
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
  if (!camera.videoWidth || !camera.videoHeight) {
    setStatus("Wait for camera");
    return;
  }

  const size = Math.min(camera.videoWidth, camera.videoHeight);
  snapshot.width = size;
  snapshot.height = size;

  const offsetX = (camera.videoWidth - size) / 2;
  const offsetY = (camera.videoHeight - size) / 2;

  previewContext.save();
  previewContext.translate(size / 2, size / 2);
  previewContext.rotate((90 * Math.PI) / 180);
  previewContext.scale(-1, 1);
  previewContext.drawImage(
    camera,
    offsetX,
    offsetY,
    size,
    size,
    -size / 2,
    -size / 2,
    size,
    size
  );
  previewContext.restore();

  latestFrame = snapshot.toDataURL("image/png");
  previewImage.src = latestFrame;
  camera.classList.add("is-hidden");
  snapshot.style.display = "block";
  captureButton.hidden = true;
  retakeButton.hidden = false;
  setStatus("Sample captured");
  showReview();
}

function retakePhoto() {
  hideReview();
  camera.classList.remove("is-hidden");
  snapshot.style.display = "none";
  captureButton.hidden = false;
  retakeButton.hidden = true;
  setStatus("Live camera on");
}

startButton.addEventListener("click", startCamera);
captureButton.addEventListener("click", capturePhoto);
retakeButton.addEventListener("click", retakePhoto);

window.addEventListener("beforeunload", () => {
  if (!cameraStream) return;
  for (const track of cameraStream.getTracks()) track.stop();
});

setStatus("Camera idle");
