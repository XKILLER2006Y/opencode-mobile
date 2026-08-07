import { fireEvent, render } from "@testing-library/react-native"
jest.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({ t: (key: string) => key }),
}))
import { ComposerToolbar } from "./ComposerToolbar"

const base = {
  input: "",
  onChangeInput: () => {},
  onSend: () => {},
  attachments: [],
  onRemoveAttachment: () => {},
  onPickFromLibrary: () => {},
  onPickFromCamera: () => {},
  onPaste: () => {},
  agent: "build",
  agentColor: "#000",
  onCycleAgent: () => {},
  modelLabel: "gpt-4o",
  onOpenModelPicker: () => {},
  hasVariants: false,
  variant: undefined,
  onOpenVariantPicker: () => {},
  isSending: false,
  onAbort: () => {},
  speechListening: false,
  speechTranscript: "",
  onStartSpeech: () => {},
  onStopSpeech: () => {},
  bottomInset: 0,
  isDark: false,
}

describe("ComposerToolbar", () => {
  it("renders input and send button when there is text", async () => {
    const { getByTestId } = await render(<ComposerToolbar {...base} input="hello" />)
    expect(getByTestId("chat-message-input")).toBeTruthy()
    expect(getByTestId("chat-send-button")).toBeTruthy()
  })

  it("calls onChangeInput when typing", async () => {
    const onChangeInput = jest.fn()
    const { getByTestId } = await render(<ComposerToolbar {...base} onChangeInput={onChangeInput} />)
    const input = getByTestId("chat-message-input")
    await fireEvent(input, "changeText", "hey")
    expect(onChangeInput).toHaveBeenCalledWith("hey")
  })
})