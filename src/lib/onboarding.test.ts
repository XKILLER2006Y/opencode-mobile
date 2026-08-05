import { test } from "node:test"
import assert from "node:assert/strict"
import { createOnboardingStore } from "./onboarding.ts"

type FakeStorage = {
  getItemAsync: (key: string) => Promise<string | null>
  setItemAsync: (key: string, value: string) => Promise<void>
}

function fakeStorage(initial: Record<string, string> = {}): FakeStorage & { calls: string[]; failNext: boolean } {
  const store = { ...initial }
  return {
    calls: [],
    failNext: false,
    async getItemAsync(key: string) {
      this.calls.push(`get:${key}`)
      if (this.failNext) throw new Error("secure-store unavailable")
      return store[key] ?? null
    },
    async setItemAsync(key: string, value: string) {
      this.calls.push(`set:${key}=${value}`)
      if (this.failNext) throw new Error("secure-store unavailable")
      store[key] = value
    },
  }
}

test("onboarding: load returns false when no flag stored", async () => {
  const storage = fakeStorage()
  const onboarding = createOnboardingStore(storage)
  assert.equal(await onboarding.loadOnboardingCompleted(), false)
  assert.deepEqual(storage.calls, ["get:opencode_onboarding_completed"])
})

test("onboarding: complete persists then load returns true", async () => {
  const storage = fakeStorage()
  const onboarding = createOnboardingStore(storage)
  await onboarding.completeOnboarding()
  assert.equal(await onboarding.loadOnboardingCompleted(), true)
  assert.deepEqual(storage.calls, ["set:opencode_onboarding_completed=true", "get:opencode_onboarding_completed"])
})

test("onboarding: complete is idempotent", async () => {
  const storage = fakeStorage()
  const onboarding = createOnboardingStore(storage)
  await onboarding.completeOnboarding()
  await onboarding.completeOnboarding()
  assert.equal(await onboarding.loadOnboardingCompleted(), true)
  assert.deepEqual(storage.calls, [
    "set:opencode_onboarding_completed=true",
    "set:opencode_onboarding_completed=true",
    "get:opencode_onboarding_completed",
  ])
})

test("onboarding: load returns false when SecureStore read fails", async () => {
  const storage = fakeStorage()
  storage.failNext = true
  const onboarding = createOnboardingStore(storage)
  assert.equal(await onboarding.loadOnboardingCompleted(), false)
})

test("onboarding: complete does not throw when SecureStore write fails", async () => {
  const storage = fakeStorage()
  storage.failNext = true
  const onboarding = createOnboardingStore(storage)
  await onboarding.completeOnboarding()
  assert.equal(await onboarding.loadOnboardingCompleted(), false)
})
