import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSettings } from "./settings"
import { defaultPreferences } from "../lib/notifications"

// Settings are non-secret user preferences; they belong in AsyncStorage, not
// the platform Keychain/SecureStore (M-04). These tests pin the storage
// contract so a regression back to SecureStore fails loudly. The AsyncStorage
// mock is registered globally in jest.setup.js (other suites import the
// settings store transitively).

const SETTINGS_KEY = "opencode_settings"

describe("settings store persistence", () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    useSettings.setState({ loaded: false })
  })

  test("load() reads and merges stored settings from AsyncStorage", async () => {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ pageSize: 50 }))

    await useSettings.getState().load()

    const state = useSettings.getState()
    expect(state.loaded).toBe(true)
    expect(state.pageSize).toBe(50) // stored value applied
    expect(state.notifications).toEqual(defaultPreferences) // categories defaulted by merge
  })

  test("setPageSize persists the change to AsyncStorage", async () => {
    await useSettings.getState().load()
    await useSettings.getState().setPageSize(40)

    const raw = await AsyncStorage.getItem(SETTINGS_KEY)
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!).pageSize).toBe(40)
  })

  test("setNotification persists the change to AsyncStorage", async () => {
    await useSettings.getState().load()
    await useSettings.getState().setNotification("permission", true)

    const raw = await AsyncStorage.getItem(SETTINGS_KEY)
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!).notifications.permission).toBe(true)
  })
})
