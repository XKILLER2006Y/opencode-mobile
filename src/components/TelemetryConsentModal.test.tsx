/**
 * Smoke + first component test for the jest-expo + RTL infra (Task 10/11).
 *
 * TelemetryConsentModal is the simplest a11y-complete component; this test
 * proves the native-mock setup, i18n mocking, and press-effect assertion
 * pattern all work end to end.
 */

import { render, fireEvent } from "@testing-library/react-native"
import { TelemetryConsentModal } from "./TelemetryConsentModal"

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe("TelemetryConsentModal", () => {
  it("renders title and both actions", async () => {
    const { getByText } = await render(
      <TelemetryConsentModal visible onAllow={() => {}} onDecline={() => {}} />,
    )

    expect(getByText("telemetryConsent.title")).toBeTruthy()
    expect(getByText("telemetryConsent.allowButton")).toBeTruthy()
    expect(getByText("telemetryConsent.declineButton")).toBeTruthy()
  })

  it("calls onAllow when Allow is pressed", async () => {
    const onAllow = jest.fn()
    const { getByTestId } = await render(
      <TelemetryConsentModal visible onAllow={onAllow} onDecline={() => {}} />,
    )

    fireEvent.press(getByTestId("telemetry-allow-button"))
    expect(onAllow).toHaveBeenCalledTimes(1)
  })

  it("calls onDecline when Decline is pressed", async () => {
    const onDecline = jest.fn()
    const { getByTestId } = await render(
      <TelemetryConsentModal visible onAllow={() => {}} onDecline={onDecline} />,
    )

    fireEvent.press(getByTestId("telemetry-decline-button"))
    expect(onDecline).toHaveBeenCalledTimes(1)
  })
})
