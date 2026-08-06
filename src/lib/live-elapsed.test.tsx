import { renderHook, act } from "@testing-library/react-native"
import { useLiveNow } from "./live-elapsed"

jest.useFakeTimers()

describe("useLiveNow", () => {
  it("ticks while active", async () => {
    const { result } = await renderHook(() => useLiveNow(true))
    const before = result.current
    await act(() => {
      jest.advanceTimersByTime(1100)
    })
    expect(result.current).toBeGreaterThanOrEqual(before + 1000)
  })

  it("stops ticking when inactive", async () => {
    const { result } = await renderHook(() => useLiveNow(false))
    const before = result.current
    await act(() => {
      jest.advanceTimersByTime(3000)
    })
    expect(result.current).toBe(before)
  })
})