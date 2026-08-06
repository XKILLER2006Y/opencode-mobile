import { create } from "zustand"
import { completeOnboarding, loadOnboardingCompleted } from "../lib/onboarding-secure"

/**
 * Reactive onboarding state — the bridge between SecureStore persistence
 * (lib/onboarding-secure) and the root gate in app/_layout.tsx.
 *
 * `completed` is tri-state so the root layout can hold the splash screen
 * while the SecureStore read is in flight: null = loading, false = show
 * onboarding, true = show the app.
 */

interface OnboardingState {
  completed: boolean | null
  load: () => Promise<void>
  complete: () => Promise<void>
}

export const useOnboarding = create<OnboardingState>((set) => ({
  completed: null,

  load: async () => {
    const done = await loadOnboardingCompleted()
    set({ completed: done })
  },

  complete: async () => {
    await completeOnboarding()
    // Optimistic flip — root gate re-renders to the normal Stack immediately,
    // so router.replace("/(tabs)") from the onboarding screen stays valid.
    set({ completed: true })
  },
}))
