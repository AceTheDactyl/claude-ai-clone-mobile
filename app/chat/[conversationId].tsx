import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Copy, RotateCcw, Mic, Paperclip, Sparkles, Zap, BookOpen, BarChart3 } from 'lucide-react-native';
import { useChat, Message } from '@/lib/chat-context';
import Colors, { quickPrompts } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { 
    messages, 
    sendMessage, 
    isSending, 
    currentConversationId,
    selectConversation,
    streamingMessage,
    isStreaming
  } = useChat();
  
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (conversationId && conversationId !== 'new' && conversationId !== currentConversationId) {
      selectConversation(conversationId);
    }
  }, [conversationId, currentConversationId, selectConversation]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive or streaming updates
    if (messages.length > 0 || streamingMessage) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, streamingMessage]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    
    // Haptic feedback on send
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    
    const messageToSend = inputText.trim();
    setInputText('');
    
    try {
      await sendMessage(messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      
      // Error haptic feedback
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await Clipboard.setStringAsync(content);
      
      // Haptic feedback on copy
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      Alert.alert('Copied', 'Message copied to clipboard');
    } catch (error) {
      console.error('Failed to copy message:', error);
      Alert.alert('Error', 'Failed to copy message');
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message; index: number }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.assistantMessage
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.assistantMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isUser ? styles.userMessageTime : styles.assistantMessageTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
        
        {!isUser && (
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => handleCopyMessage(item.content)}
          >
            <Copy size={16} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const TypingDots = () => {
    const dot1Opacity = useRef(new Animated.Value(0.4)).current;
    const dot2Opacity = useRef(new Animated.Value(0.4)).current;
    const dot3Opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
      const animateDots = () => {
        const duration = 600;
        const delay = 200;

        Animated.sequence([
          Animated.timing(dot1Opacity, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Opacity, {
            toValue: 0.4,
            duration,
            useNativeDriver: true,
          }),
        ]).start();

        setTimeout(() => {
          Animated.sequence([
            Animated.timing(dot2Opacity, {
              toValue: 1,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Opacity, {
              toValue: 0.4,
              duration,
              useNativeDriver: true,
            }),
          ]).start();
        }, delay);

        setTimeout(() => {
          Animated.sequence([
            Animated.timing(dot3Opacity, {
              toValue: 1,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(dot3Opacity, {
              toValue: 0.4,
              duration,
              useNativeDriver: true,
            }),
          ]).start();
        }, delay * 2);
      };

      const interval = setInterval(animateDots, 1800);
      animateDots(); // Start immediately

      return () => clearInterval(interval);
    }, [dot1Opacity, dot2Opacity, dot3Opacity]);

    return (
      <View style={styles.typingDots}>
        <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
        <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
        <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
      </View>
    );
  };

  const getIconComponent = (iconName: string) => {
    const iconProps = { size: 20, color: 'white' };
    switch (iconName) {
      case 'Sparkles': return <Sparkles {...iconProps} />;
      case 'Zap': return <Zap {...iconProps} />;
      case 'BookOpen': return <BookOpen {...iconProps} />;
      case 'BarChart3': return <BarChart3 {...iconProps} />;
      default: return <Sparkles {...iconProps} />;
    }
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInputText(prompt + ' ');
    inputRef.current?.focus();
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={['#007AFF20', '#5856D620']}
        style={styles.emptyIconContainer}
      >
        <Sparkles size={32} color={Colors.light.tint} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>Start a conversation</Text>
      <Text style={styles.emptySubtitle}>
        Ask me anything! I can help with writing, analysis, math, coding, and more.
      </Text>
      
      <View style={styles.quickPromptsContainer}>
        <Text style={styles.quickPromptsTitle}>Quick Start</Text>
        <View style={styles.quickPromptsGrid}>
          {quickPrompts.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.quickPromptItem}
              onPress={() => handleQuickPrompt(item.prompt)}
              activeOpacity={0.8}
            >
              <View style={[styles.quickPromptIcon, { backgroundColor: item.color }]}>
                {getIconComponent(item.icon)}
              </View>
              <Text style={styles.quickPromptText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={async () => {
              if (Platform.OS !== 'web') {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
          >
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Claude</Text>
          <TouchableOpacity 
            style={styles.regenerateButton}
            onPress={async () => {
              if (Platform.OS !== 'web') {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              // Regenerate last response functionality
              Alert.alert('Regenerate', 'This feature will regenerate the last response');
            }}
          >
            <RotateCcw size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <View style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, index) => `${item.timestamp}-${index}`}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }}
            />
          )}
          
          {/* Streaming message */}
          {isStreaming && streamingMessage && streamingMessage.trim() && (
            <View style={styles.messageContainer}>
              <View style={[styles.messageBubble, styles.assistantMessage]}>
                <Text style={[styles.messageText, styles.assistantMessageText]}>
                  {streamingMessage.trim()}<Text style={styles.cursor}>|</Text>
                </Text>
              </View>
            </View>
          )}
          
          {/* Typing indicator */}
          {isSending && !streamingMessage && (
            <View style={styles.typingContainer}>
              <View style={styles.typingBubble}>
                <TypingDots />
              </View>
            </View>
          )}
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity 
              style={styles.attachButton}
              onPress={() => Alert.alert('Attachments', 'File attachment feature coming soon!')}
            >
              <Paperclip size={20} color={Colors.light.textSecondary} />
            </TouchableOpacity>
            
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message Claude..."
              placeholderTextColor={Colors.light.textSecondary}
              multiline
              maxLength={4000}
              textAlignVertical="top"
              onSubmitEditing={Platform.OS === 'ios' ? undefined : handleSend}
              blurOnSubmit={false}
              returnKeyType={Platform.OS === 'ios' ? 'default' : 'send'}
            />
            
            {inputText.trim() ? (
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  isSending && styles.sendButtonDisabled
                ]}
                onPress={handleSend}
                disabled={isSending}
              >
                <Send 
                  size={20} 
                  color={isSending ? Colors.light.textSecondary : 'white'} 
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.voiceButton}
                onPress={() => Alert.alert('Voice Input', 'Voice recording feature coming soon!')}
              >
                <Mic size={20} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  regenerateButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: Colors.light.tint,
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: Colors.light.text,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  assistantMessageTime: {
    color: Colors.light.textSecondary,
  },
  copyButton: {
    marginTop: 4,
    padding: 4,
  },
  typingContainer: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  typingBubble: {
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.textSecondary,
    marginHorizontal: 2,
  },

  cursor: {
    color: Colors.light.tint,
    fontWeight: 'bold' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  quickPromptsContainer: {
    width: '100%',
  },
  quickPromptsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  quickPromptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickPromptItem: {
    width: '48%',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickPromptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickPromptText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.text,
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  voiceButton: {
    padding: 8,
    marginLeft: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    maxHeight: 120,
    paddingVertical: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.textSecondary,
  },
});