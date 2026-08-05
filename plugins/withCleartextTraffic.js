// Config plugin: allow cleartext (http://) traffic in release builds.
//
// The app's core use case is connecting to self-hosted opencode servers on a
// LAN or Tailscale, typically over plain http. iOS already allows arbitrary
// loads (NSAppTransportSecurity.NSAllowsArbitraryLoads in app.json) and the
// debug Android manifest sets android:usesCleartextTraffic="true", but the
// release manifest never did — so release APKs failed every http:// probe with
// "CLEARTEXT communication ... not permitted by network security policy".
//
// This mirrors the debug manifest so release builds behave identically.
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application[0];
    if (app) {
      app.$['android:usesCleartextTraffic'] = 'true';
    }
    return config;
  });
};
