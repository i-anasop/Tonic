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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Bot, Send, Mic, MicOff, Plus, BarChart2, Calendar, Zap, CheckCircle, CalendarClock, Crown, Cpu } from "lucide-react-native";
import { v4 as uuidv4 } from "uuid";

import { Colors } from "@/constants/colors";
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { API_BASE_URL, TON_REWARD_ADDRESS } from "@/constants/api";
import { useTasks } from "@/providers/TasksProvider";
import { useAppState } from "@/providers/AppStateProvider";
import { useTonConnect } from "@/hooks/useTonConnect";
import type { AgentMessage, AgentAction } from "@/types/tasks";

const DEEP_ANALYSIS_TON_COST = "50000000";

const QUICK_ACTIONS = [
  { label: "Today's Plan", icon: Calendar, prompt: "Plan my day and show what I should focus on right now." },
  { label: "Add Task", icon: Plus, prompt: "Help me add a new task." },
  { label: "My Stats", icon: BarChart2, prompt: "Give me a detailed productivity analysis with honest feedback." },
  { label: "Motivate Me", icon: Zap, prompt: "I need some motivation to get things done. Analyze my tasks and fire me up." },
];

// ── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) => Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: false }),
      Animated.delay(600),
    ])).start();
    anim(dot1, 0); anim(dot2, 200); anim(dot3, 400);
  }, []);
  return (
    <View style={styles.typingContainer}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.typingDot, { opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />
      ))}
    </View>
  );
}

// ── Action Bubble ────────────────────────────────────────────────────────────
function ActionBubble({ action }: { action: AgentAction }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (action.type === "create_task" && action.data) {
    const task = action.data as any;
    return (
      <View style={styles.actionBubble}>
        <View style={styles.actionBubbleHeader}>
          <CheckCircle size={13} color={Colors.success} />
          <Text style={styles.actionBubbleLabel}>Task Created</Text>
        </View>
        <Text style={styles.actionBubbleTitle}>{task.title}</Text>
        <View style={styles.actionBubbleMeta}>
          <View style={[styles.priBadge, { backgroundColor: task.priority === "high" ? `${Colors.danger}20` : task.priority === "medium" ? `${Colors.warning}20` : `${Colors.success}20` }]}>
            <Text style={[styles.priBadgeText, { color: task.priority === "high" ? Colors.danger : task.priority === "medium" ? Colors.warning : Colors.success }]}>{task.priority}</Text>
          </View>
          <Text style={styles.actionMeta}>{task.category}</Text>
          <Text style={styles.actionMeta}>{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
        </View>
      </View>
    );
  }

  if (action.type === "complete_task" && action.data) {
    const d = action.data as any;
    return (
      <View style={[styles.actionBubble, { borderColor: `${Colors.success}40` }]}>
        <View style={styles.actionBubbleHeader}>
          <CheckCircle size={13} color={Colors.success} />
          <Text style={[styles.actionBubbleLabel, { color: Colors.success }]}>Task Completed</Text>
        </View>
        <Text style={styles.actionBubbleTitle}>{d.taskTitle}</Text>
      </View>
    );
  }

  if (action.type === "reschedule_task" && action.data) {
    const d = action.data as any;
    const newDate = new Date(d.newDueDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return (
      <View style={[styles.actionBubble, { borderColor: `${Colors.blue}40` }]}>
        <View style={styles.actionBubbleHeader}>
          <CalendarClock size={13} color={Colors.blue} />
          <Text style={[styles.actionBubbleLabel, { color: Colors.blue }]}>Rescheduled</Text>
        </View>
        <Text style={styles.actionBubbleTitle}>{d.taskTitle}</Text>
        <Text style={styles.actionMeta}>→ {newDate}</Text>
      </View>
    );
  }

  if (action.type === "specialist_hired" && action.data) {
    const d = action.data as any;
    const nameMap: Record<string, string> = { habit_coach: "HabitOS", schedule_optimizer: "ChronoX", goal_strategist: "VisionCore" };
    const specialistName = d.specialistName || nameMap[d.specialist] || d.specialist;
    return (
      <View style={[styles.actionBubble, { borderColor: `${Colors.gold}55` }]}>
        <View style={styles.actionBubbleHeader}>
          <Cpu size={13} color={Colors.gold} />
          <Text style={[styles.actionBubbleLabel, { color: Colors.gold }]}>Specialist Hired · $TONIC Protocol</Text>
        </View>
        <Text style={styles.actionBubbleTitle}>{specialistName}</Text>
        <View style={styles.actionBubbleMeta}>
          <View style={[styles.priBadge, { backgroundColor: `${Colors.gold}20` }]}>
            <Text style={[styles.priBadgeText, { color: Colors.gold }]}>-{d.tonicCost} $TONIC</Text>
          </View>
          <Text style={styles.actionMeta}>balance: {d.tonicRemaining}</Text>
        </View>
      </View>
    );
  }

  return null;
}

// ── Blinking Cursor ──────────────────────────────────────────────────────────
function BlinkingCursor() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.Text style={{ opacity, color: Colors.gold, fontSize: 15, lineHeight: 21 }}>▍</Animated.Text>;
}

// ── Markdown renderer ────────────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <Text key={i} style={{ fontWeight: "700" }}>{part.slice(2, -2)}</Text>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <Text key={i} style={{ fontStyle: "italic" }}>{part.slice(1, -1)}</Text>;
    return <Text key={i}>{part}</Text>;
  });
}

function MarkdownText({ text, style, animate }: { text: string; style?: object; animate?: boolean }) {
  const [count, setCount] = React.useState(animate ? 0 : text.length);
  useEffect(() => {
    if (!animate) { setCount(text.length); return; }
    setCount(0);
    const batchSize = Math.max(1, Math.ceil(text.length / 55));
    let current = 0;
    const timer = setInterval(() => {
      current += batchSize;
      if (current >= text.length) { setCount(text.length); clearInterval(timer); }
      else { setCount(current); }
    }, 12);
    return () => clearInterval(timer);
  }, [text, animate]);

  const displayText = text.slice(0, count);
  const lines = displayText.split("\n");
  return (
    <View style={{ gap: 2 }}>
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <Text key={i} style={[style, { fontWeight: "700", fontSize: 14, marginTop: 4 }]}>{renderInline(line.slice(4))}</Text>;
        if (line.startsWith("## ")) return <Text key={i} style={[style, { fontWeight: "700", fontSize: 15, marginTop: 6 }]}>{renderInline(line.slice(3))}</Text>;
        if (line.startsWith("# ")) return <Text key={i} style={[style, { fontWeight: "800", fontSize: 16, marginTop: 6 }]}>{renderInline(line.slice(2))}</Text>;
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

// ── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message, isStreaming }: { message: AgentMessage; isStreaming?: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isUser = message.role === "user";
  const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  if (message.isLoading) {
    return (
      <View style={[styles.msgWrapper, styles.aiWrapper]}>
        <View style={styles.aiBubbleHeader}>
          <View style={styles.aiAvSmall}><Bot size={11} color="#0D1117" /></View>
          <Text style={styles.aiName}>Tonic</Text>
        </View>
        <View style={[styles.bubble, styles.aiBubble]}>
          <TypingIndicator />
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.msgWrapper, isUser ? styles.userWrapper : styles.aiWrapper, { opacity: opacityAnim, transform: [{ translateX: slideAnim }] }]}>
      {!isUser && (
        <View style={styles.aiBubbleHeader}>
          <View style={styles.aiAvSmall}><Bot size={11} color="#0D1117" /></View>
          <Text style={styles.aiName}>Tonic</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {isUser ? (
          <Text style={styles.userText}>{message.content}</Text>
        ) : (
          <View style={{ gap: 0 }}>
            <MarkdownText text={message.content} style={styles.aiText} animate={message.isNew} />
            {isStreaming && message.content.length > 0 && <BlinkingCursor />}
          </View>
        )}
        {message.action && <ActionBubble action={message.action} />}
      </View>
      <Text style={[styles.msgTime, isUser && styles.msgTimeRight]}>
        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </Animated.View>
  );
}

// ── Agent Screen ─────────────────────────────────────────────────────────────
export default function AgentScreen() {
  const { tasks, addTask, toggleTaskStatus, updateTask, getStats } = useTasks();
  const { user } = useAppState();
  const { colors } = useTheme();
  const { isConnected: isTonConnected, connectWallet: connectTonWallet, sendTransaction, isSendingTx } = useTonConnect();
  const router = useRouter();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! I'm Tonic, your AI productivity agent. I can create tasks, complete them, reschedule, plan your day, and give real-time insights — all through natural conversation.\n\nI also coordinate specialist sub-agents via the **$TONIC Protocol** — just ask me to delegate! What do you need?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const abortRef = useRef<AbortController | null>(null);
  const deepAbortRef = useRef<AbortController | null>(null);
  const speechRef = useRef<any>(null);

  useEffect(() => () => {
    abortRef.current?.abort();
    deepAbortRef.current?.abort();
    speechRef.current?.stop();
  }, []);

  const scrollToBottom = useCallback(() => { setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100); }, []);
  useEffect(() => { scrollToBottom(); }, [messages]);

  const startVoice = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setInput("Voice not supported in this browser. Try Chrome!"); return; }
    if (isListening && speechRef.current) { speechRef.current.stop(); setIsListening(false); return; }
    speechRef.current = new SR();
    speechRef.current.continuous = false;
    speechRef.current.interimResults = true;
    speechRef.current.lang = "en-US";
    speechRef.current.onstart = () => setIsListening(true);
    speechRef.current.onend = () => setIsListening(false);
    speechRef.current.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join("");
      setInput(transcript);
      if (event.results[event.results.length - 1].isFinal) setIsListening(false);
    };
    speechRef.current.onerror = () => setIsListening(false);
    speechRef.current.start();
  }, [isListening]);

  const applyAction = useCallback((action: AgentAction) => {
    if (action.type === "create_task" && action.data) {
      const d = action.data as any;
      addTask({ title: d.title, category: d.category || "work", priority: d.priority || "medium", status: "pending", dueDate: new Date(d.dueDate), description: d.description || undefined, aiSuggested: true });
    } else if (action.type === "complete_task" && action.data) {
      const d = action.data as any;
      const task = tasks.find((t) => t.id === d.taskId || t.title.toLowerCase() === (d.taskTitle || "").toLowerCase());
      if (task && task.status !== "completed") toggleTaskStatus(task.id);
    } else if (action.type === "reschedule_task" && action.data) {
      const d = action.data as any;
      const task = tasks.find((t) => t.id === d.taskId || t.title.toLowerCase() === (d.taskTitle || "").toLowerCase());
      if (task) updateTask(task.id, { dueDate: new Date(d.newDueDate) });
    } else if (action.type === "update_priority" && action.data) {
      const d = action.data as any;
      const task = tasks.find((t) => t.id === d.taskId || t.title.toLowerCase() === (d.taskTitle || "").toLowerCase());
      if (task && d.priority) updateTask(task.id, { priority: d.priority });
    }
  }, [tasks, addTask, toggleTaskStatus, updateTask]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    const userMsg: AgentMessage = { id: uuidv4(), role: "user", content: trimmed, timestamp: new Date() };
    const loadingMsg: AgentMessage = { id: "loading", role: "assistant", content: "", timestamp: new Date(), isLoading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    const aiMsgId = uuidv4();

    try {
      const stats = await getStats();
      const history = messages.filter((m) => !m.isLoading && m.id !== "welcome").slice(-12).map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_BASE_URL}/api/agent/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: trimmed }],
          tasks: tasks.map((t) => ({ id: t.id, title: t.title, category: t.category, priority: t.priority, status: t.status, dueDate: t.dueDate })),
          stats, userId: user?.id,
        }),
        signal: (abortRef.current = new AbortController()).signal,
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      // Swap loading → empty streaming message
      setStreamingMsgId(aiMsgId);
      setMessages((prev) => prev.filter((m) => m.id !== "loading").concat({
        id: aiMsgId, role: "assistant", content: "", timestamp: new Date(),
      }));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let aiContent = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]" || raw === "") continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.delta) {
              aiContent += evt.delta;
              setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: aiContent } : m));
            }
            if (evt.action) {
              const action = evt.action as AgentAction;
              setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, action } : m));
              applyAction(action);
            }
            if (evt.done) break outer;
          } catch {}
        }
      }

      // Ensure fallback content
      if (!aiContent) {
        setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: "Done!" } : m));
      }
    } catch {
      setMessages((prev) => {
        const hasMsg = prev.some((m) => m.id === aiMsgId && m.content);
        if (hasMsg) return prev.filter((m) => m.id !== "loading");
        return prev.filter((m) => m.id !== "loading" && m.id !== aiMsgId).concat({
          id: uuidv4(), role: "assistant", content: "I'm having connection issues. Check your network and try again.", timestamp: new Date(),
        });
      });
    } finally {
      setIsLoading(false);
      setStreamingMsgId(null);
    }
  }, [isLoading, messages, tasks, user, getStats, applyAction]);

  const handleDeepStrategy = useCallback(async () => {
    if (isLoading || isDeepAnalyzing) return;

    const runDeepAnalysis = async () => {
      setIsDeepAnalyzing(true);
      const loadingId = uuidv4();
      const waitMsg: AgentMessage = {
        id: loadingId, role: "assistant",
        content: "🔮 Running deep strategic analysis...",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, waitMsg]);

      deepAbortRef.current?.abort();
      const ctrl = new AbortController();
      deepAbortRef.current = ctrl;

      try {
        const stats = await getStats();
        const res = await fetch(`${API_BASE_URL}/api/agent/deep-analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasks: tasks.map((t) => ({ id: t.id, title: t.title, category: t.category, priority: t.priority, status: t.status, dueDate: t.dueDate })),
            stats,
            userId: user?.id,
          }),
          signal: ctrl.signal,
        });
        if (!ctrl.signal.aborted) {
          const data = await res.json() as { analysis?: string; error?: string };
          const analysis = data.analysis || data.error || "Analysis unavailable.";
          setMessages((prev) => prev.map((m) =>
            m.id === loadingId ? { ...m, content: analysis, isNew: true } : m
          ));
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setMessages((prev) => prev.map((m) =>
            m.id === loadingId ? { ...m, content: "Deep analysis failed. Check your connection and try again." } : m
          ));
        }
      } finally {
        setIsDeepAnalyzing(false);
      }
    };

    // Check if user is a Tonian (verified badge holder)
    let isTonian = false;
    if (user?.id) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = await res.json() as { user?: { verifiedAt?: string | null } };
          isTonian = !!data.user?.verifiedAt;
        }
      } catch { /* offline — treat as non-Tonian */ }
    }

    if (isTonian) {
      void runDeepAnalysis();
      return;
    }

    // Show paywall for non-Tonian users
    Alert.alert(
      "🔮 Deep Strategy Session",
      "Get a full strategic productivity report — 5× deeper than standard analysis.\n\n• FREE for Tonian Badge holders (lifetime)\n• 0.05 TON for this session\n\nThe Tonian Badge (1 TON) gives permanent free access + 2× point multiplier.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Get Tonian Badge →",
          onPress: () => { router.push("/tonian-badge" as any); },
        },
        {
          text: "Pay 0.05 TON",
          onPress: async () => {
            if (!isTonConnected) {
              Alert.alert("Wallet Required", "Connect your TON wallet to pay for this session.", [
                { text: "Connect Wallet", onPress: () => void connectTonWallet() },
                { text: "Cancel", style: "cancel" },
              ]);
              return;
            }
            try {
              const result = await sendTransaction({
                to: TON_REWARD_ADDRESS,
                amount: DEEP_ANALYSIS_TON_COST,
                comment: `Tonic AI | Deep Strategy Session | ${user?.name || "User"}`,
              });
              if (result) void runDeepAnalysis();
            } catch {
              Alert.alert("Transaction Failed", "Could not complete payment. Check your wallet balance and try again.");
            }
          },
        },
      ]
    );
  }, [isLoading, isDeepAnalyzing, tasks, getStats, user, isTonConnected, connectTonWallet, sendTransaction, router]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiAvatar}><Bot size={18} color="#0D1117" /></View>
          <View>
            <Text style={styles.headerTitle}>Tonic Agent</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>GPT-4o · 8 Tools · $TONIC Protocol</Text>
            </View>
          </View>
        </View>
        <View style={styles.tonBadge}><Text style={styles.tonBadgeText}>⛓️ TON</Text></View>
      </View>

      {/* Messages */}
      <ScrollView ref={scrollRef} style={styles.msgs} contentContainerStyle={styles.msgsContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {messages.map((msg) => <MessageBubble key={msg.id} message={msg} isStreaming={streamingMsgId === msg.id} />)}
      </ScrollView>

      {/* Quick actions grid */}
      <View style={styles.quickGrid}>
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <TouchableOpacity key={action.label} style={styles.quickChip} onPress={() => sendMessage(action.prompt)} disabled={isLoading || isDeepAnalyzing} activeOpacity={0.75}>
              <Icon size={14} color={Colors.gold} />
              <Text style={styles.quickText}>{action.label}</Text>
            </TouchableOpacity>
          );
        })}
        {/* Premium Deep Strategy button */}
        <TouchableOpacity
          style={[styles.quickChip, styles.deepChip]}
          onPress={() => void handleDeepStrategy()}
          disabled={isLoading || isDeepAnalyzing || isSendingTx}
          activeOpacity={0.75}
        >
          <Crown size={14} color="#0D1117" />
          <Text style={[styles.quickText, { color: "#0D1117", fontWeight: "700" }]}>
            {isDeepAnalyzing ? "Analyzing…" : "Deep Strategy"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input bar */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.inputRow}>
          <TouchableOpacity style={[styles.micBtn, isListening && styles.micBtnActive]} onPress={startVoice} activeOpacity={0.8}>
            {isListening ? <MicOff size={19} color={Colors.danger} /> : <Mic size={19} color={colors.textSecondary} />}
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { scrollbarWidth: "none", outlineWidth: 0, overflowY: "hidden" } as any]}
            placeholder={isListening ? "Listening…" : "Message Tonic…"}
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
            editable={!isLoading}
          />
          <TouchableOpacity style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnOff]} onPress={() => sendMessage(input)} disabled={!input.trim() || isLoading} activeOpacity={0.8}>
            {isLoading ? <ActivityIndicator size="small" color="#0D1117" /> : <Send size={17} color={input.trim() ? "#0D1117" : colors.textMuted} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgSecondary },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gold, justifyContent: "center", alignItems: "center", shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 10, elevation: 6 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  statusText: { fontSize: 11, color: colors.textSecondary },
  tonBadge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, backgroundColor: `${Colors.gold}15`, borderWidth: 1, borderColor: `${Colors.gold}35` },
  tonBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.gold },

  msgs: { flex: 1 },
  msgsContent: { padding: 16, paddingBottom: 8, gap: 14 },
  msgWrapper: { maxWidth: "84%", gap: 4 },
  userWrapper: { alignSelf: "flex-end", alignItems: "flex-end" },
  aiWrapper: { alignSelf: "flex-start", alignItems: "flex-start" },
  aiBubbleHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  aiAvSmall: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.gold, justifyContent: "center", alignItems: "center" },
  aiName: { fontSize: 11, fontWeight: "700", color: Colors.gold },
  bubble: { borderRadius: 18, paddingHorizontal: 15, paddingVertical: 11, gap: 10 },
  userBubble: { backgroundColor: Colors.gold, borderBottomRightRadius: 5 },
  aiBubble: { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 5 },
  userText: { color: "#0D1117", fontSize: 14, fontWeight: "500", lineHeight: 21 },
  aiText: { color: colors.textPrimary, fontSize: 14, lineHeight: 21 } as any,
  msgTime: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  msgTimeRight: { textAlign: "right" },
  typingContainer: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 3, paddingHorizontal: 2 },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.gold },

  actionBubble: { backgroundColor: colors.bgTertiary, borderRadius: 11, padding: 11, borderWidth: 1, borderColor: `${Colors.gold}28`, gap: 5 },
  actionBubbleHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionBubbleLabel: { fontSize: 10, fontWeight: "700", color: Colors.success, textTransform: "uppercase", letterSpacing: 0.5 },
  actionBubbleTitle: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  actionBubbleMeta: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" },
  priBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  priBadgeText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  actionMeta: { fontSize: 11, color: colors.textSecondary, textTransform: "capitalize" },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgSecondary },
  quickChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: `${Colors.gold}28`, flex: 1, minWidth: "45%" },
  deepChip: { backgroundColor: Colors.gold, borderColor: Colors.gold, shadowColor: Colors.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 },
  quickText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, flex: 1 },

  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 14, paddingVertical: 10, paddingBottom: Platform.OS === "ios" ? 12 : 14, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgSecondary },
  micBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bgTertiary, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  micBtnActive: { backgroundColor: `${Colors.danger}18`, borderColor: Colors.danger },
  input: { flex: 1, minHeight: 42, maxHeight: 110, backgroundColor: colors.bgTertiary, borderRadius: 21, paddingHorizontal: 16, paddingVertical: 11, color: colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.gold, justifyContent: "center", alignItems: "center", shadowColor: Colors.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  sendBtnOff: { backgroundColor: colors.bgTertiary, shadowOpacity: 0, elevation: 0 },
});
