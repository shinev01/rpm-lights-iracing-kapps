import { KappsClient } from "./kapps-client.js?v=6";
import {
  captureSample,
  createCaptureExport,
  shouldCapture,
} from "./capture-session.js";
import { gearKey, playerCarPath } from "./engine.js";

const STORAGE_KEY = "shiftlines-last-capture-v1";
const autoCapture = new URLSearchParams(location.search).has("auto");
const source = new KappsClient({ fps: 60 });
const ui = {
  status: document.querySelector("#capture-status"),
  car: document.querySelector("#capture-car"),
  rpm: document.querySelector("#capture-rpm"),
  gear: document.querySelector("#capture-gear"),
  time: document.querySelector("#capture-time"),
  samples: document.querySelector("#capture-samples"),
  start: document.querySelector("#capture-start"),
  stop: document.querySelector("#capture-stop"),
  download: document.querySelector("#capture-download"),
  marker: document.querySelector("#capture-marker"),
};

let telemetry = {};
let connected = false;
let recording = false;
let startedAt = null;
let startedClock = 0;
let stoppedAt = null;
let samples = [];
let markers = [];

function elapsedMs() {
  return recording ? performance.now() - startedClock : samples.at(-1)?.elapsedMs || 0;
}

function snapshot() {
  return createCaptureExport({ telemetry, samples, markers, startedAt, stoppedAt });
}

function persist() {
  if (!startedAt || !samples.length) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
  } catch (error) {
    ui.status.textContent = `LOCAL SAVE ERROR: ${error.message}`;
  }
}

function start() {
  samples = [];
  markers = [];
  startedAt = new Date().toISOString();
  stoppedAt = null;
  startedClock = performance.now();
  recording = true;
  ui.start.disabled = true;
  ui.stop.disabled = false;
  ui.download.disabled = true;
}

function stop() {
  if (!recording) return;
  recording = false;
  stoppedAt = new Date().toISOString();
  persist();
  ui.start.disabled = false;
  ui.stop.disabled = true;
  ui.download.disabled = samples.length === 0;
}

function mark() {
  if (!recording) return;
  markers.push({ elapsedMs: Math.round(elapsedMs()), rpm: Number(telemetry.RPM) || 0, gear: gearKey(telemetry.Gear) });
  ui.marker.textContent = `MARK ${markers.length}`;
}

function download() {
  const capture = samples.length ? snapshot() : JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (!capture) return;
  const carId = capture.car?.carId || "unknown-car";
  const blob = new Blob([`${JSON.stringify(capture, null, 2)}\n`], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `shiftlines-${carId}-${Date.now()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

source.addEventListener("socket", (event) => { connected = event.detail.connected; });
source.addEventListener("telemetry", (event) => {
  telemetry = event.detail.data || telemetry;
  connected = event.detail.connected;
  if (!connected) {
    if (recording && autoCapture) stop();
    return;
  }
  if (autoCapture && !recording && playerCarPath(telemetry.DriverInfo)) start();
  if (!recording) return;
  const next = captureSample(telemetry, elapsedMs());
  if (shouldCapture(samples.at(-1), next)) samples.push(next);
});

ui.start.addEventListener("click", start);
ui.stop.addEventListener("click", stop);
ui.download.addEventListener("click", download);
ui.marker.addEventListener("click", mark);
addEventListener("keydown", (event) => {
  if (event.code === "Space") { event.preventDefault(); mark(); }
});
addEventListener("beforeunload", () => { if (recording) persist(); });
setInterval(() => { if (recording && samples.length) persist(); }, 2000);
setInterval(() => {
  ui.status.textContent = recording ? "RECORDING" : connected ? "READY" : "WAITING FOR IRACING";
  ui.status.dataset.active = recording ? "true" : "false";
  ui.car.textContent = playerCarPath(telemetry.DriverInfo) || "NO CAR";
  ui.rpm.textContent = Math.round(Number(telemetry.RPM) || 0);
  ui.gear.textContent = gearKey(telemetry.Gear);
  ui.time.textContent = (elapsedMs() / 1000).toFixed(2);
  ui.samples.textContent = samples.length;
}, 50);

const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
ui.download.disabled = !saved;
ui.stop.disabled = true;
if (autoCapture) {
  ui.start.hidden = true;
  ui.stop.hidden = true;
  ui.marker.hidden = true;
  document.querySelector("#capture-help").textContent =
    "AUTO MODE: recording starts when the car is detected. After the session, open this URL in a normal browser without ?auto=1 to download the saved JSON.";
}
source.connect();
