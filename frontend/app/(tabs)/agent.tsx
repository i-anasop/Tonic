import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bot, Send, Mic, MicOff, Plus, BarChart2, Calendar, Zap, CheckCircle } from "lucide-react-native";
import { v4 as uuidv4 } from "uuid";

import { Colors } from "@/constants/colors";
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { API_BASE_URL } from "@/constants/api";
import { useTasks } from "@/providers/TasksProvider";
import { useAppState } from "@/providers/AppStateProvider";
import type { AgentMessage, AgentAction } from "@/types/tasks";

const QUICK_ACTIONS = [
  { label: "Today's Plan", icon: Calendar, prompt: "Plan my day and show what I should focus on right now." },
  { label: "Add Task", icon: Plus, prompt: "Help me add a new task." },
  { label: "My Stats", icon: BarChart2, prompt: "Give me a detailed productivity analysis with honest feedback." },
  { label: "Motivate Me", icon: Zap, prompt: "I need some motivation to get things done. Analyze my tasks and fire me up." },
];

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: false }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: false }),
          Animated.delay(600),
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  return (
    <View style={styles.typingContainer}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.typingDot,
            {
              opacity: dot,
              transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
            },
          ]}
        />
      ))}
    </View>
  );
}

function ActionBubble({ action }: { action: AgentAction }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  if (action.type === "create_task" && action.data) {
    const task = action.data as any;
    return (
      <View style={styles.actionBubble}>
        <View style={styles.actionBubbleHeader}>
          <CheckCircle size={14} color={Colors.success} />
          <Text style={styles.actionBubbleLabel}>Task Created</Text>
        </View>
        <Text style={styles.actionBubbleTitle}>{task.title}</Text>
        <View style={styles.actionBubbleMeta}>
          <View style={[styles.priorityChip, { backgroundColor: task.priority === "high" ? `${Colors.danger}20` : task.priority === "medium" ? `${Colors.warning}20` : `${Colors.success}20` }]}>
            <Text style={[styles.priorityChipText, { color: task.priority === "high" ? Colors.danger : task.priority === "medium" ? Colors.warning : Colors.success }]}>
              {task.priority}
            </Text>
          </View>
          <Text style={styles.actionBubbleCategory}>{task.category}</Text>
          <Text style={styles.actionBubbleDue}>
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </Text>
        </View>
      </View>
    );
  }

  if (action.type === "complete_task" && action.data) {
    const d = action.data as any;
    return (
      <View style={[styles.actionBubble, { borderColor: `${Colors.success}40` }]}>
        <View style={styles.actionBubbleHeader}>
          <CheckCircle size={14} color={Colors.success} />
          <Text style={[styles.actionBubbleLabel, { color: Colors.success }]}>Task Completed</Text>
        </View>
        <Text style={styles.actionBubbleTitle}>{d.taskTitle}</Text>
      </View>
    );
  }

  return null;
}

function MarkdownText({ text, style }: { text: string; style?: object }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const lines = text.split("\n");
  return (
    <View style={{ gap: 2 }}>
      {lines.map((line, i) => {
        if (line.startsWith("### ")) {
          return <Text key={i} style={[style, { fontWeight: "700", fontSize: 14, marginTop: 4 }]}>{renderInline(line.slice(4))}</Text>;
        }
        if (line.startsWith("## ")) {
          return <Text key={i} style={[style, { fontWeight: "700", fontSize: 15, marginTop: 6 }]}>{renderInline(line.slice(3))}</Text>;
        }
        if (line.startsWith("# ")) {
          return <Text key={i} style={[style, { fontWeight: "800", fontSize: 16, marginTop: 6 }]}>{renderInline(line.slice(2))}</Text>;
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
              <Text style={[style, { lineHeight: 20 }]}>•</Text>
              <Text style={[style, { flex: 1, lineHeight: 20 }]}>{renderInline(line.slice(2))}</Text>
            </View>
          );
        }
        if (line === "") return <Text key={i} style={{ height: 4 }} />;
        return <Text key={i} style={[style, { lineHeight: 20 }]}>{renderInline(line)}</Text>;
      })}
    </View>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <Text key={i} style={{ fontWeight: "700" }}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <Text key={i} style={{ fontStyle: "italic" }}>{part.slice(1, -1)}</Text>;
    }
    return <Text key={i}>{part}</Text>;
  });
}

function MessageBubble({ message }: { message: AgentMessage }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isUser = message.role === "user";

  if (message.isLoading) {
    return (
      <View style={[styles.messageBubble, styles.aiBubble]}>
        <View style={styles.aiBubbleHeader}>
          <View style={styles.aiAvatarSmall}>
            <Bot size={12} color={colors.bgPrimary} />
          </View>
          <Text style={styles.aiName}>Tonic</Text>
        </View>
        <TypingIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.messageWrapper, isUser ? styles.userWrapper : styles.aiWrapper]}>
      {!isUser && (
        <View style={styles.aiBubbleHeader}>
          <View style={styles.aiAvatarSmall}>
            <Bot size={12} color={colors.bgPrimary} />
          </View>
          <Text style={styles.aiName}>Tonic</Text>
        </View>
      )}
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {isUser ? (
          <Text style={[styles.messageText, styles.userText]}>{message.content}</Text>
        ) : (
          <MarkdownText text={message.content} style={styles.aiText} />
        )}
        {message.action && <ActionBubble action={message.action} />}
      </View>
      <Text style={[styles.messageTime, isUser && styles.messageTimeRight]}>
        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </View>
  );
}

let speechRecognition: any = null;

export default function AgentScreen() {
  const { tasks, addTask, toggleTaskStatus, getStats } = useTasks();
  const { user } = useAppState();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! I'm Tonic, your AI productivity agent. I can create tasks, complete them, plan your day, and give real-time insights — all through natural conversation.\n\nWhat do you need?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startVoice = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setInput("Voice not supported in this browser. Try Chrome!");
      return;
    }

    if (isListening && speechRecognition) {
      speechRecognition.stop();
      setIsListening(false);
      return;
    }

    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = true;
    speechRecognition.lang = "en-US";

    speechRecognition.onstart = () => setIsListening(true);
    speechRecognition.onend = () => setIsListening(false);

    speechRecognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);

      if (event.results[event.results.length - 1].isFinal) {
        setIsListening(false);
      }
    };

    speechRecognition.onerror = () => setIsListening(false);
    speechRecognition.start();
  }, [isListening]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInput("");

    const userMsg: AgentMessage = {
      id: uuidv4(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    const loadingMsg: AgentMessage = {
      id: "loading",
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      const stats = await getStats();
      const conversationHistory = messages
        .filter((m) => !m.isLoading && m.id !== "welcome")
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${API_BASE_URL}/api/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...conversationHistory, { role: "user", content: trimmed }],
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            category: t.category,
            priority: t.priority,
            status: t.status,
            dueDate: t.dueDate,
          })),
          stats,
          userId: user?.id,
        }),
        signal: AbortSignal.timeout(30000),
      });

      const data = await response.json();
      const aiMsg: AgentMessage = {
        id: uuidv4(),
        role: "assistant",
        content: data.message || "I couldn't process that. Try again!",
        timestamp: new Date(),
        action: data.action || undefined,
      };

      if (data.action?.type === "create_task" && data.action.data) {
        const d = data.action.data as any;
        addTask({
          title: d.title,
          category: d.category || "work",
          priority: d.priority || "medium",
          status: "pending",
          dueDate: new Date(d.dueDate),
          description: d.description || undefined,
          aiSuggested: true,
        });
      }

      if (data.action?.type === "complete_task" && data.action.data) {
        const d = data.action.data as any;
        const task = tasks.find((t) => t.id === d.taskId || t.title.toLowerCase() === (d.taskTitle || "").toLowerCase());
        if (task && task.status !== "completed") {
          toggleTaskStatus(task.id);
        }
      }

      setMessages((prev) => prev.filter((m) => m.id !== "loading").concat(aiMsg));
    } catch (err) {
      const errMsg: AgentMessage = {
        id: uuidv4(),
        role: "assistant",
        content: "I'm having connection issues. Check your network and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => prev.filter((m) => m.id !== "loading").concat(errMsg));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, tasks, user, getStats, addTask, toggleTaskStatus]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiAvatar}>
            <Bot size={20} color={colors.bgPrimary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Tonic Agent</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>GPT-5.2 · Function Calling</Text>
            </View>
          </View>
        </View>
        <View style={styles.tonBadge}>
          <Text style={styles.tonBadgeText}>TON</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </ScrollView>

      <View style={styles.quickActionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={action.label}
                style={styles.quickActionChip}
                onPress={() => sendMessage(action.prompt)}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Icon size={14} color={Colors.gold} />
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={startVoice}
            activeOpacity={0.8}
          >
            {isListening ? (
              <MicOff size={20} color={Colors.danger} />
            ) : (
              <Mic size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { scrollbarWidth: "none", outlineWidth: 0, overflowY: "hidden" } as any]}
            placeholder={isListening ? "Listening..." : "Message Tonic..."}
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.bgPrimary} />
            ) : (
              <Send size={18} color={input.trim() ? colors.bgPrimary : colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgSecondary,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  tonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: `${Colors.gold}15`,
    borderWidth: 1,
    borderColor: `${Colors.gold}40`,
  },
  tonBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.gold,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
    gap: 16,
  },
  messageWrapper: {
    maxWidth: "85%",
    gap: 4,
  },
  userWrapper: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  aiWrapper: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  aiBubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  aiAvatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  aiName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.gold,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  userBubble: {
    backgroundColor: Colors.gold,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: colors.bgPrimary,
    fontWeight: "500",
  },
  aiText: {
    color: colors.textPrimary,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  messageTimeRight: {
    textAlign: "right",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  actionBubble: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: `${Colors.gold}30`,
    gap: 6,
  },
  actionBubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBubbleLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.success,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionBubbleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  actionBubbleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  priorityChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityChipText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  actionBubbleCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  actionBubbleDue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  quickActionsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
  },
  quickActions: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickActionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: `${Colors.gold}30`,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 12 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgSecondary,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgTertiary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  micButtonActive: {
    backgroundColor: `${Colors.danger}20`,
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.bgTertiary,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: colors.bgTertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
});
