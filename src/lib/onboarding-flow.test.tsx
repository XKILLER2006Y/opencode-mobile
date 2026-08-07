/**
 * Component test for the onboarding flow (Task 11).
 *
 * Asserts the welcome screen renders and that pressing Skip completes
 * onboarding (SecureStore write + router replacement to the main tabs).
 * Onboarding persistence is mocked per the jest.setup.js SecureStore stub;
 * the store and router are mocked here so the test is deterministic.
 */

import { render, fireEvent, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"
import OnboardingScreen from "../../app/onboarding"

const mockComplete = jest.fn(async () => {})
const mockUpdateSettings = jest.fn(async () => {})

const mockAuthState = {
  hasBiometrics: true,
  settings: { requireBiometric: false, requireBiometricForMessages: false },
  updateSettings: mockUpdateSettings,
}

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
}))

jest.mock("../stores/onboarding", () => ({
  useOnboarding: {
    getState: () => ({ complete: mockComplete }),
  },
}))

// expo-local-authentication is a native module without a jest.setup stub.
jest.mock("../stores/auth", () => ({
  useAuth: () => mockAuthState,
}))

describe("onboarding flow", () => {
  it("renders welcome title and feature items", async () => {
    const { getByText } = await render(<OnboardingScreen />)

    expect(getByText("onboarding.welcomeTitle")).toBeTruthy()
    expect(getByText("onboarding.welcomeSubtitle")).toBeTruthy()
    expect(getByText("onboarding.feature1")).toBeTruthy()
    expect(getByText("onboarding.feature2")).toBeTruthy()
    expect(getByText("onboarding.feature3")).toBeTruthy()
  })

  it("presses Skip and completes onboarding", async () => {
    const { getByText } = await render(<OnboardingScreen />)

    fireEvent.press(getByText("onboarding.skip"))

    await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1))
    expect(router.replace).toHaveBeenCalledWith("/(tabs)")
  })
})

describe("onboarding biometric suggestion step", () => {
  beforeEach(() => {
    mockUpdateSettings.mockClear()
    mockAuthState.hasBiometrics = true
    mockAuthState.settings.requireBiometric = false
  })

  it("shows the security step between guide and helper when the device supports biometrics", async () => {
    const { getByText, queryByText } = await render(<OnboardingScreen />)

    fireEvent.press(getByText("onboarding.getStarted"))

    await waitFor(() => expect(getByText("onboarding.securityTitle")).toBeTruthy())
    expect(queryByText("onboarding.helperTitle")).toBeNull()
  })

  it("enabling the biometric toggle updates auth settings and Continue reaches the helper step", async () => {
    const { getByText, getByLabelText } = await render(<OnboardingScreen />)

    fireEvent.press(getByText("onboarding.getStarted"))
    const toggle = await waitFor(() => getByLabelText("onboarding.securityToggleLabel"))
    fireEvent(toggle, "valueChange", true)

    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalledWith({ requireBiometric: true }))

    fireEvent.press(getByText("onboarding.continue"))
    await waitFor(() => expect(getByText("onboarding.helperTitle")).toBeTruthy())
  })

  it("skips the security step when the device has no biometrics", async () => {
    mockAuthState.hasBiometrics = false
    const { getByText, queryByText } = await render(<OnboardingScreen />)

    fireEvent.press(getByText("onboarding.getStarted"))

    await waitFor(() => expect(getByText("onboarding.helperTitle")).toBeTruthy())
    expect(queryByText("onboarding.securityTitle")).toBeNull()
  })
})