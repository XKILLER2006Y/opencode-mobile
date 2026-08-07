import type { PermissionRequest, QuestionRequest } from "../../lib/sdk"
// Direct file imports (not the chat barrel) so jest doesn't pull the
// bottom-sheet/reanimated graph through the barrel's re-exports.
import { PermissionPrompt } from "../chat/PermissionPrompt"
import { QuestionPrompt } from "../chat/QuestionPrompt"
import { StatusIndicator } from "../chat/StatusIndicator"

interface Props {
  sessionID?: string
  isDark: boolean
  permissions: PermissionRequest[]
  onPermissionReply: (requestID: string, reply: "once" | "always" | "reject") => void
  questions: QuestionRequest[]
  onQuestionReply: (requestID: string, answers: string[][]) => void
  onQuestionReject: (requestID: string) => void
}

// Bottom "status chrome" of the session screen: the live status bar plus any
// pending permission / question prompts. Rendered below the message list and
// above the composer so confirmations sit next to the action.
export function StatusChrome({
  sessionID,
  isDark,
  permissions,
  onPermissionReply,
  questions,
  onQuestionReply,
  onQuestionReject,
}: Props) {
  return (
    <>
      {sessionID && <StatusIndicator sessionID={sessionID} isDark={isDark} />}

      {permissions.map((perm) => (
        <PermissionPrompt
          key={perm.id}
          permission={perm}
          isDark={isDark}
          onReply={(reply) => onPermissionReply(perm.id, reply)}
        />
      ))}

      {questions.map((q) => (
        <QuestionPrompt
          key={q.id}
          request={q}
          isDark={isDark}
          onReply={(answers) => onQuestionReply(q.id, answers)}
          onReject={() => onQuestionReject(q.id)}
        />
      ))}
    </>
  )
}