/**
 * SecureStore-backed onboarding store — the production binding.
 *
 * `onboarding.ts` keeps the logic pure (injected storage) so it is testable
 * under `node --test`; this module wires it to expo-secure-store and exposes
 * the singleton the app consumes.
 */

import * as SecureStore from "expo-secure-store"
import { createOnboardingStore, type OnboardingStorage } from "./onboarding.ts"

const secureStoreStorage: OnboardingStorage = {
  getItemAsync: (key) => SecureStore.getItemAsync(key),
  setItemAsync: (key, value) => SecureStore.setItemAsync(key, value),
}

export const onboardingStore = createOnboardingStore(secureStoreStorage)
