import React, { useState } from 'react';
import {
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Upload,
  RefreshCw,
  X,
  FileType,
  FilePieChart,
  File,
  FolderOpen,
  MessageSquare,
  Sparkles,
  Database,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '../store/documentStore';
import { useConversationStore } from '../store/conversationStore';
import type { DocumentMetadataDto, DocumentStatus } from '../types';
import ChatsPanel from './ChatsPanel';
import { clsx } from 'clsx';

interface SidebarProps {
  onUploadClick: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return 'Unknown';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getFileIcon(contentType: string): React.ReactNode {
  const type = (contentType ?? '').toLowerCase();

  if (type.includes('pdf')) {
    return <FileText className="h-4 w-4 text-rose-400" />;
  }

  if (type.includes('word') || type.includes('docx')) {
    return <FileType className="h-4 w-4 text-sky-400" />;
  }

  if (type.includes('csv') || type.includes('spreadsheet')) {
    return <FilePieChart className="h-4 w-4 text-emerald-400" />;
  }

  return <File className="h-4 w-4 text-zinc-400" />;
}

const STATUS_CONFIG: Record<
  DocumentStatus,
  {
    icon: React.ReactNode;
    color: string;
    dot: string;
    label: string;
  }
> = {
  INDEXED: {
    icon: <CheckCircle className="h-3 w-3" />,
    color:
      'text-emerald-400 border-emerald-400/20 bg-emerald-400/[0.07]',
    dot: 'bg-emerald-400',
    label: 'Indexed',
  },
  PROCESSING: {
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    color: 'text-amber-400 border-amber-400/20 bg-amber-400/[0.07]',
    dot: 'bg-amber-400 animate-pulse',
    label: 'Processing',
  },
  UPLOADING: {
    icon: <Clock className="h-3 w-3" />,
    color: 'text-sky-400 border-sky-400/20 bg-sky-400/[0.07]',
    dot: 'bg-sky-400 animate-pulse',
    label: 'Uploading',
  },
  FAILED: {
    icon: <AlertCircle className="h-3 w-3" />,
    color: 'text-rose-400 border-rose-400/20 bg-rose-400/[0.07]',
    dot: 'bg-rose-400',
    label: 'Failed',
  },
};

const StatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.INDEXED;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium',
        config.color,
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
};

const SkeletonDoc: React.FC = () => (
  <div className="flex animate-pulse items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
    <div className="h-9 w-9 shrink-0 rounded-xl bg-white/[0.06]" />
    <div className="min-w-0 flex-1 space-y-2">
      <div className="h-3 w-3/4 rounded bg-white/[0.07]" />
      <div className="h-2 w-1/2 rounded bg-white/[0.04]" />
    </div>
  </div>
);

const DocumentItem: React.FC<{ doc: DocumentMetadataDto }> = ({ doc }) => {
  const {
    selectedDocumentId,
    setSelectedDocumentId,
    deleteDocument,
  } = useDocumentStore();

  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSelected = selectedDocumentId === doc.id;

  const handleDelete = () => {
    if (confirmDelete) {
      deleteDocument(doc.id);
      setConfirmDelete(false);
      return;
    }

    setConfirmDelete(true);

    // Automatically cancel the confirmation state after a short interval.
    window.setTimeout(() => setConfirmDelete(false), 2500);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'group relative overflow-hidden rounded-xl border transition-all duration-200',
        isSelected
          ? 'border-rose-500/30 bg-rose-500/[0.055] shadow-[0_0_24px_rgba(244,63,94,0.035)]'
          : 'border-white/[0.055] bg-white/[0.018] hover:border-white/[0.11] hover:bg-white/[0.035]',
      )}
    >
      {/* Selected document accent */}
      {isSelected && (
        <div className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-rose-500" />
      )}

      {/* Document row */}
      <div className="flex items-start gap-2.5 p-3">
        <button
          type="button"
          onClick={() => setSelectedDocumentId(isSelected ? null : doc.id)}
          aria-pressed={isSelected}
          aria-label={`Select document ${doc.filename}`}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
        >
          <div
            className={clsx(
              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
              isSelected
                ? 'border-rose-500/20 bg-rose-500/[0.09]'
                : 'border-white/[0.055] bg-[#17171b] group-hover:border-white/[0.1]',
            )}
          >
            {getFileIcon(doc.contentType)}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p
              title={doc.filename}
              className={clsx(
                'truncate text-xs font-medium leading-5 transition-colors',
                isSelected
                  ? 'text-rose-100'
                  : 'text-zinc-300 group-hover:text-white',
              )}
            >
              {doc.filename}
            </p>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={doc.status} />

              <span className="text-[10px] text-zinc-600">
                {formatBytes(doc.fileSize)}
              </span>
            </div>
          </div>
        </button>

        {/* Document actions */}
        <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
          <button
            type="button"
            onClick={() => setExpanded((previous) => !previous)}
            aria-label={
              expanded
                ? 'Collapse document details'
                : 'Expand document details'
            }
            aria-expanded={expanded}
            className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-white/[0.06] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            aria-label={
              confirmDelete
                ? 'Confirm document deletion'
                : 'Delete document'
            }
            title={confirmDelete ? 'Click again to delete' : 'Delete document'}
            className={clsx(
              'rounded-lg p-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50',
              confirmDelete
                ? 'bg-rose-500/15 px-2 text-[10px] font-semibold text-rose-300'
                : 'text-zinc-600 hover:bg-rose-500/[0.09] hover:text-rose-400',
            )}
          >
            {confirmDelete ? (
              'Sure?'
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-3 border-t border-white/[0.06] pb-3 pt-3">
              <div className="grid grid-cols-3 gap-1.5">
                {doc.totalChunks != null && (
                  <div className="rounded-xl border border-white/[0.05] bg-[#151519] p-2 text-center">
                    <p className="text-base font-semibold tabular-nums text-rose-400">
                      {doc.totalChunks}
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-600">
                      Chunks
                    </p>
                  </div>
                )}

                {doc.totalPages != null && (
                  <div className="rounded-xl border border-white/[0.05] bg-[#151519] p-2 text-center">
                    <p className="text-base font-semibold tabular-nums text-zinc-200">
                      {doc.totalPages}
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-600">
                      Pages
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-white/[0.05] bg-[#151519] p-2 text-center">
                  <p className="text-xs font-semibold text-zinc-200">
                    {formatDate(doc.createdAt)}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-600">Added</p>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2">
                <Database className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                <span className="text-[10px] text-zinc-500">
                  File size
                </span>
                <span className="ml-auto text-[10px] font-medium text-zinc-300">
                  {formatBytes(doc.fileSize)}
                </span>
              </div>

              {doc.errorMessage && (
                <div className="mt-2 rounded-xl border border-rose-500/15 bg-rose-500/[0.05] p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-semibold">
                      Processing error
                    </span>
                  </div>
                  <p className="break-words text-[11px] leading-5 text-rose-300/80">
                    {doc.errorMessage}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ onUploadClick }) => {
  const {
    documents,
    isLoadingDocuments,
    fetchDocuments,
    selectedDocumentId,
    setSelectedDocumentId,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useDocumentStore();

  const { conversations, loadChats } = useConversationStore();

  const [sidebarTab, setSidebarTab] = useState<'documents' | 'chats'>(
    'documents',
  );

  const handleRefresh = () => {
    if (sidebarTab === 'documents') {
      void fetchDocuments();
    } else {
      void loadChats();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar backdrop"
            className="fixed inset-0 z-30 cursor-default bg-black/70 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        aria-label="Synapse sidebar"
        className={clsx(
          'fixed inset-y-0 left-0 top-14 z-40 flex h-[calc(100%-3.5rem)] w-72 shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-[#0e0e12] transition-transform duration-300 ease-out md:static md:top-0 md:z-auto md:h-full md:translate-x-0',
          isSidebarOpen
            ? 'translate-x-0 shadow-2xl shadow-black/40 md:shadow-none'
            : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0',
        )}
      >
        {/* Sidebar header */}
        <div className="shrink-0 border-b border-white/[0.06] bg-[#101014] p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/[0.08]">
                <Sparkles className="h-3.5 w-3.5 text-rose-400" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-zinc-200">
                  Workspace
                </p>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                  Synapse
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Refresh sidebar content"
              title="Refresh"
              className="rounded-lg border border-transparent p-2 text-zinc-500 transition-colors hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
            >
              <RefreshCw
                className={clsx(
                  'h-3.5 w-3.5',
                  isLoadingDocuments && 'animate-spin text-rose-400',
                )}
              />
            </button>
          </div>

          {/* Sidebar tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/[0.05] bg-black/20 p-1">
            <button
              type="button"
              onClick={() => setSidebarTab('documents')}
              aria-pressed={sidebarTab === 'documents'}
              className={clsx(
                'flex min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50',
                sidebarTab === 'documents'
                  ? 'border border-rose-500/15 bg-rose-500/[0.09] text-rose-300 shadow-sm'
                  : 'border border-transparent text-zinc-500 hover:text-zinc-200',
              )}
            >
              <FolderOpen className="h-3.5 w-3.5 shrink-0" />
              <span>Documents</span>
              <span
                className={clsx(
                  'rounded-md px-1.5 py-0.5 text-[9px] tabular-nums',
                  sidebarTab === 'documents'
                    ? 'bg-rose-500/15 text-rose-300'
                    : 'bg-white/[0.05] text-zinc-500',
                )}
              >
                {documents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('chats')}
              aria-pressed={sidebarTab === 'chats'}
              className={clsx(
                'flex min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50',
                sidebarTab === 'chats'
                  ? 'border border-rose-500/15 bg-rose-500/[0.09] text-rose-300 shadow-sm'
                  : 'border border-transparent text-zinc-500 hover:text-zinc-200',
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span>Chats</span>
              <span
                className={clsx(
                  'rounded-md px-1.5 py-0.5 text-[9px] tabular-nums',
                  sidebarTab === 'chats'
                    ? 'bg-rose-500/15 text-rose-300'
                    : 'bg-white/[0.05] text-zinc-500',
                )}
              >
                {conversations.length}
              </span>
            </button>
          </div>
        </div>

        {/* Chats panel */}
        {sidebarTab === 'chats' ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            <ChatsPanel />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Upload button */}
            <div className="shrink-0 border-b border-white/[0.05] p-3">
              <button
                type="button"
                onClick={onUploadClick}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-rose-600 px-4 py-3 text-xs font-semibold text-white shadow-[0_4px_18px_rgba(225,29,72,0.13)] transition-all duration-200 hover:bg-rose-500 hover:shadow-[0_4px_24px_rgba(225,29,72,0.22)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0e12]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/[0.07] to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
                <Upload className="relative h-4 w-4" />
                <span className="relative">Upload documents</span>
                <ArrowUpRight className="relative ml-auto h-3.5 w-3.5 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-zinc-600" />
                <p className="text-[10px] text-zinc-600">
                  Your documents, organized
                </p>
              </div>
            </div>

            {/* Selected document filter */}
            <AnimatePresence initial={false}>
              {selectedDocumentId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="shrink-0 overflow-hidden"
                >
                  <div className="border-b border-white/[0.05] px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDocumentId(null)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/15 bg-rose-500/[0.05] px-3 py-2 text-[11px] font-medium text-rose-300 transition-colors hover:border-rose-500/25 hover:bg-rose-500/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                    >
                      <X className="h-3 w-3" />
                      Clear document selection
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Document list heading */}
            <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                Your library
              </span>

              <span className="text-[10px] tabular-nums text-zinc-600">
                {documents.length} file{documents.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Documents list */}
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-4 pt-1">
              {isLoadingDocuments ? (
                <div className="space-y-2">
                  <SkeletonDoc />
                  <SkeletonDoc />
                  <SkeletonDoc />
                </div>
              ) : documents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center px-4 py-10 text-center"
                >
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-2xl bg-rose-500/[0.08] blur-xl" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#151519]">
                      <FileText className="h-6 w-6 text-zinc-500" />
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold text-zinc-300">
                    Your library is empty
                  </h3>

                  <p className="mt-2 max-w-[190px] text-[11px] leading-5 text-zinc-600">
                    Add documents to start building your searchable knowledge
                    base.
                  </p>

                  <button
                    type="button"
                    onClick={onUploadClick}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-rose-500/15 bg-rose-500/[0.05] px-3 py-2 text-[11px] font-medium text-rose-300 transition-all hover:border-rose-500/25 hover:bg-rose-500/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload your first file
                  </button>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {documents.map((doc) => (
                    <DocumentItem key={doc.id} doc={doc} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Sidebar footer */}
            <div className="shrink-0 border-t border-white/[0.05] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-rose-500/10 bg-rose-500/[0.05]">
                  <Sparkles className="h-3 w-3 text-rose-400/80" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-zinc-400">
                    Synapse workspace
                  </p>
                  <p className="mt-0.5 text-[9px] text-zinc-600">
                    Search. Discover. Understand.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;