import { render, fireEvent } from "@testing-library/react-native"
import { JumpToLatest } from "./JumpToLatest"

describe("JumpToLatest", () => {
  it("renders when visible", async () => {
    const { getByRole } = await render(<JumpToLatest visible onPress={() => {}} isDark={false} />)
    expect(getByRole("button")).toBeTruthy()
  })

  it("does not render when hidden", async () => {
    const { queryByRole } = await render(<JumpToLatest visible={false} onPress={() => {}} isDark={false} />)
    expect(queryByRole("button")).toBeNull()
  })

  it("calls onPress on tap", async () => {
    const onPress = jest.fn()
    const { getByRole } = await render(<JumpToLatest visible onPress={onPress} isDark={false} />)
    await fireEvent.press(getByRole("button"))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})