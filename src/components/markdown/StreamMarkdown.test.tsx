import { render } from "@testing-library/react-native"
import { StreamMarkdown } from "./StreamMarkdown"

describe("StreamMarkdown", () => {
  it("renders plain text in streaming mode", async () => {
    const { getByText } = await render(<StreamMarkdown streaming>Hello</StreamMarkdown>)
    expect(getByText("Hello")).toBeTruthy()
  })

  it("renders complete markdown via the stable Markdown path", async () => {
    const { getByText } = await render(<StreamMarkdown streaming={false}>**bold** text</StreamMarkdown>)
    expect(getByText("bold")).toBeTruthy()
  })

  it("passes isComplete to finalize the active block", async () => {
    const { rerender } = await render(<StreamMarkdown streaming>partial</StreamMarkdown>)
    expect(() => rerender(<StreamMarkdown streaming={false}>complete</StreamMarkdown>)).not.toThrow()
  })
})