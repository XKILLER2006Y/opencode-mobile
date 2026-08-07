import { render } from "@testing-library/react-native"
jest.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({ t: (key: string) => key }),
}))
import { StatusChrome } from "./StatusChrome"

const base = {
  sessionID: "s1",
  isDark: false,
  permissions: [],
  onPermissionReply: () => {},
  questions: [],
  onQuestionReply: () => {},
  onQuestionReject: () => {},
}

describe("StatusChrome", () => {
  it("renders nothing when there is no session and no prompts", async () => {
    const { toJSON } = await render(<StatusChrome {...base} sessionID={undefined} />)
    expect(toJSON()).toBeNull()
  })

  it("renders a permission prompt when one is pending", async () => {
    const permissions = [{ id: "p1", permission: "bash", patterns: ["*"] }]
    const { getAllByText } = await render(<StatusChrome {...base} permissions={permissions} />)
    // i18n mock returns raw keys; the permission card labels contain the key prefix.
    expect(getAllByText(/permissionPrompt/).length).toBeGreaterThan(0)
  })
})