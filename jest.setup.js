// Native modules that are pure no-ops under Jest (SDK 57).
// jest-expo mocks the core Expo SDK; these app-facing native modules need
// explicit no-op stubs so component tests render without a device runtime.

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}))

// AsyncStorage's native module is null under Jest. The settings store reads
// and writes preferences through it (M-04); provide the promise-based API it
// uses, backed by an in-memory Map so load/persist roundtrips work in tests.
const mockAsyncStorageStore = new Map()
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key) => (mockAsyncStorageStore.has(key) ? mockAsyncStorageStore.get(key) : null)),
    setItem: jest.fn(async (key, value) => {
      mockAsyncStorageStore.set(key, value)
    }),
    clear: jest.fn(async () => {
      mockAsyncStorageStore.clear()
    }),
  },
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

// expo-notifications auto-registers a push-token listener on import
// (DevicePushTokenAutoRegistration), which leaks a timer under Jest.
// Only src/lib/notifications.ts consumes it and no test exercises that
// module's logic, so a no-op stub keeps suites from hanging on teardown.
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: "undetermined" })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "undetermined" })),
  setNotificationChannelAsync: jest.fn(async () => null),
  scheduleNotificationAsync: jest.fn(async () => "mock-notification-id"),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { HIGH: 4 },
}))

// @sentry/react-native starts a module-scope AsyncExpiringMap cleanup
// setInterval on import (timeToDisplayFallback), which leaks a timer under
// Jest. src/lib/sentry.ts guards everything behind an enabled flag that is
// off in tests, so a no-op stub keeps suites from hanging on teardown.
jest.mock("@sentry/react-native", () => {
  const passthrough = (fn) => fn
  return {
    init: jest.fn(),
    wrap: passthrough,
    close: jest.fn(async () => {}),
    addBreadcrumb: jest.fn(),
    captureException: jest.fn(),
    withScope: jest.fn((cb) => cb({ setTag: jest.fn(), setExtra: jest.fn(), setContext: jest.fn() })),
    setTag: jest.fn(),
  }
})