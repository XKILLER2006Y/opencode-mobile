# Security

## Reporting

Report security issues privately: [support@agentlabs.cc](mailto:support@agentlabs.cc).
Do not open a public issue for undisclosed vulnerabilities.

## Data handling

- Credentials are stored on-device in the OS keystore (`expo-secure-store`); non-sensitive
  preferences use AsyncStorage (`src/stores/settings.ts`). No secrets are logged or sent
  off-device.
- Lock-screen notifications never carry server-supplied content — permission and question
  notifications use fixed generic bodies (`src/lib/notify-format.ts`) so a malicious server
  cannot inject text onto the lock screen.
- Optional, opt-in crash reporting (Sentry) and waitlist signup (email → Brevo) are the only
  data leaving the device, both off by default. See `distribution/privacy-policy.md`.

## Known dependency advisories

`npm audit` currently reports **5 moderate** findings, all in one chain:

```
streamdown-rn → react-native-syntax-highlighter → react-syntax-highlighter@6.1.2
  → lowlight@1.9.2 → highlight.js@9.12.0
```

**Why this is accepted:** `lowlight@1.9.2` depends on `highlight.js@~9.12.0` (tilde range),
and highlight.js v10 broke the plugin/language-registration API — an `overrides` bump either
fails to resolve or silently breaks syntax highlighting. The chain is static-render only:
it processes markdown the user's own server streams into the app, with no privilege
boundary and no network-trust decision. The renderer is scheduled for replacement
alongside the markdown pipeline (`streamdown-rn`), at which point this chain is removed.
Until then the advisories are documented debt, not an exploitable path.

## Threat model

See `docs/threat-model.md` for the full assessment (server trust, credential storage,
notification surface, transport).
