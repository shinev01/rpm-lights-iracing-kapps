import { gearKey, playerCarPath } from "./engine.js";

const FIELDS = [
  "RPM",
  "Gear",
  "SessionTime",
  "Speed",
  "Throttle",
  "PlayerCarSLFirstRPM",
  "PlayerCarSLShiftRPM",
  "PlayerCarSLLastRPM",
  "PlayerCarSLBlinkRPM",
];

function numberOrNull(value) {
  const scalar = Array.isArray(value) ? value[0] : value;
  const number = Number(scalar);
  return Number.isFinite(number) ? number : null;
}

export function captureSample(telemetry, elapsedMs) {
  const sample = { elapsedMs: Math.max(0, Math.round(Number(elapsedMs) || 0)) };
  for (const field of FIELDS) sample[field] = numberOrNull(telemetry?.[field]);
  sample.gear = gearKey(sample.Gear);
  return sample;
}

export function shouldCapture(previous, next) {
  if (!previous) return true;
  return next.gear !== previous.gear ||
    Math.abs((next.RPM || 0) - (previous.RPM || 0)) >= 5 ||
    next.elapsedMs - previous.elapsedMs >= 50;
}

export function createCaptureExport({ telemetry, samples, startedAt, stoppedAt, markers = [] }) {
  const playerIndex = numberOrNull(telemetry?.DriverInfo?.DriverCarIdx);
  const player = telemetry?.DriverInfo?.Drivers?.find?.(
    (driver) => numberOrNull(driver?.CarIdx) === playerIndex,
  );
  return {
    format: "shiftlines-iracing-capture-v1",
    car: {
      carId: playerCarPath(telemetry?.DriverInfo),
      carName: player?.CarScreenName || player?.CarScreenNameShort || null,
      carClass: player?.CarClassShortName || null,
    },
    startedAt,
    stoppedAt,
    shiftLightTelemetry: Object.fromEntries(
      FIELDS.filter((field) => field.startsWith("PlayerCarSL"))
        .map((field) => [field, numberOrNull(telemetry?.[field])]),
    ),
    markers,
    samples,
  };
}
