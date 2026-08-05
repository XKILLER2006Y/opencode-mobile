/* eslint-disable @typescript-eslint/no-require-imports -- Metro resolves these bundled .ttf asset references at build time; a static require is the only way to load them. */
import { useFonts } from "expo-font"

// Loads the bundled Inter typeface (SF Pro stand-in) before first paint.
// Returns loaded=false until ready; the root layout renders the splash
// placeholder during that window. A font load failure must NOT brick the
// app — loaded falls back to true so the UI renders with the system font.
export function useLoadedFonts(): { loaded: boolean } {
  const [loaded, error] = useFonts({
    "Inter-Regular": require("../../assets/fonts/Inter-Regular.ttf"),
    "Inter-Medium": require("../../assets/fonts/Inter-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/fonts/Inter-SemiBold.ttf"),
    "Inter-Bold": require("../../assets/fonts/Inter-Bold.ttf"),
  })
  return { loaded: loaded || !!error }
}
