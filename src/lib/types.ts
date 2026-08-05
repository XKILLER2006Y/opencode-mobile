// Connection types for multiple server support
import type { TunnelMode } from "./connect-qr"

export type ConnectionType = "local" | "tunnel" | "cloud"

export interface ServerConnection {
  id: string
  name: string
  type: ConnectionType
  url: string
  // For auth
  username?: string
  // Password stored separately in SecureStore
  // Directory to use for this connection
  directory?: string
  // When last successfully connected
  lastConnected?: number
  // Is this the active connection?
  active?: boolean
  // How the tunnel was shared (opencode-remote): quick = random URL, named = custom subdomain
  tunnelMode?: TunnelMode
}

export interface AppSettings {
  // Require biometric auth to open app
  requireBiometric: boolean
  // Require biometric to send messages
  requireBiometricForMessages: boolean
  // Theme preference
  theme: "light" | "dark" | "system"
  // Show notifications for task completion
  notifications: boolean
}

// Re-export SDK types we'll use frequently
export type { Session, Message, Part, Project, Event, HealthResponse } from "./sdk"
