# Aston Martin Valkyrie telemetry capture

## Before the run

1. Install this checkout with `Install-Kapps-App.cmd`, then start Kapps.
2. Start an iRacing Test Drive with the Aston Martin Valkyrie AMR-LMH.
3. Use a dry, long and safe track with automatic fuel cut disabled if possible.
4. Add a Kapps overlay using
   `http://127.0.0.1:8182/ShiftLines/capture.html?auto=1`.
5. Confirm that the page shows the Aston Martin car ID and live RPM.
6. Configure OBS or another recorder so the steering wheel LEDs and the capture
   page timer are visible in the same video. Use 60 fps when available.

## Recording

1. Confirm that the red **RECORDING** label appears automatically.
2. In each gear from 1 through 7, start well below the first illuminated LED and
   apply throttle smoothly until the shift lights flash or the limiter engages.
3. Repeat every gear at least three times. Avoid wheelspin and early shifts.
4. After the driving runs, stop safely and make one slow neutral-RPM sweep if
   the car allows it.
5. After the run, exit the car or close iRacing so the recording is finalized.
6. Open `http://127.0.0.1:8182/ShiftLines/capture.html` in a normal browser
   window and click **Download JSON**.

Kapps overlays are click-through, so their buttons and Space key are not used.
The controls work only when the capture page is opened in a normal browser.

## Files to send back

- The downloaded `shiftlines-*.json` file.
- The original screen recording, without trimming or changing its frame rate.
- A note identifying any LEDs that serve another purpose or change colour.

Do not estimate LED thresholds by eye in the JSON. The profile will be derived
from the captured RPM timeline and video, then checked in ShiftLines before the
upstream pull request is prepared.
