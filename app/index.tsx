import React, { useState } from 'react';
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
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { MessageCircle, Plus, Search, Sparkles, Clock, Zap } from 'lucide-react-native';
import { useChat } from '@/lib/chat-context';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatHomeScreen() {
  const { conversations, startNewConversation, selectConversation, isLoading } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    startNewConversation();
    router.push('/chat/new' as any);
  };

  const handleSelectConversation = async (conversationId: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    selectConversation(conversationId);
    router.push(`/chat/${conversationId}` as any);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleSelectConversation(item.id)}
      testID={`conversation-${item.id}`}
      activeOpacity={0.7}
    >
      <View style={styles.conversationCard}>
        <View style={styles.conversationHeader}>
          <View style={styles.conversationIcon}>
            <MessageCircle size={18} color={Colors.light.tint} />
          </View>
          <View style={styles.conversationMeta}>
            <Text style={styles.conversationTime}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
        </View>
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.conversationPreview} numberOfLines={2}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const QuickActions = () => (
    <View style={styles.quickActions}>
      <Text style={styles.quickActionsTitle}>Quick Start</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity 
          style={styles.quickActionItem}
          onPress={() => {
            startNewConversation();
            router.push('/chat/new' as any);
          }}
        >
          <Sparkles size={24} color={Colors.light.tint} />
          <Text style={styles.quickActionText}>Creative Writing</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionItem}
          onPress={() => {
            startNewConversation();
            router.push('/chat/new' as any);
          }}
        >
          <Zap size={24} color={Colors.light.warning} />
          <Text style={styles.quickActionText}>Code Help</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={['#007AFF20', '#5856D620']}
        style={styles.emptyIconContainer}
      >
        <MessageCircle size={48} color={Colors.light.tint} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>Welcome to Claude</Text>
      <Text style={styles.emptySubtitle}>
        Your AI assistant for writing, analysis, math, coding, and creative projects.
      </Text>
      <QuickActions />
      <TouchableOpacity style={styles.startButton} onPress={handleNewChat}>
        <LinearGradient
          colors={['#007AFF', '#5856D6']}
          style={styles.startButtonGradient}
        >
          <Plus size={20} color="white" />
          <Text style={styles.startButtonText}>Start New Chat</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Claude</Text>
            <Text style={styles.headerSubtitle}>AI Assistant</Text>
          </View>
          <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
            <LinearGradient
              colors={['#007AFF', '#5856D6']}
              style={styles.newChatButtonGradient}
            >
              <Plus size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {conversations.length > 0 && (
          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <Search size={18} color={Colors.light.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search conversations..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.light.textSecondary}
              />
            </View>
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : filteredConversations.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.conversationsSection}>
            <View style={styles.conversationsHeader}>
              <Text style={styles.conversationsSectionTitle}>Recent Conversations</Text>
              <View style={styles.conversationsCount}>
                <Clock size={14} color={Colors.light.textSecondary} />
                <Text style={styles.conversationsCountText}>{filteredConversations.length}</Text>
              </View>
            </View>
            <FlatList
              data={filteredConversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item.id}
              style={styles.conversationsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.conversationsContent}
            />
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: Colors.light.background,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  newChatButton: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  newChatButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  conversationsSection: {
    flex: 1,
    backgroundColor: Colors.light.background,
    marginTop: 8,
  },
  conversationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  conversationsSectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  conversationsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conversationsCountText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  conversationsList: {
    flex: 1,
  },
  conversationsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  conversationItem: {
    marginVertical: 6,
  },
  conversationCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  conversationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  conversationPreview: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: Colors.light.background,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 28,
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
  quickActions: {
    width: '100%',
    marginBottom: 32,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  quickActionItem: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.text,
    marginTop: 8,
    textAlign: 'center',
  },
  startButton: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
});