import { FaceDetector, FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs";
import { smoothTransform, transformFromDetection, transformFromLandmarks } from "./geometry.js";
const LANDMARK_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const FULL_RANGE_DETECTOR_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_full_range/float16/latest/blaze_face_full_range.tflite";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const LOST_FACE_GRACE_MS = 520;
export class FaceTracker {
    landmarker = null;
    detector = null;
    previous = null;
    lastTimestampMs = 0;
    lastGoodAtMs = 0;
    async init(onStatus) {
        if (this.landmarker && this.detector) return;
        onStatus?.("얼굴 추적 모델 불러오는 중…");
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        const landmarkerOptions = {
            runningMode: "VIDEO",
            numFaces: 1,
            minFaceDetectionConfidence: 0.30,
            minFacePresenceConfidence: 0.25,
            minTrackingConfidence: 0.25,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: false
        };
        try {
            this.landmarker = await FaceLandmarker.createFromOptions(vision, {
                ...landmarkerOptions,
                baseOptions: { modelAssetPath: LANDMARK_MODEL_URL, delegate: "GPU" }
            });
        } catch (gpuError) {
            console.warn("GPU face landmarks unavailable; falling back to CPU.", gpuError);
            this.landmarker = await FaceLandmarker.createFromOptions(vision, {
                ...landmarkerOptions,
                baseOptions: { modelAssetPath: LANDMARK_MODEL_URL, delegate: "CPU" }
            });
        }
        onStatus?.("작은 얼굴용 보조 검출기 준비 중…");
        try {
            this.detector = await FaceDetector.createFromOptions(vision, {
                runningMode: "VIDEO",
                minDetectionConfidence: 0.25,
                minSuppressionThreshold: 0.3,
                baseOptions: { modelAssetPath: FULL_RANGE_DETECTOR_MODEL_URL, delegate: "CPU" }
            });
        } catch (detectorError) {
            console.warn("Full-range fallback detector unavailable; continuing with landmarks only.", detectorError);
            this.detector = null;
        }
        onStatus?.("얼굴 추적 준비 완료");
    }
    resetSmoothing() {
        this.previous = null;
        this.lastGoodAtMs = 0;
    }
    close() {
        this.landmarker?.close();
        this.detector?.close();
        this.landmarker = null;
        this.detector = null;
        this.previous = null;
        this.lastGoodAtMs = 0;
    }
    detect(video, width, height, settings) {
        if (!this.landmarker || video.readyState < 2) return { transform: null, blendshapes: [] };
        const wallClockMs = performance.now();
        const timestampMs = Math.max(this.lastTimestampMs + 0.1, wallClockMs);
        this.lastTimestampMs = timestampMs;
        const result = this.landmarker.detectForVideo(video, timestampMs);
        const landmarks = result.faceLandmarks?.[0];
        const blendshapeCategories = result.faceBlendshapes?.[0]?.categories ?? [];
        let raw = landmarks ? transformFromLandmarks(landmarks, width, height, settings) : null;
        if (!raw && this.detector) {
            try {
                const detectionResult = this.detector.detectForVideo(video, timestampMs + 0.01);
                const detection = detectionResult.detections?.[0];
                raw = detection ? transformFromDetection(detection, width, height, settings) : null;
            } catch (error) {
                console.warn("Full-range face fallback failed for a frame.", error);
            }
        }
        if (raw) {
            this.lastGoodAtMs = wallClockMs;
            this.previous = smoothTransform(this.previous, raw, settings.smoothing);
        } else if (this.previous && this.lastGoodAtMs && wallClockMs - this.lastGoodAtMs <= LOST_FACE_GRACE_MS) {
            this.previous = { ...this.previous, visible: true };
        } else {
            this.previous = smoothTransform(this.previous, null, settings.smoothing);
        }
        return { transform: this.previous, blendshapes: blendshapeCategories };
    }
}
