
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Clock,
  MessageSquarePlus,
  Search,
  Edit2,
  Check,
  X,
  Sparkles,
  MessagesSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversationStore } from '../store/conversationStore';
import { useDocumentStore } from '../store/documentStore';
import type { Conversation } from '../types';
import { clsx } from 'clsx';

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  if (Number.isNaN(date.getTime())) return '';

  const diffSec = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / 1000)
  );

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getGroupLabel(dateStr: string): string {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return 'Older';

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfYesterday = new Date(
    startOfToday.getTime() - 86400000
  );
  const startOfLast7Days = new Date(
    startOfToday.getTime() - 7 * 86400000
  );

  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';
  if (date >= startOfLast7Days) return 'Previous 7 Days';

  return 'Older';
}

const SkeletonChat: React.FC = () => (
  <div className="flex animate-pulse items-center gap-3 rounded-xl border border-[#2c2c2c] bg-[#191919] p-3">
    <div className="h-8 w-8 shrink-0 rounded-lg bg-[#2b2b2b]" />
    <div className="min-w-0 flex-1 space-y-2">
      <div className="h-3 w-4/5 rounded bg-[#2b2b2b]" />
      <div className="h-2 w-1/3 rounded bg-[#242424]" />
    </div>
  </div>
);

const ChatItem: React.FC<{
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}> = ({ conversation, isActive, onSelect, onDelete, onRename }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }

    if (confirmDelete) {
      setConfirmDelete(false);
      onDelete();
      return;
    }

    setConfirmDelete(true);

    deleteTimerRef.current = setTimeout(() => {
      setConfirmDelete(false);
      deleteTimerRef.current = null;
    }, 2500);
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(conversation.title);
    setConfirmDelete(false);
    setIsEditing(true);
  };

  const handleSaveEdit = (
    e?: React.MouseEvent<HTMLButtonElement> | React.FormEvent
  ) => {
    e?.stopPropagation();

    const nextTitle = editTitle.trim();

    if (nextTitle && nextTitle !== conversation.title) {
      onRename(nextTitle);
    }

    setIsEditing(false);
  };

  const handleCancelEdit = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    setEditTitle(conversation.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      onClick={isEditing ? undefined : onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-current={isActive ? 'true' : undefined}
      className={clsx(
        'group relative flex cursor-pointer items-center justify-between gap-2.5 rounded-xl border p-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70',
        isActive
          ? 'border-red-500/40 bg-red-500/[0.09] text-white shadow-sm shadow-red-950/20'
          : 'border-transparent bg-transparent text-neutral-400 hover:border-[#303030] hover:bg-[#1c1c1c] hover:text-neutral-100'
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <div
          className={clsx(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
            isActive
              ? 'border border-red-500/20 bg-red-500/10 text-red-400'
              : 'border border-[#303030] bg-[#202020] text-neutral-500 group-hover:text-neutral-300'
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={inputRef}
                type="text"
                maxLength={150}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-w-0 w-full rounded-lg border border-red-500/60 bg-[#101010] px-2 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-red-500/15"
                aria-label="Edit chat title"
              />

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editTitle.trim()}
                aria-label="Save chat title"
                className="rounded-md p-1.5 text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                aria-label="Cancel editing"
                className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-[#303030] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <p
                className={clsx(
                  'truncate text-xs font-medium leading-relaxed',
                  isActive ? 'text-white' : 'text-neutral-300'
                )}
                title={conversation.title}
              >
                {conversation.title}
              </p>

              <div className="mt-1.5 flex items-center gap-1.5">
                <Clock className="h-3 w-3 shrink-0 text-neutral-600" />
                <span className="text-[10px] text-neutral-500">
                  {formatRelativeTime(conversation.updatedAt)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={handleStartEdit}
            aria-label="Rename conversation"
            title="Rename chat"
            className="rounded-lg p-1.5 text-neutral-500 opacity-100 transition-all hover:bg-[#303030] hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            aria-label={
              confirmDelete
                ? 'Confirm delete conversation'
                : 'Delete conversation'
            }
            title={confirmDelete ? 'Click again to delete' : 'Delete chat'}
            className={clsx(
              'rounded-lg p-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
              confirmDelete
                ? 'bg-red-500/15 px-2 text-[10px] font-semibold text-red-400'
                : 'text-neutral-500 hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100'
            )}
          >
            {confirmDelete ? (
              'Delete?'
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export const ChatsPanel: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    isLoadingChats,
    newChat,
    selectChat,
    deleteChat,
    renameChat,
  } = useConversationStore();

  const { setActiveTab } = useDocumentStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleNewChat = () => {
    newChat();
    setActiveTab('chat');
  };

  const handleSelectChat = (id: string) => {
    selectChat(id);
    setActiveTab('chat');
  };

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return conversations;

    return conversations.filter((conversation) =>
      conversation.title.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const groupedConversations = useMemo(() => {
    const groups: Record<string, Conversation[]> = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    filteredConversations.forEach((chat) => {
      const label = getGroupLabel(chat.updatedAt);
      groups[label].push(chat);
    });

    return groups;
  }, [filteredConversations]);

  const groupKeys = [
    'Today',
    'Yesterday',
    'Previous 7 Days',
    'Older',
  ] as const;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#141414] text-white">
      {/* Sidebar header */}
      <div className="shrink-0 space-y-4 border-b border-[#2b2b2b] p-4">
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500 to-red-800 shadow-md shadow-red-950/30">
            <MessagesSquare className="h-4 w-4 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight">
                Synapse
              </span>
              <span className="rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-red-400">
                AI
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-neutral-500">
              Your knowledge space
            </p>
          </div>

          <Sparkles className="h-4 w-4 text-red-400/70" />
        </div>

        <button
          type="button"
          onClick={handleNewChat}
          aria-label="Start a new chat"
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-950/20 transition-all duration-200 hover:from-red-500 hover:to-red-600 hover:shadow-red-950/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:text-sm"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          <span>New chat</span>
        </button>

        {conversations.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              aria-label="Search conversations"
              className="w-full rounded-xl border border-[#303030] bg-[#1b1b1b] py-2 pl-9 pr-9 text-xs text-neutral-200 outline-none transition-colors placeholder:text-neutral-600 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500 transition-colors hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Conversation history */}
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {isLoadingChats ? (
          <div className="space-y-2">
            <SkeletonChat />
            <SkeletonChat />
            <SkeletonChat />
          </div>
        ) : conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex h-64 flex-col items-center justify-center px-4 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-[#202020] shadow-inner shadow-red-950/20">
              <MessageSquarePlus className="h-6 w-6 text-red-400" />
            </div>

            <h3 className="text-xs font-semibold text-neutral-200">
              Your story starts here
            </h3>

            <p className="mt-2 max-w-[210px] text-[11px] leading-relaxed text-neutral-500">
              Start a conversation and explore the knowledge in your documents.
            </p>

            <button
              type="button"
              onClick={handleNewChat}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/15 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <Plus className="h-3.5 w-3.5" />
              Start your first chat
            </button>
          </motion.div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center px-3 py-10 text-center">
            <Search className="mb-3 h-5 w-5 text-neutral-600" />
            <p className="text-xs font-medium text-neutral-400">
              No conversations found
            </p>
            <p className="mt-1 break-words text-[11px] text-neutral-600">
              No results for "{searchQuery}"
            </p>

            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs font-medium text-red-400 hover:text-red-300"
            >
              Clear search
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {groupKeys.map((key) => {
              const items = groupedConversations[key];

              if (!items || items.length === 0) return null;

              return (
                <motion.section
                  layout
                  key={key}
                  className="space-y-2"
                  aria-label={`${key} conversations`}
                >
                  <div className="flex items-center gap-2 px-2 pt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      {key}
                    </span>
                    <div className="h-px flex-1 bg-[#292929]" />
                    <span className="text-[10px] tabular-nums text-neutral-600">
                      {items.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {items.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        conversation={chat}
                        isActive={activeConversationId === chat.id}
                        onSelect={() => handleSelectChat(chat.id)}
                        onDelete={() => deleteChat(chat.id)}
                        onRename={(newTitle) =>
                          renameChat(chat.id, newTitle)
                        }
                      />
                    ))}
                  </div>
                </motion.section>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Sidebar footer */}
      <div className="shrink-0 border-t border-[#2b2b2b] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#303030] bg-[#1e1e1e]">
              <BrainIcon />
            </div>
            <div>
              <p className="text-[10px] font-medium text-neutral-400">
                Synapse AI
              </p>
              <p className="mt-0.5 text-[9px] text-neutral-600">
                Semantic search · RAG
              </p>
            </div>
          </div>

          <span className="rounded-md border border-[#303030] bg-[#1c1c1c] px-2 py-1 text-[9px] font-medium tabular-nums text-neutral-500">
            {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
          </span>
        </div>
      </div>
    </div>
  );
};

const BrainIcon: React.FC = () => (
  <Sparkles className="h-3.5 w-3.5 text-red-400" />
);

export default ChatsPanel;
