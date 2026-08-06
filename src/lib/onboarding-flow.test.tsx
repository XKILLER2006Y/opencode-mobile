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