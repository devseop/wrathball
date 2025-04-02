type RunningMode = "IMAGE" | "VIDEO";

export const SEGMENT_CONSTANTS = {
  runningMode: "VIDEO" as RunningMode,
  visionTaskPath: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm",
  modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite",
}