import { render } from "@testing-library/react-native"
jest.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({ t: (key: string) => key }),
}))
import { MessageList } from "./MessageList"

describe("MessageList", () => {
  it("renders user messages", async () => {
    // MessageBubble renders message text from text PARTS (not message.content)
    const data = [
      {
        message: { id: "a", role: "user" as const, content: "hi" },
        parts: [{ id: "p1", type: "text" as const, text: "hi" }],
      },
    ]
    const { getByText } = await render(
      <MessageList
        data={data as never}
        isDark={false}
        loadingMore={false}
        onLoadMore={() => {}}
        onScroll={() => {}}
        showScrollButton={false}
        onScrollToBottom={() => {}}
        onLongPress={() => {}}
      />,
    )
    expect(getByText("hi")).toBeTruthy()
  })

  it("renders the empty title when there are no messages", async () => {
    const { getAllByText } = await render(
      <MessageList
        data={[]}
        isDark={false}
        loadingMore={false}
        onLoadMore={() => {}}
        onScroll={() => {}}
        showScrollButton={false}
        onScrollToBottom={() => {}}
        onLongPress={() => {}}
      />,
    )
    // i18n mock returns the raw key; the string appears as content.
    expect(getAllByText(/session\.empty\./).length).toBeGreaterThan(0)
  })
})