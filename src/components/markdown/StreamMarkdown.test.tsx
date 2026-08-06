import { useState } from "react"
import { Text } from "react-native"
import { render, fireEvent } from "@testing-library/react-native"
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

describe("StreamMarkdown block stability while streaming", () => {
  it("appends new content without unmounting or crashing", async () => {
    function Full() {
      const [content, setContent] = useState("line one\n\n```js\nconst a = 1\n```")
      return (
        <>
          <StreamMarkdown streaming>{content}</StreamMarkdown>
          <Text onPress={() => setContent((c) => c + "\n\nnew paragraph")}>grow</Text>
        </>
      )
    }

    const { getByText, getAllByText } = await render(<Full />)
    expect(getAllByText(/line one|const a = 1/).length).toBeGreaterThan(0)

    await fireEvent.press(getByText("grow"))
    expect(getByText(/new paragraph/)).toBeTruthy()
  })
})