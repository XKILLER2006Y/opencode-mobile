// Native modules that are pure no-ops under Jest (SDK 57).
// jest-expo mocks the core Expo SDK; these app-facing native modules need
// explicit no-op stubs so component tests render without a device runtime.

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}))

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Error: "error", Warning: "warning" },
}))

jest.mock("expo-camera", () => ({
  CameraView: () => null,
  requestCameraPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
}))

jest.mock("expo-font", () => ({
  loadAsync: jest.fn(async () => {}),
  isLoaded: jest.fn(() => true),
}))