/**
 * First-launch onboarding persistence — pure factory.
 *
 * Stores a single "completed" flag so the onboarding flow shows exactly once
 * (first install) and never again, even if the user later removes all
 * connections.
 *
 * The storage is injected so the flag logic is testable under `node --test`
 * (expo-secure-store is a native module and cannot be imported in Node).
 * Production binding lives in `onboarding-secure.ts`.
 */

export const ONBOARDING_KEY = "opencode_onboarding_completed"

export interface OnboardingStorage {
  getItemAsync(key: string): Promise<string | null>
  setItemAsync(key: string, value: string): Promise<void>
}

export interface OnboardingStore {
  loadOnboardingCompleted(): Promise<boolean>
  completeOnboarding(): Promise<void>
}

export function createOnboardingStore(storage: OnboardingStorage): OnboardingStore {
  return {
    async loadOnboardingCompleted() {
      try {
        const raw = await storage.getItemAsync(ONBOARDING_KEY)
        return raw === "true"
      } catch {
        // Storage unavailable: treat as not-completed; onboarding shows again
        // rather than silently locking the user out of setup.
        return false
      }
    },

    async completeOnboarding() {
      try {
        await storage.setItemAsync(ONBOARDING_KEY, "true")
      } catch {
        // Non-fatal: worst case onboarding shows again next launch
      }
    },
  }
}
