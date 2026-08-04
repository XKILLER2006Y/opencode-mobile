import { useRef, useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

interface QuestionOption {
  label: string
  description: string
}

interface Question {
  question: string
  header: string
  options: QuestionOption[]
  multiple?: boolean
  custom?: boolean
}

interface Props {
  request: {
    id: string
    questions: Question[]
  }
  isDark: boolean
  onReply: (answers: string[][]) => void
  onReject: () => void
}

export function QuestionPrompt({ request, isDark, onReply, onReject }: Props) {
  const { t } = useTranslation()
  const [answers, setAnswers] = useState<string[][]>(request.questions.map(() => []))
  const [custom, setCustom] = useState("")
  const [showCustom, setShowCustom] = useState(false)
  const [current, setCurrent] = useState(0)

  // A question is answered exactly once. Without this guard, a double-tap on a
  // single-select option schedules two `onReply` timers; the second reply hits
  // an already-resolved request server-side and surfaces a spurious
  // "Reply failed" alert even though the answer went through.
  const replied = useRef(false)
  const reply = (a: string[][]) => {
    if (replied.current) return
    replied.current = true
    onReply(a)
  }
  const reject = () => {
    if (replied.current) return
    replied.current = true
    onReject()
  }

  const q = request.questions[current]
  if (!q) return null

  const toggleOption = (label: string) => {
    setAnswers((prev) => {
      const copy = [...prev]
      const selected = copy[current] || []
      if (q.multiple) {
        copy[current] = selected.includes(label) ? selected.filter((a) => a !== label) : [...selected, label]
      } else {
        copy[current] = [label]
        if (request.questions.length === 1) {
          setTimeout(() => reply(copy), 100)
        }
      }
      return copy
    })
  }

  const submitCustom = () => {
    if (!custom.trim()) return
    const copy = [...answers]
    copy[current] = [custom.trim()]
    setAnswers(copy)
    setCustom("")
    setShowCustom(false)
    if (request.questions.length === 1) {
      reply(copy)
    }
  }

  return (
    <View style={[s.card, isDark && s.cardDark]}>
      <View style={s.header}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#8b5cf6" />
        <Text style={[s.title, isDark && s.textWhite]}>{q.header || t("chat.questionPrompt.headerFallback")}</Text>
      </View>
      <Text style={[s.question, isDark && s.textWhite]}>{q.question}</Text>

      <View style={s.options}>
        {q.options.map((opt) => {
          const selected = (answers[current] || []).includes(opt.label)
          return (
            <TouchableOpacity
              key={opt.label}
              style={[
                s.option,
                isDark && s.optionDark,
                selected && s.optionSelected,
                selected && isDark && s.optionSelectedDark,
              ]}
              onPress={() => toggleOption(opt.label)}
            >
              <Text style={[s.optionLabel, isDark && s.textWhite, selected && s.optionLabelSelected]}>{opt.label}</Text>
              {opt.description ? <Text style={[s.optionDesc, isDark && s.metaDark]}>{opt.description}</Text> : null}
            </TouchableOpacity>
          )
        })}

        {q.custom !== false &&
          (showCustom ? (
            <View style={s.customRow}>
              <TextInput
                style={[s.customInput, isDark && s.customInputDark]}
                placeholder={t("chat.questionPrompt.answerPlaceholder")}
                placeholderTextColor={isDark ? "#666666" : "#999999"}
                value={custom}
                onChangeText={setCustom}
                onSubmitEditing={submitCustom}
                autoFocus
              />
              <TouchableOpacity onPress={submitCustom} style={s.customSubmit}>
                <Ionicons name="send" size={18} color="#8b5cf6" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[s.option, isDark && s.optionDark]} onPress={() => setShowCustom(true)}>
              <Text style={[s.optionLabel, { color: "#8b5cf6" }]}>{t("chat.questionPrompt.customAnswerLabel")}</Text>
            </TouchableOpacity>
          ))}
      </View>

      <View style={s.footer}>
        <TouchableOpacity onPress={reject}>
          <Text style={[s.dismiss, isDark && s.metaDark]}>{t("chat.questionPrompt.dismiss")}</Text>
        </TouchableOpacity>
        {(request.questions.length > 1 || q.multiple) && (
          <TouchableOpacity
            style={[s.submitBtn, isDark && s.submitBtnDark]}
            onPress={() => {
              if (current < request.questions.length - 1) {
                setCurrent(current + 1)
              } else {
                reply(answers)
              }
            }}
          >
            <Text style={s.submitText}>
              {current < request.questions.length - 1 ? t("chat.questionPrompt.next") : t("chat.questionPrompt.submit")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    margin: 12,
    padding: 16,
    backgroundColor: "rgba(139, 92, 246, 0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  cardDark: { backgroundColor: "rgba(139, 92, 246, 0.08)", borderColor: "rgba(139, 92, 246, 0.25)" },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  title: { fontSize: 15, fontWeight: "600", color: "#7C3AED" },
  textWhite: { color: "#A78BFA" },
  question: { fontSize: 14, lineHeight: 20, color: "#09090B", marginBottom: 12 },
  metaDark: { color: "#A1A1AA" },

  options: { gap: 8 },
  option: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  optionDark: { backgroundColor: "#18181B", borderColor: "#27272A" },
  optionSelected: { borderColor: "#8B5CF6", backgroundColor: "rgba(139, 92, 246, 0.12)" },
  optionSelectedDark: { borderColor: "#A78BFA", backgroundColor: "rgba(139, 92, 246, 0.2)" },
  optionLabel: { fontSize: 14, fontWeight: "600", color: "#09090B" },
  optionLabelSelected: { color: "#7C3AED" },
  optionDesc: { fontSize: 12, color: "#71717A", marginTop: 2 },

  customRow: { flexDirection: "row", gap: 8 },
  customInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    color: "#09090B",
  },
  customInputDark: { backgroundColor: "#18181B", borderColor: "#27272A", color: "#FAFAFA" },
  customSubmit: { justifyContent: "center", alignItems: "center", padding: 8 },

  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  dismiss: { fontSize: 14, color: "#71717A" },
  submitBtn: { backgroundColor: "#8B5CF6", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  submitBtnDark: { backgroundColor: "#7C3AED" },
  submitText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
})
