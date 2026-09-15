import assert from "node:assert/strict";
import test from "node:test";

import { captureSample, createCaptureExport, shouldCapture } from "../src/capture-session.js";

test("normalizes a compact telemetry sample", () => {
  const sample = captureSample({ RPM: 8123.4, Gear: 3, Speed: [42.5] }, 12.6);
  assert.equal(sample.elapsedMs, 13);
  assert.equal(sample.RPM, 8123.4);
  assert.equal(sample.gear, "3");
  assert.equal(sample.Speed, 42.5);
});

test("keeps gear changes, rpm changes, and a 20 Hz heartbeat", () => {
  const previous = captureSample({ RPM: 8000, Gear: 3 }, 100);
  assert.equal(shouldCapture(previous, captureSample({ RPM: 8002, Gear: 3 }, 120)), false);
  assert.equal(shouldCapture(previous, captureSample({ RPM: 8005, Gear: 3 }, 120)), true);
  assert.equal(shouldCapture(previous, captureSample({ RPM: 8002, Gear: 4 }, 120)), true);
  assert.equal(shouldCapture(previous, captureSample({ RPM: 8002, Gear: 3 }, 150)), true);
});

test("exports the exact iRacing car path and shift-light values", () => {
  const telemetry = {
    DriverInfo: {
      DriverCarIdx: 2,
      Drivers: [{ CarIdx: 2, CarPath: "aston-test", CarScreenName: "Aston Test", UserName: "Private Name" }],
    },
    PlayerCarSLFirstRPM: 7000,
    PlayerCarSLBlinkRPM: 9000,
  };
  const result = createCaptureExport({ telemetry, samples: [], markers: [], startedAt: "a", stoppedAt: "b" });
  assert.equal(result.car.carId, "aston-test");
  assert.equal(result.car.carName, "Aston Test");
  assert.equal(JSON.stringify(result).includes("Private Name"), false);
  assert.equal(result.shiftLightTelemetry.PlayerCarSLFirstRPM, 7000);
  assert.equal(result.shiftLightTelemetry.PlayerCarSLBlinkRPM, 9000);
});
