import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';

import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markdown';

import {
  Send,
  Bot,
  User,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap,
  Sparkles,
  RotateCcw,
  Square,
  Copy,
  Check,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { chatApi } from '../services/api';
import { useDocumentStore } from '../store/documentStore';
import { useConversationStore } from '../store/conversationStore';
import type { ConversationMessage, CitationDto } from '../types';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

/* ============================================================
   DESIGN TOKENS
   Charcoal Grey · Near Black · Dark Red
============================================================ */

const COLORS = {
  background: '#101010',
  surface: '#171717',
  elevated: '#1D1D1D',
  border: '#303030',
  muted: '#929292',
  red: '#B91C1C',
  redLight: '#EF4444',
};

/* ============================================================
   PROMPT TEMPLATES
============================================================ */

const PROMPT_TEMPLATES = [
  {
    category: 'Summarization',
    icon: '▤',
    description: 'Get the bigger picture',
    templates: [
      {
        label: 'Executive Summary',
        prompt:
          'Provide a concise executive summary of the key points in this document.',
      },
      {
        label: 'Key Findings',
        prompt:
          'What are the key findings and conclusions from this document?',
      },
      {
        label: 'Action Items',
        prompt:
          'List all action items, tasks, and next steps mentioned in this document.',
      },
    ],
  },
  {
    category: 'Legal & Compliance',
    icon: '§',
    description: 'Understand obligations and risks',
    templates: [
      {
        label: 'Key Clauses',
        prompt:
          'What are the most important clauses and provisions in this document?',
      },
      {
        label: 'Obligations',
        prompt:
          'What obligations and responsibilities are defined in this document?',
      },
      {
        label: 'Risk Analysis',
        prompt:
          'Identify potential risks, liabilities, and red flags in this document.',
      },
    ],
  },
  {
    category: 'Analysis',
    icon: '⌕',
    description: 'Discover useful insights',
    templates: [
      {
        label: 'Data Points',
        prompt:
          'Extract all key data points, statistics, and metrics from this document.',
      },
      {
        label: 'Definitions',
        prompt:
          'List and explain all key terms and definitions used in this document.',
      },
      {
        label: 'Timeline',
        prompt:
          'Create a chronological timeline of all events and dates mentioned.',
      },
    ],
  },
];

/* ============================================================
   CLIPBOARD HELPER
============================================================ */

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
    return true;
  } catch {
    toast.error('Unable to copy. Check clipboard permissions.');
    return false;
  }
}

/* ============================================================
   PRISM TOKEN RENDERER
============================================================ */

function renderPrismTokens(
  tokens: (string | Prism.Token)[],
  keyPrefix = '',
): React.ReactNode[] {
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;

    if (typeof token === 'string') {
      return <React.Fragment key={key}>{token}</React.Fragment>;
    }

    const aliases = Array.isArray(token.alias)
      ? token.alias.join(' ')
      : token.alias || '';

    const className = `token ${token.type} ${aliases}`;

    if (typeof token.content === 'string') {
      return (
        <span key={key} className={className}>
          {token.content}
        </span>
      );
    }

    if (Array.isArray(token.content)) {
      return (
        <span key={key} className={className}>
          {renderPrismTokens(
            token.content as (string | Prism.Token)[],
            key,
          )}
        </span>
      );
    }

    return (
      <span key={key} className={className}>
        {String(token.content)}
      </span>
    );
  });
}

/* ============================================================
   CODE BLOCK
============================================================ */

const CodeBlock: React.FC<{
  language: string;
  code: string;
}> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);

    if (success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const normalizedLang = (language || 'text').toLowerCase();
  const grammar = Prism.languages[normalizedLang] || Prism.languages.text;
  const tokens = grammar ? Prism.tokenize(code, grammar) : [code];

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-[#353535] bg-[#101010] text-xs shadow-lg shadow-black/20">
      <div className="flex items-center justify-between gap-3 border-b border-[#303030] bg-[#1C1C1C] px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
          </div>

          <span className="ml-1 truncate font-mono text-[11px] font-semibold uppercase tracking-wider text-red-400">
            {language || 'code'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#383838] bg-[#252525] px-2.5 py-1.5 text-[11px] text-neutral-400 transition-colors hover:border-red-500/40 hover:bg-red-950/40 hover:text-white"
          title="Copy code"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      <div className="overflow-x-auto p-4">
        <pre className="m-0 border-0 bg-transparent p-0 font-mono text-xs leading-relaxed text-neutral-200">
          <code className={`language-${normalizedLang}`}>
            {renderPrismTokens(tokens, 'code')}
          </code>
        </pre>
      </div>
    </div>
  );
};

/* ============================================================
   MARKDOWN CONTENT
============================================================ */

const MarkdownContent: React.FC<{
  content: string;
  isStreaming?: boolean;
}> = ({ content, isStreaming }) => {
  return (
    <div className="space-y-2 overflow-hidden break-words text-sm leading-relaxed text-neutral-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children }) {
            return (
              <p className="mb-2.5 leading-relaxed text-neutral-300 last:mb-0">
                {children}
              </p>
            );
          },

          h1({ children }) {
            return (
              <h1 className="mb-3 mt-5 border-b border-[#353535] pb-2 text-xl font-bold tracking-tight text-white first:mt-0">
                {children}
              </h1>
            );
          },

          h2({ children }) {
            return (
              <h2 className="mb-2 mt-4 text-lg font-bold text-white first:mt-0">
                {children}
              </h2>
            );
          },

          h3({ children }) {
            return (
              <h3 className="mb-1.5 mt-3 text-base font-semibold text-neutral-100 first:mt-0">
                {children}
              </h3>
            );
          },

          h4({ children }) {
            return (
              <h4 className="mb-1 mt-3 text-xs font-bold uppercase tracking-wider text-red-300 first:mt-0">
                {children}
              </h4>
            );
          },

          ul({ children }) {
            return (
              <ul className="my-2 ml-5 list-disc space-y-1.5 pl-1 text-neutral-300 marker:text-red-500">
                {children}
              </ul>
            );
          },

          ol({ children }) {
            return (
              <ol className="my-2 ml-5 list-decimal space-y-1.5 pl-1 text-neutral-300 marker:text-red-500">
                {children}
              </ol>
            );
          },

          li({ children }) {
            return <li className="pl-0.5 leading-relaxed">{children}</li>;
          },

          blockquote({ children }) {
            return (
              <blockquote className="my-3 rounded-r-lg border-l-2 border-red-600 bg-red-950/20 px-4 py-3 text-sm italic leading-relaxed text-neutral-300">
                {children}
              </blockquote>
            );
          },

          hr() {
            return <hr className="my-4 border-[#353535]" />;
          },

          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-red-400 underline decoration-red-500/30 underline-offset-4 transition-colors hover:text-red-300 hover:decoration-red-400"
              >
                {children}
              </a>
            );
          },

          strong({ children }) {
            return (
              <strong className="font-semibold text-white">{children}</strong>
            );
          },

          em({ children }) {
            return <em className="italic text-neutral-300">{children}</em>;
          },

          del({ children }) {
            return (
              <del className="text-neutral-500 line-through">{children}</del>
            );
          },

          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-xl border border-[#353535]">
                <table className="min-w-full divide-y divide-[#353535] text-left text-xs">
                  {children}
                </table>
              </div>
            );
          },

          thead({ children }) {
            return <thead className="bg-[#252525]">{children}</thead>;
          },

          tbody({ children }) {
            return (
              <tbody className="divide-y divide-[#303030] bg-[#171717]">
                {children}
              </tbody>
            );
          },

          tr({ children }) {
            return (
              <tr className="transition-colors hover:bg-white/[0.025]">
                {children}
              </tr>
            );
          },

          th({ children }) {
            return (
              <th className="px-3.5 py-3 font-semibold text-white">
                {children}
              </th>
            );
          },

          td({ children }) {
            return (
              <td className="px-3.5 py-2.5 text-neutral-300">{children}</td>
            );
          },

          code({ className, children }) {
            const match = /language-([\w-]+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const isMultiLine = codeString.includes('\n');

            if (match || isMultiLine) {
              return (
                <CodeBlock
                  language={match ? match[1] : ''}
                  code={codeString}
                />
              );
            }

            return (
              <code className="mx-0.5 rounded-md border border-red-500/20 bg-[#101010] px-1.5 py-0.5 font-mono text-[13px] text-red-300">
                {children}
              </code>
            );
          },

          pre({ children }) {
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>

      {isStreaming && (
        <span className="ml-0.5 inline-block h-4 w-1 animate-pulse rounded-full bg-red-500 align-middle" />
      )}
    </div>
  );
};

/* ============================================================
   CITATION CARD
============================================================ */

const CitationCard: React.FC<{
  citation: CitationDto;
  index: number;
}> = ({ citation, index }) => {
  const [expanded, setExpanded] = useState(false);

  const score = Math.max(
    0,
    Math.min(1, citation.similarityScore ?? 0),
  );

  const pct = (score * 100).toFixed(0);

  const barColor =
    score >= 0.8
      ? 'bg-emerald-500'
      : score >= 0.6
        ? 'bg-amber-500'
        : 'bg-red-500';

  const textColor =
    score >= 0.8
      ? 'text-emerald-400'
      : score >= 0.6
        ? 'text-amber-400'
        : 'text-red-400';

  const ext = citation.fileName?.split('.').pop()?.toLowerCase();

  const extColors: Record<string, string> = {
    pdf: 'text-red-400',
    docx: 'text-blue-400',
    csv: 'text-green-400',
    md: 'text-purple-400',
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#353535] bg-[#191919] transition-colors hover:border-red-500/35">
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/[0.02]"
      >
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-red-500/25 bg-red-950/50 text-xs font-bold text-red-400">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <FileText
              className={clsx(
                'h-3.5 w-3.5 flex-shrink-0',
                extColors[ext ?? ''] ?? 'text-neutral-400',
              )}
            />

            <p className="truncate text-xs font-medium text-neutral-200">
              {citation.fileName || 'Document source'}
            </p>

            {citation.pageNumber != null && (
              <span className="flex-shrink-0 text-[10px] text-neutral-500">
                p.{citation.pageNumber}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#353535]">
              <div
                className={clsx(
                  'h-full rounded-full transition-all',
                  barColor,
                )}
                style={{ width: `${pct}%` }}
              />
            </div>

            <span
              className={clsx(
                'flex-shrink-0 text-[10px] font-semibold',
                textColor,
              )}
            >
              {pct}%
            </span>
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-neutral-500" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-neutral-500" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[#353535] px-3.5 pb-3.5 pt-3">
          <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-neutral-400">
            {citation.snippet || 'No source excerpt available.'}
          </p>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   MESSAGE BUBBLE
============================================================ */

const MessageBubble: React.FC<{
  message: ConversationMessage;
}> = ({ message }) => {
  const isUser = message.messageType === 'USER';

  const [showCitations, setShowCitations] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);

    if (success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const timeStr = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      className={clsx(
        'group flex w-full gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
      onMouseEnter={() => setShowTime(true)}
      onMouseLeave={() => setShowTime(false)}
    >
      <div
        className={clsx(
          'mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border',
          isUser
            ? 'border-[#454545] bg-[#292929]'
            : 'border-red-500/30 bg-gradient-to-br from-red-700 to-red-950 shadow-lg shadow-red-950/30',
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-neutral-200" />
        ) : (
          <Sparkles className="h-4 w-4 text-white" />
        )}
      </div>

      <div
        className={clsx(
          'flex min-w-0 max-w-[88%] flex-col sm:max-w-[82%] lg:max-w-[76%]',
          isUser ? 'items-end' : 'items-start',
        )}
      >
        <div
          className={clsx(
            'min-w-0 max-w-full overflow-hidden rounded-2xl px-4 py-3',
            isUser
              ? 'rounded-tr-sm border border-red-700/40 bg-gradient-to-br from-red-800 to-red-950 text-white shadow-md shadow-black/20'
              : 'rounded-tl-sm border border-[#353535] bg-[#1B1B1B]',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white">
              {message.content}
            </p>
          ) : (
            <MarkdownContent
              content={message.content}
              isStreaming={message.isStreaming}
            />
          )}
        </div>

        <div
          className={clsx(
            'mt-1.5 flex min-h-5 items-center gap-2',
            isUser ? 'justify-end' : 'justify-start',
          )}
        >
          {timeStr && (
            <span
              className={clsx(
                'text-[10px] text-neutral-600 transition-opacity',
                showTime ? 'opacity-100' : 'opacity-0',
              )}
            >
              {timeStr}
            </span>
          )}

          {!isUser &&
            message.responseTimeMs !== undefined &&
            message.responseTimeMs > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-neutral-500">
                <Zap className="h-3 w-3 text-amber-400" />
                {message.responseTimeMs}ms
              </span>
            )}

          {!isUser && !message.isStreaming && message.content && (
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-md p-1 text-neutral-500 transition-colors hover:bg-white/5 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
              title="Copy message"
              aria-label="Copy assistant message"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {!isUser &&
          (message.citations?.length ?? 0) > 0 &&
          !message.isStreaming && (
            <div className="mt-2 w-full min-w-0">
              <button
                type="button"
                onClick={() =>
                  setShowCitations((previous) => !previous)
                }
                aria-expanded={showCitations}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-950/30 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-950/50"
              >
                <FileText className="h-3.5 w-3.5" />

                {message.citations!.length}{' '}
                {message.citations!.length === 1 ? 'source' : 'sources'}

                {showCitations ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              {showCitations && (
                <div className="mt-2 space-y-2">
                  {message.citations!.map((citation, index) => (
                    <CitationCard
                      key={`${citation.fileName ?? 'source'}-${citation.pageNumber ?? index}-${index}`}
                      citation={citation}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

/* ============================================================
   TYPING INDICATOR
============================================================ */

const TypingIndicator: React.FC = () => (
  <div className="flex animate-pulse items-start gap-3">
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-gradient-to-br from-red-700 to-red-950">
      <Sparkles className="h-4 w-4 text-white" />
    </div>

    <div className="rounded-2xl rounded-tl-sm border border-[#353535] bg-[#1B1B1B] px-4 py-3">
      <div className="flex h-4 items-center gap-1.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-500 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-500 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-500 [animation-delay:300ms]" />
      </div>
    </div>
  </div>
);

/* ============================================================
   MAIN CHAT VIEW
============================================================ */

const ChatView: React.FC = () => {
  const { selectedDocumentId, documents } = useDocumentStore();

  const {
    activeConversationId,
    messages: allMessages,
    streamingMode,
    setStreamingMode,
    appendMessage,
    updateLastMessageContent,
    updateMessageMetadata,
    newChat,
  } = useConversationStore();

  const messages = allMessages[activeConversationId] || [];

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedDoc = documents.find(
    (document) => document.id === selectedDocumentId,
  );

  const isBusy = isLoading || isStreaming;
  const charCount = input.length;

  /* ── Scroll management ── */

  const handleScroll = useCallback(() => {
    const element = chatContainerRef.current;
    if (!element) return;

    const distanceToBottom =
      element.scrollHeight -
      element.scrollTop -
      element.clientHeight;

    shouldAutoScrollRef.current = distanceToBottom < 120;
  }, []);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoading, isStreaming]);

  /* ── Streaming response ── */

  const sendStreaming = useCallback(
    async (question: string, convId: string) => {
      const assistantMsgId = crypto.randomUUID();
      const startTime = Date.now();

      const controller = new AbortController();
      abortRef.current = controller;

      await appendMessage(convId, {
        id: assistantMsgId,
        messageType: 'ASSISTANT',
        content: '',
        createdAt: new Date().toISOString(),
        isStreaming: true,
      });

      setIsStreaming(true);

      const citationPromise = chatApi
        .searchSimilarity({
          query: question,
          documentId: selectedDocumentId ?? undefined,
          topK: 5,
        })
        .catch(() => null);

      try {
        const response = await chatApi.stream(
          {
            question,
            documentId: selectedDocumentId ?? undefined,
            topK: 5,
            conversationId: convId,
          },
          controller.signal,
        );

        if (!response.ok) {
          let errorDetail = `HTTP ${response.status}`;

          try {
            const errorData = await response.json();

            if (errorData?.message) {
              errorDetail = errorData.message;
            }
          } catch {
            // Response may not contain JSON.
          }

          throw new Error(errorDetail);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';
        let accumulated = '';
        let streamEnded = false;
        let lastRenderTime = 0;

        const THROTTLE_MS = 35;

        const flushUpdate = (streaming: boolean) => {
          updateLastMessageContent(
            convId,
            assistantMsgId,
            accumulated,
            streaming,
          );

          if (shouldAutoScrollRef.current) {
            bottomRef.current?.scrollIntoView({
              behavior: 'smooth',
            });
          }
        };

        const contentType =
          response.headers.get('content-type') || '';

        const isEventStream = contentType.includes('text/event-stream');

        while (!streamEnded) {
          const { done, value } = await reader.read();
          if (done) break;

          const textChunk = decoder.decode(value, { stream: true });

          if (isEventStream) {
            buffer += textChunk;

            const eventBlocks = buffer.split(/\r?\n\r?\n/);
            buffer = eventBlocks.pop() || '';

            for (const block of eventBlocks) {
              if (!block) continue;

              const lines = block.split(/\r?\n/);
              const dataLines: string[] = [];

              for (const line of lines) {
                if (line.startsWith('data:')) {
                  dataLines.push(line.slice(5).replace(/^ /, ''));
                }
              }

              if (dataLines.length > 0) {
                const eventData = dataLines.join('\n');

                if (eventData.trim() === '[DONE]') {
                  streamEnded = true;
                  break;
                }

                accumulated += eventData;
              }
            }
          } else if (textChunk.includes('[DONE]')) {
            accumulated += textChunk.replace('[DONE]', '');
            streamEnded = true;
          } else {
            accumulated += textChunk;
          }

          const now = Date.now();

          if (now - lastRenderTime >= THROTTLE_MS || streamEnded) {
            lastRenderTime = now;
            flushUpdate(true);
          }
        }

        if (!streamEnded && isEventStream && buffer.trim()) {
          const lines = buffer.split(/\r?\n/);
          const dataLines: string[] = [];

          for (const line of lines) {
            if (line.startsWith('data:')) {
              dataLines.push(line.slice(5).replace(/^ /, ''));
            }
          }

          if (dataLines.length > 0) {
            const eventData = dataLines.join('\n');

            if (eventData.trim() !== '[DONE]') {
              accumulated += eventData;
            }
          }
        }

        try {
          await reader.cancel();
        } catch {
          // Ignore reader cancellation errors.
        }

        const responseTimeMs = Date.now() - startTime;

        setIsStreaming(false);
        abortRef.current = null;

        updateLastMessageContent(
          convId,
          assistantMsgId,
          accumulated,
          false,
        );

        if (shouldAutoScrollRef.current) {
          bottomRef.current?.scrollIntoView({
            behavior: 'smooth',
          });
        }

        const similarityResponse = await citationPromise;

        if (similarityResponse?.data?.matches?.length) {
          await updateMessageMetadata(convId, assistantMsgId, {
            citations: similarityResponse.data.matches,
            responseTimeMs,
            isStreaming: false,
          });
        } else {
          await updateMessageMetadata(convId, assistantMsgId, {
            responseTimeMs,
            isStreaming: false,
          });
        }
      } catch (error: unknown) {
        if ((error as Error).name === 'AbortError') {
          updateLastMessageContent(
            convId,
            assistantMsgId,
            'Response generation stopped.',
            false,
          );
        } else {
          const message =
            error instanceof Error ? error.message : 'Stream failed';

          toast.error(message);

          updateLastMessageContent(
            convId,
            assistantMsgId,
            `❌ ${message}`,
            false,
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [
      selectedDocumentId,
      appendMessage,
      updateLastMessageContent,
      updateMessageMetadata,
    ],
  );

  /* ── Normal query handler ── */

  const sendNormal = useCallback(
    async (question: string, convId: string) => {
      setIsLoading(true);

      try {
        const response = await chatApi.query({
          question,
          documentId: selectedDocumentId ?? undefined,
          topK: 5,
          conversationId: convId,
        });

        await appendMessage(convId, {
          id: crypto.randomUUID(),
          messageType: 'ASSISTANT',
          content: response.data.answer,
          citations: response.data.citations,
          responseTimeMs: response.data.responseTimeMs,
          createdAt: new Date().toISOString(),
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Something went wrong';

        toast.error(message);

        await appendMessage(convId, {
          id: crypto.randomUUID(),
          messageType: 'ASSISTANT',
          content: `❌ ${message}`,
          createdAt: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDocumentId, appendMessage],
  );

  /* ── Send dispatcher ── */

  const sendMessage = useCallback(
    async (question: string) => {
      const trimmedQuestion = question.trim();

      if (!trimmedQuestion || isLoading || isStreaming) return;

      setShowTemplates(false);

      const convId = activeConversationId || crypto.randomUUID();

      const userMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        messageType: 'USER',
        content: trimmedQuestion,
        createdAt: new Date().toISOString(),
      };

      setInput('');

      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }

      await appendMessage(convId, userMessage);

      if (streamingMode) {
        await sendStreaming(trimmedQuestion, convId);
      } else {
        await sendNormal(trimmedQuestion, convId);
      }

      inputRef.current?.focus();
    },
    [
      isLoading,
      isStreaming,
      activeConversationId,
      streamingMode,
      appendMessage,
      sendStreaming,
      sendNormal,
    ],
  );

  const stopStream = () => {
    abortRef.current?.abort();
  };

  const handleNewChat = () => {
    abortRef.current?.abort();
    newChat();
    setInput('');
    setShowTemplates(true);
  };

  /* ── Render ── */

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#101010] text-neutral-200">
      {/* Ambient background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-red-900/[0.06] blur-3xl" />
        <div className="absolute -bottom-48 -left-32 h-80 w-80 rounded-full bg-neutral-700/[0.05] blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex flex-shrink-0 items-center justify-between gap-3 border-b border-[#303030] bg-[#151515]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-950/50">
            <Sparkles className="h-4 w-4 text-red-400" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-sm font-semibold tracking-tight text-white">
                {selectedDoc ? selectedDoc.filename : 'All Documents'}
              </h1>

              {selectedDoc && (
                <span className="rounded-md border border-red-500/25 bg-red-950/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
                  Focused
                </span>
              )}
            </div>

            <p className="mt-0.5 text-[11px] text-neutral-500">
              DocMind AI <span className="mx-1 text-neutral-700">/</span>
              Document intelligence
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setStreamingMode(!streamingMode)}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-medium transition-all sm:px-3',
              streamingMode
                ? 'border-red-500/30 bg-red-950/40 text-red-300 hover:bg-red-950/60'
                : 'border-[#383838] bg-[#202020] text-neutral-400 hover:border-[#505050] hover:text-white',
            )}
            title={
              streamingMode
                ? 'Streaming ON — click to disable'
                : 'Streaming OFF — click to enable'
            }
          >
            {streamingMode ? (
              <>
                <Wifi className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Streaming</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Normal</span>
              </>
            )}
          </button>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleNewChat}
              className="flex items-center gap-1.5 rounded-lg border border-[#383838] bg-[#202020] px-2.5 py-2 text-[11px] font-medium text-neutral-400 transition-all hover:border-red-500/30 hover:bg-red-950/30 hover:text-white sm:px-3"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <main
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="relative z-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 sm:py-8"
      >
        {/* Welcome screen */}
        {messages.length === 0 && showTemplates && (
          <div className="mx-auto max-w-4xl animate-fade-in">
            <div className="mb-9 pt-4 text-center sm:pt-8">
              <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-800 to-red-950 shadow-xl shadow-red-950/30">
                <div className="absolute inset-0 rounded-2xl bg-red-500/10 blur-xl" />
                <Bot className="relative h-8 w-8 text-white" />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-lg border-2 border-[#101010] bg-red-600">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </span>
              </div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#363636] bg-[#191919] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Your AI document assistant
              </div>

              <h2 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ask. Analyze.
                <span className="text-red-500"> Understand.</span>
              </h2>

              <p className="mx-auto max-w-lg text-sm leading-relaxed text-neutral-400">
                {selectedDoc
                  ? `Ask questions, extract insights, and explore "${selectedDoc.filename}".`
                  : 'Explore your indexed documents, uncover key insights, and get answers grounded in your files.'}
              </p>

              {streamingMode && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-950/30 px-3 py-1.5 text-[11px] font-medium text-red-300">
                  <Wifi className="h-3.5 w-3.5" />
                  Real-time responses enabled
                </div>
              )}
            </div>

            {/* Prompt template groups */}
            <div className="space-y-4">
              <div className="mb-1 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
                    Start with a prompt
                  </h3>
                  <p className="mt-1 text-[11px] text-neutral-600">
                    Choose a suggested task to get started
                  </p>
                </div>

                <Sparkles className="h-4 w-4 text-red-500/70" />
              </div>

              {PROMPT_TEMPLATES.map((category) => (
                <section
                  key={category.category}
                  className="overflow-hidden rounded-2xl border border-[#303030] bg-[#171717]/90 transition-colors hover:border-[#424242]"
                >
                  <div className="flex items-center gap-3 border-b border-[#303030] px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-950/40 text-lg text-red-400">
                      {category.icon}
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-neutral-200">
                        {category.category}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-neutral-500">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
                    {category.templates.map((template) => (
                      <button
                        key={template.label}
                        type="button"
                        onClick={() => sendMessage(template.prompt)}
                        disabled={isBusy}
                        className="group rounded-xl border border-[#303030] bg-[#1C1C1C] p-3.5 text-left transition-all hover:border-red-500/35 hover:bg-[#251818] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-neutral-200 transition-colors group-hover:text-white">
                            {template.label}
                          </span>

                          <Send className="h-3.5 w-3.5 flex-shrink-0 text-neutral-600 transition-all group-hover:translate-x-0.5 group-hover:text-red-400" />
                        </div>

                        <p className="text-[11px] leading-relaxed text-neutral-500 transition-colors group-hover:text-neutral-400">
                          {template.prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        {/* Conversation messages */}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && !isStreaming && <TypingIndicator />}

        <div ref={bottomRef} />
      </main>

      {/* Composer */}
      <footer className="relative z-10 flex-shrink-0 border-t border-[#303030] bg-[#151515]/95 px-4 pb-3 pt-4 backdrop-blur-xl sm:px-6 sm:pb-4">
        <div className="mx-auto max-w-5xl">
          {isStreaming && (
            <div className="mb-3 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-500 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-500 [animation-delay:100ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-500 [animation-delay:200ms]" />
              </div>

              <span className="text-[11px] font-medium text-red-400">
                Generating response...
              </span>

              <span className="text-[11px] text-neutral-600">
                You can stop generation at any time
              </span>
            </div>
          )}

          <div
            className={clsx(
              'group flex items-end gap-3 rounded-2xl border bg-[#202020] p-2.5 transition-all duration-200 sm:p-3',
              isBusy
                ? 'border-[#353535]'
                : 'border-[#383838] hover:border-[#484848] focus-within:border-red-600/70 focus-within:ring-2 focus-within:ring-red-600/10',
            )}
          >
            <div className="mb-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#383838] bg-[#292929]">
              <Sparkles className="h-4 w-4 text-red-400" />
            </div>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={
                isBusy
                  ? 'Waiting for response...'
                  : selectedDoc
                    ? `Ask about "${selectedDoc.filename}"...`
                    : 'Ask anything about your documents...'
              }
              rows={1}
              disabled={isBusy}
              aria-label="Message"
              className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-relaxed text-white outline-none placeholder:text-neutral-600 disabled:opacity-60"
              style={{ height: 'auto' }}
              onInput={(event) => {
                const textarea = event.currentTarget;
                textarea.style.height = 'auto';
                textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
              }}
            />

            {isStreaming ? (
              <button
                type="button"
                onClick={stopStream}
                className="mb-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-950/60 text-red-300 transition-colors hover:bg-red-900/70 hover:text-white"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isBusy}
                className="mb-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-700 text-white shadow-lg shadow-red-950/20 transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:border-[#383838] disabled:bg-[#303030] disabled:text-neutral-600 disabled:shadow-none"
                title="Send message"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-[10px] text-neutral-600 sm:text-[11px]">
              <span className="text-neutral-500">Enter</span> to send
              <span className="mx-1.5 text-neutral-700">·</span>
              <span className="text-neutral-500">Shift + Enter</span> for a new line
            </p>

            <div className="flex items-center gap-3">
              {charCount > 0 && (
                <span
                  className={clsx(
                    'text-[10px] tabular-nums',
                    charCount > 1000
                      ? 'text-amber-500'
                      : 'text-neutral-600',
                  )}
                >
                  {charCount} characters
                </span>
              )}

              {messages.length > 0 && (
                <span className="rounded-md border border-[#303030] bg-[#1D1D1D] px-2 py-1 text-[10px] text-neutral-500">
                  {messages.length} messages
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatView;