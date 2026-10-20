
import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Loader2,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Hash,
  Database,
  Copy,
  Check,
  Tag,
  ArrowUpRight,
  Braces,
  Sparkles,
  X,
  PanelTop,
} from 'lucide-react';
import { chatApi } from '../services/api';
import { useDocumentStore } from '../store/documentStore';
import type { CitationDto } from '../types';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const RED = '#e11d48';

const formatKey = (key: string) =>
  key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');

const ChunkCard: React.FC<{ chunk: CitationDto; index: number }> = ({
  chunk,
  index,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const score =
    chunk.similarityScore != null ? chunk.similarityScore : null;

  const percentage =
    score != null
      ? Math.max(0, Math.min(100, score * 100))
      : null;

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      await navigator.clipboard.writeText(chunk.snippet);
      setCopied(true);
      toast.success('Chunk copied');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy chunk');
    }
  };

  const metadata = Object.entries(chunk.metadata ?? {}).filter(
    ([key]) => key !== 'snippet'
  );

  return (
    <article
      className={clsx(
        'group overflow-hidden rounded-2xl border transition-all duration-200',
        'bg-[#141416]',
        expanded
          ? 'border-rose-500/35 shadow-[0_0_30px_rgba(225,29,72,0.045)]'
          : 'border-white/[0.075] hover:border-white/[0.15]'
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 p-4 text-left sm:gap-4 sm:p-5"
      >
        <div
          className={clsx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
            expanded
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              : 'border-white/[0.08] bg-[#202023] text-zinc-400 group-hover:text-rose-400'
          )}
        >
          <span className="font-mono text-xs font-semibold">
            #{chunk.chunkIndex ?? index}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <p className="truncate text-sm font-medium text-zinc-100">
              {chunk.fileName || 'Untitled document'}
            </p>
          </div>

          <p className="mt-1.5 line-clamp-1 text-xs leading-5 text-zinc-500">
            {chunk.snippet || 'No text content available'}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {chunk.pageNumber != null && (
              <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[10px] text-zinc-400">
                <PanelTop className="h-3 w-3" />
                Page {chunk.pageNumber}
              </span>
            )}

            <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[10px] text-zinc-500">
              <Braces className="h-3 w-3" />
              Vector chunk
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {percentage != null && (
            <div className="hidden min-w-[74px] text-right sm:block">
              <p className="font-mono text-xs font-semibold text-rose-400">
                {percentage.toFixed(1)}%
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-wider text-zinc-600">
                Similarity
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy chunk"
            title="Copy chunk"
            className="rounded-lg border border-transparent p-2 text-zinc-500 transition hover:border-white/10 hover:bg-white/[0.05] hover:text-zinc-100"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>

          <div className="text-zinc-500">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4 transition-transform group-hover:text-zinc-300" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.07]">
          {percentage != null && (
            <div className="border-b border-white/[0.06] bg-white/[0.015] px-4 py-3 sm:px-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  Similarity score
                </span>
                <span className="font-mono text-xs text-rose-400">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-700 to-rose-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-zinc-200">
                  Chunk content
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Extracted text stored in your vector database
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-[11px] text-zinc-400 transition hover:border-rose-500/25 hover:text-rose-300"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? 'Copied' : 'Copy text'}
              </button>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#0c0c0e]">
              <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-rose-500/70" />
                <span className="h-2 w-2 rounded-full bg-amber-400/50" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/50" />
                <span className="ml-2 font-mono text-[10px] text-zinc-600">
                  chunk_{chunk.chunkIndex ?? index}.txt
                </span>
              </div>

              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-7 text-zinc-300 sm:p-5">
                {chunk.snippet || 'No text content available.'}
              </pre>
            </div>

            {metadata.length > 0 && (
              <div className="mt-5">
                <div className="mb-3 flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-rose-400" />
                  <p className="text-xs font-semibold text-zinc-200">
                    Metadata
                  </p>
                  <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                    {metadata.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {metadata.map(([key, value]) => (
                    <div
                      key={key}
                      className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                    >
                      <p className="mb-1.5 truncate text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                        {formatKey(key)}
                      </p>
                      <p className="break-words font-mono text-xs leading-5 text-zinc-300">
                        {String(value ?? '—')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

const ChunksView: React.FC = () => {
  const { selectedDocumentId, documents } = useDocumentStore();

  const [chunks, setChunks] = useState<CitationDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [textFilter, setTextFilter] = useState('');

  const selectedDoc = documents.find(
    (document) => document.id === selectedDocumentId
  );

  const loadChunks = useCallback(
    async (searchQuery = query) => {
      setIsLoading(true);

      try {
        const res = await chatApi.searchSimilarity({
          query:
            searchQuery.trim() ||
            'document content text data information',
          documentId: selectedDocumentId ?? undefined,
          topK: 50,
          similaritySearch: 0.0,
        });

        setChunks(res.data.matches ?? []);
        setHasLoaded(true);
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to load chunks'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDocumentId, query]
  );

  useEffect(() => {
    if (selectedDocumentId) {
      void loadChunks();
    } else {
      setChunks([]);
      setHasLoaded(false);
    }
  }, [selectedDocumentId, loadChunks]);

  const filtered = textFilter.trim()
    ? chunks.filter(
        (chunk) =>
          (chunk.snippet ?? '')
            .toLowerCase()
            .includes(textFilter.toLowerCase()) ||
          (chunk.fileName ?? '')
            .toLowerCase()
            .includes(textFilter.toLowerCase())
      )
    : chunks;

  const uniqueFiles = new Set(chunks.map((chunk) => chunk.fileName)).size;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#0c0c0e] text-zinc-100">
      {/* Header */}
      <header className="shrink-0 border-b border-white/[0.07] bg-[#101012]">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex items-start gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/[0.08]">
                <Layers className="h-5 w-5 text-rose-400" />
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#101012] bg-rose-500" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                    Vector Explorer
                  </h1>
                  <span className="rounded-md border border-rose-500/20 bg-rose-500/[0.07] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-rose-300">
                    Synapse
                  </span>
                </div>

                <p className="mt-1 max-w-xl text-xs leading-5 text-zinc-500 sm:text-sm">
                  Inspect indexed content, explore chunks, and review vector
                  search relevance.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadChunks()}
              disabled={isLoading}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/[0.09] bg-white/[0.035] px-3.5 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-rose-500/30 hover:bg-rose-500/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={clsx('h-3.5 w-3.5', isLoading && 'animate-spin')}
              />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
              <div className="flex items-center gap-2 text-zinc-500">
                <Database className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium uppercase tracking-wider">
                  Total chunks
                </span>
              </div>
              <p className="mt-2 font-mono text-xl font-semibold text-white">
                {hasLoaded ? chunks.length : '—'}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
              <div className="flex items-center gap-2 text-zinc-500">
                <FileText className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium uppercase tracking-wider">
                  Documents
                </span>
              </div>
              <p className="mt-2 font-mono text-xl font-semibold text-white">
                {hasLoaded ? uniqueFiles : '—'}
              </p>
            </div>

            <div className="col-span-2 rounded-xl border border-rose-500/15 bg-gradient-to-br from-rose-500/[0.07] to-transparent p-3.5 sm:col-span-1">
              <div className="flex items-center gap-2 text-rose-300/70">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium uppercase tracking-wider">
                  Current scope
                </span>
              </div>
              <p className="mt-2 truncate text-sm font-medium text-zinc-100">
                {selectedDoc?.filename ?? 'All documents'}
              </p>
            </div>
          </div>

          {/* Vector search */}
          <div className="mt-5">
            <label
              htmlFor="vector-query"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.13em] text-zinc-500"
            >
              Semantic search
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/[0.09] bg-[#171719] px-3.5 transition focus-within:border-rose-500/40 focus-within:ring-2 focus-within:ring-rose-500/[0.08]">
                <Search className="h-4 w-4 shrink-0 text-zinc-500" />
                <input
                  id="vector-query"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void loadChunks();
                  }}
                  placeholder="Search indexed document content..."
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                />

                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear semantic query"
                    className="rounded-md p-1 text-zinc-500 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => void loadChunks()}
                disabled={isLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(225,29,72,0.12)] transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search vectors
                <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
              </button>
            </div>

            <p className="mt-2 text-[10px] leading-5 text-zinc-600">
              Searches semantically similar content in your indexed vector
              store. Leave empty to use the default query.
            </p>
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          {hasLoaded && !isLoading && chunks.length > 0 && (
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Retrieved chunks
                  </h2>
                  <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                    {filtered.length}
                    {filtered.length !== chunks.length
                      ? ` / ${chunks.length}`
                      : ''}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Expand a result to inspect its content and metadata.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#141416] px-3">
                <Search className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                <input
                  type="text"
                  value={textFilter}
                  onChange={(event) => setTextFilter(event.target.value)}
                  placeholder="Filter loaded results..."
                  aria-label="Filter loaded chunks"
                  className="h-10 min-w-0 flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600 sm:w-48"
                />
                {textFilter && (
                  <button
                    type="button"
                    onClick={() => setTextFilter('')}
                    aria-label="Clear result filter"
                    className="text-zinc-500 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {!hasLoaded && !isLoading && (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.10] bg-white/[0.015] px-5 py-12 text-center">
              <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/[0.07]">
                <Layers className="h-7 w-7 text-rose-400" />
                <div className="absolute inset-0 rounded-2xl bg-rose-500/[0.07] blur-2xl" />
              </div>

              <p className="text-base font-semibold text-zinc-100">
                Explore your vector store
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                {selectedDoc
                  ? `Inspect the indexed chunks from ${selectedDoc.filename}.`
                  : 'Load your indexed document chunks to inspect extracted text, metadata, and similarity scores.'}
              </p>

              <button
                type="button"
                onClick={() => void loadChunks()}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500"
              >
                <Layers className="h-4 w-4" />
                Load chunks
              </button>
            </div>
          )}

          {isLoading && (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/[0.06]">
                <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
              </div>
              <p className="mt-5 text-sm font-medium text-zinc-200">
                Querying vector store
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Retrieving matching document chunks...
              </p>
            </div>
          )}

          {hasLoaded && !isLoading && filtered.length === 0 && (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.015] px-5 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03]">
                <Tag className="h-5 w-5 text-zinc-500" />
              </div>
              <p className="text-sm font-semibold text-zinc-200">
                {textFilter
                  ? 'No matching chunks'
                  : 'No chunks found'}
              </p>
              <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-500">
                {textFilter
                  ? 'Try another filter or clear your current filter.'
                  : 'Upload and index a document, then refresh to inspect its chunks.'}
              </p>
              {textFilter && (
                <button
                  type="button"
                  onClick={() => setTextFilter('')}
                  className="mt-4 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/[0.05]"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}

          {hasLoaded && !isLoading && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((chunk, index) => (
                <ChunkCard
                  key={`${chunk.documentId}-${chunk.chunkIndex}-${index}`}
                  chunk={chunk}
                  index={index}
                />
              ))}
            </div>
          )}

          {hasLoaded && !isLoading && filtered.length > 0 && (
            <div className="mt-5 flex items-center justify-center gap-2 py-3 text-[10px] text-zinc-600">
              <Database className="h-3.5 w-3.5" />
              Showing {filtered.length} of {chunks.length} loaded chunks
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChunksView;
