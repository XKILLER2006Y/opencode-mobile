import { render, fireEvent } from "@testing-library/react-native"
import { ReasoningBlock } from "./ReasoningBlock"

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe("ReasoningBlock", () => {
  it("auto-expands while live", async () => {
    const { getByText } = await render(<ReasoningBlock text="deep thought" isDark={false} live />)
    expect(getByText("deep thought")).toBeTruthy()
  })

  it("collapses by default when not live", async () => {
    const { queryByText } = await render(<ReasoningBlock text="deep thought" isDark={false} />)
    expect(queryByText("deep thought")).toBeNull()
  })

  it("toggle works after streaming completes", async () => {
    const { getByText, queryByText, getByRole } = await render(
      <ReasoningBlock text="deep thought" isDark={false} live />,
    )
    // expanded while live
    expect(getByText("deep thought")).toBeTruthy()
    // tap to collapse
    await fireEvent.press(getByRole("button"))
    expect(queryByText("deep thought")).toBeNull()
    // tap to expand again
    await fireEvent.press(getByRole("button"))
    expect(getByText("deep thought")).toBeTruthy()
  })
})
