/**
 * inject.js — Runs in the PAGE's JS context (not the extension's isolated world).
 *
 * Overrides navigator.mediaDevices.getUserMedia so that when a site requests
 * a video stream (e.g. for ID capture), we intercept it and:
 *   1. Ask the content script (via postMessage) if virtual camera is enabled.
 *   2. If enabled AND an image is stored, draw that image onto a canvas and
 *      return canvas.captureStream() as a synthetic MediaStream.
 *   3. If disabled or no image is set, fall through to the real getUserMedia.
 *
 * WHY canvas.captureStream()?
 *   The Web API requires getUserMedia to return a MediaStream with a VideoTrack.
 *   Drawing a static image onto a canvas and calling captureStream() gives us
 *   exactly that — a valid video track the browser considers "real".
 */

(function overrideGetUserMedia() {
  const NOOP_FRAME_RATE = 30; // fps for the canvas stream — enough to look live
  const CANVAS_WIDTH = 1280;
  const CANVAS_HEIGHT = 720;

  const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
    navigator.mediaDevices
  );

  /**
   * Ask the content script for the stored image and enabled state.
   * Returns a Promise that resolves to { isEnabled, imageDataUrl }.
   */
  function requestImageFromExtension() {
    return new Promise((resolve) => {
      const responseHandler = (event) => {
        if (event.source !== window) {return;}
        if (!event.data || event.data.type !== "FAUXCAM_IMAGE_RESPONSE") {return;}
        window.removeEventListener("message", responseHandler);
        resolve({
          isEnabled: event.data.isEnabled,
          imageDataUrl: event.data.imageDataUrl,
        });
      };

      window.addEventListener("message", responseHandler);
      window.postMessage({ type: "FAUXCAM_REQUEST_IMAGE" }, "*");

      // Safety timeout — if no response in 500ms, fall back to real camera
      setTimeout(() => {
        window.removeEventListener("message", responseHandler);
        resolve({ isEnabled: false, imageDataUrl: null });
      }, 500);
    });
  }

  /**
   * Loads an image URL into an HTMLImageElement.
   * Returns a Promise<HTMLImageElement>.
   */
  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load FauxCam image."));
      img.src = dataUrl;
    });
  }

  /**
   * Creates a MediaStream that continuously streams the given image as a
   * video track by drawing it on a hidden off-screen canvas.
   *
   * The canvas is kept alive as long as the caller holds a reference to the
   * stream — the animation loop stops when all tracks are ended.
   */
  function createImageStream(img) {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const context = canvas.getContext("2d");

    // Draw the image letter-boxed / cover-cropped into the canvas
    const imageAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;

    let drawX = 0;
    let drawY = 0;
    let drawWidth = CANVAS_WIDTH;
    let drawHeight = CANVAS_HEIGHT;

    if (imageAspect > canvasAspect) {
      // Image is wider — fit height, crop width
      drawHeight = CANVAS_HEIGHT;
      drawWidth = drawHeight * imageAspect;
      drawX = (CANVAS_WIDTH - drawWidth) / 2;
    } else {
      // Image is taller — fit width, crop height
      drawWidth = CANVAS_WIDTH;
      drawHeight = drawWidth / imageAspect;
      drawY = (CANVAS_HEIGHT - drawHeight) / 2;
    }

    // Fill background (visible in letterbox areas)
    context.fillStyle = "#1a1a2e";
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    const stream = canvas.captureStream(NOOP_FRAME_RATE);

    // Periodically redraw to keep the stream "alive" — some browsers drop
    // a captureStream that never repaints after a timeout.
    const keepAliveInterval = setInterval(() => {
      const allTracksEnded = stream.getVideoTracks().every(
        (track) => track.readyState === "ended"
      );
      if (allTracksEnded) {
        clearInterval(keepAliveInterval);
        return;
      }
      // Redraw — image content doesn't change but this keeps the stream active
      context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }, 1000 / NOOP_FRAME_RATE);

    return stream;
  }

  /**
   * The overridden getUserMedia.
   *
   * If virtual camera is active and the caller requests video, we return a
   * synthetic stream. For audio-only requests we always pass through.
   */
  navigator.mediaDevices.getUserMedia = async function virtualGetUserMedia(constraints) {
    const requestsVideo = Boolean(constraints?.video);

    if (!requestsVideo) {
      // Audio-only — no reason to intercept
      return originalGetUserMedia(constraints);
    }

    const { isEnabled, imageDataUrl } = await requestImageFromExtension();

    if (!isEnabled || !imageDataUrl) {
      // Extension is off or no image uploaded — fall through to real camera
      return originalGetUserMedia(constraints);
    }

    try {
      const img = await loadImage(imageDataUrl);
      const virtualStream = createImageStream(img);

      // If caller also wants audio alongside video, add a silent audio track
      if (constraints?.audio) {
        const audioContext = new AudioContext();
        const silentDestination = audioContext.createMediaStreamDestination();
        const silentTrack = silentDestination.stream.getAudioTracks()[0];
        if (silentTrack) {virtualStream.addTrack(silentTrack);}
      }

      console.info("[FauxCam] Serving virtual camera stream from uploaded image.");
      return virtualStream;
    } catch (error) {
      console.warn("[FauxCam] Failed to create virtual stream, falling back to real camera.", error);
      return originalGetUserMedia(constraints);
    }
  };
})();
