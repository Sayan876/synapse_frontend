import React, { useState } from 'react';
import {
  Search,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Layers,
  SlidersHorizontal,
  Tag,
  BarChart2,
  X,
  Sparkles,
  ArrowUpRight,
  RotateCcw,
  Command,
} from 'lucide-react';
import { chatApi } from '../services/api';
import { useDocumentStore } from '../store/documentStore';
import type { CitationDto, SearchResultDto } from '../types';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const SEARCH_TYPES = [
  {
    label: 'All',
    icon: '⌕',
    placeholder: 'Search concepts, topics, or keywords...',
  },
  {
    label: 'Clauses',
    icon: '§',
    placeholder: 'Find specific clauses or provisions...',
  },
  {
    label: 'Facts & Data',
    icon: '↗',
    placeholder: 'Search facts, figures, and statistics...',
  },
  {
    label: 'Definitions',
    icon: '≡',
    placeholder: 'Look up defined terms...',
  },
];

const EXAMPLE_QUERIES = [
  'payment terms',
  'termination clause',
  'liability cap',
  'force majeure',
  'intellectual property',
  'governing law',
  'warranty',
];

function getScoreColor(score: number) {
  if (score >= 0.8) {
    return {
      bar: 'bg-emerald-400',
      badge:
        'text-emerald-400 bg-emerald-400/[0.08] border-emerald-400/20',
      label: 'High',
    };
  }

  if (score >= 0.6) {
    return {
      bar: 'bg-amber-400',
      badge: 'text-amber-400 bg-amber-400/[0.08] border-amber-400/20',
      label: 'Medium',
    };
  }

  return {
    bar: 'bg-rose-500',
    badge: 'text-rose-400 bg-rose-500/[0.08] border-rose-500/20',
    label: 'Low',
  };
}

const ResultCard: React.FC<{
  match: CitationDto;
  index: number;
}> = ({ match, index }) => {
  const [expanded, setExpanded] = useState(false);

  const score = Math.min(1, Math.max(0, match.similarityScore ?? 0));
  const pct = (score * 100).toFixed(1);
  const { bar, badge, label } = getScoreColor(score);
  const snippet = match.snippet ?? '';
  const metadata = Object.entries(match.metadata ?? {}).filter(
    ([key]) => !['documentId', 'fileName', 'snippet'].includes(key),
  );

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111114] transition-all duration-300 hover:border-rose-500/25 hover:bg-[#141417]">
      {/* Subtle hover accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="p-4 sm:p-5">
        {/* Result heading */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-500/15 bg-rose-500/[0.07] text-xs font-semibold text-rose-400 transition-colors group-hover:border-rose-500/30 group-hover:bg-rose-500/10">
            {String(index + 1).padStart(2, '0')}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3
                  title={match.fileName}
                  className="truncate text-sm font-semibold text-zinc-100"
                >
                  {match.fileName || 'Untitled document'}
                </h3>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {match.pageNumber != null && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                      <FileText className="h-3.5 w-3.5" />
                      Page {match.pageNumber}
                    </span>
                  )}

                  {match.chunkIndex != null && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                      <Layers className="h-3.5 w-3.5" />
                      Chunk {match.chunkIndex}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide',
                    badge,
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {label}
                </span>

                <span className="text-sm font-semibold tabular-nums text-zinc-200">
                  {pct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Similarity indicator */}
        <div className="mb-4 mt-4 ml-0 sm:ml-12">
          <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-700',
                bar,
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Content snippet */}
        <div className="sm:ml-12">
          <p
            className={clsx(
              'whitespace-pre-wrap break-words text-[13px] leading-6 text-zinc-400',
              !expanded && 'line-clamp-3',
            )}
          >
            {snippet || 'No preview available for this result.'}
          </p>

          {snippet.length > 200 && (
            <button
              type="button"
              onClick={() => setExpanded((previous) => !previous)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-rose-400 transition-colors hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Read full excerpt
                </>
              )}
            </button>
          )}

          {/* Metadata */}
          {metadata.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
              {metadata.slice(0, 5).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-zinc-400"
                >
                  <Tag className="h-3 w-3 shrink-0 text-zinc-600" />
                  <span className="shrink-0 text-zinc-500">{key}:</span>
                  <span className="truncate">{String(value)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

const SearchView: React.FC = () => {
  const { selectedDocumentId, documents } = useDocumentStore();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResultDto | null>(null);
  const [topK, setTopK] = useState(10);
  const [minSimilarity, setMinSimilarity] = useState(0.3);
  const [selectedType, setSelectedType] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const selectedDoc = documents.find(
    (document) => document.id === selectedDocumentId,
  );

  const handleSearch = async (searchQuery = query) => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      toast.error('Enter a search query first');
      return;
    }

    if (isSearching) return;

    setIsSearching(true);

    try {
      const response = await chatApi.searchSimilarity({
        query: trimmedQuery,
        documentId: selectedDocumentId ?? undefined,
        topK,
        similaritySearch: minSimilarity,
      });

      setResults(response.data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#0b0b0e] text-zinc-100">
      {/* Header and search controls */}
      <header className="z-10 shrink-0 border-b border-white/[0.06] bg-[#0e0e12]">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/[0.08]">
                <Search className="h-4.5 w-4.5 text-rose-400" />
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0e0e12] bg-rose-500" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-semibold tracking-tight text-white">
                    Semantic Search
                  </h1>
                  <span className="rounded-md border border-rose-500/20 bg-rose-500/[0.07] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-rose-400">
                    Synapse
                  </span>
                </div>

                <p className="mt-1 text-xs leading-5 text-zinc-500 sm:text-sm">
                  Find relevant passages across your knowledge base.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((previous) => !previous)}
              aria-expanded={showFilters}
              className={clsx(
                'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all duration-200',
                showFilters
                  ? 'border-rose-500/30 bg-rose-500/[0.09] text-rose-300'
                  : 'border-white/[0.08] bg-white/[0.025] text-zinc-400 hover:border-white/[0.14] hover:text-white',
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {showFilters && (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              )}
            </button>
          </div>

          {/* Selected document context */}
          {selectedDoc && (
            <div className="mb-4 flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2">
              <FileText className="h-3.5 w-3.5 shrink-0 text-rose-400" />
              <span className="shrink-0 text-[11px] text-zinc-500">
                Searching in
              </span>
              <span className="truncate text-xs font-medium text-zinc-300">
                {selectedDoc.filename}
              </span>
            </div>
          )}

          {/* Search categories */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SEARCH_TYPES.map((type, index) => {
              const active = selectedType === index;

              return (
                <button
                  key={type.label}
                  type="button"
                  onClick={() => setSelectedType(index)}
                  className={clsx(
                    'inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all duration-200',
                    active
                      ? 'border-rose-500/30 bg-rose-500/[0.09] text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.04)]'
                      : 'border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:border-white/[0.12] hover:text-zinc-200',
                  )}
                >
                  <span
                    className={clsx(
                      'text-sm',
                      active ? 'text-rose-400' : 'text-zinc-500',
                    )}
                  >
                    {type.icon}
                  </span>
                  {type.label}
                </button>
              );
            })}
          </div>

          {/* Main search input */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSearch();
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <div className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/[0.09] bg-[#151519] px-3.5 transition-all duration-200 focus-within:border-rose-500/50 focus-within:shadow-[0_0_0_3px_rgba(244,63,94,0.06)] sm:px-4">
              <Search className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-focus-within:text-rose-400" />

              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={SEARCH_TYPES[selectedType].placeholder}
                aria-label="Search documents"
                className="h-12 min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear query"
                  className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              <div className="hidden shrink-0 items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 py-1 text-[10px] text-zinc-600 md:flex">
                <Command className="h-3 w-3" />
                <span>Search</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!query.trim() || isSearching}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white shadow-[0_4px_18px_rgba(225,29,72,0.16)] transition-all duration-200 hover:bg-rose-500 hover:shadow-[0_4px_22px_rgba(225,29,72,0.25)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isSearching ? 'Searching' : 'Search'}
              {!isSearching && <ArrowUpRight className="h-3.5 w-3.5" />}
            </button>
          </form>

          {/* Advanced filters */}
          {showFilters && (
            <div className="mt-4 rounded-2xl border border-white/[0.07] bg-[#121216] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-zinc-200">
                    Search preferences
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Fine-tune relevance and result count.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTopK(10);
                    setMinSimilarity(0.3);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-rose-300"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8">
                {/* Result count */}
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label
                      htmlFor="top-results"
                      className="text-xs font-medium text-zinc-400"
                    >
                      Maximum results
                    </label>
                    <span className="rounded-lg border border-rose-500/20 bg-rose-500/[0.07] px-2 py-1 text-xs font-semibold tabular-nums text-rose-300">
                      {topK}
                    </span>
                  </div>

                  <input
                    id="top-results"
                    type="range"
                    min={1}
                    max={25}
                    value={topK}
                    onChange={(event) =>
                      setTopK(Number(event.target.value))
                    }
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.1] accent-rose-500"
                  />

                  <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
                    <span>1 result</span>
                    <span>25 results</span>
                  </div>
                </div>

                {/* Similarity threshold */}
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label
                      htmlFor="min-similarity"
                      className="text-xs font-medium text-zinc-400"
                    >
                      Minimum similarity
                    </label>
                    <span className="rounded-lg border border-rose-500/20 bg-rose-500/[0.07] px-2 py-1 text-xs font-semibold tabular-nums text-rose-300">
                      {(minSimilarity * 100).toFixed(0)}%
                    </span>
                  </div>

                  <input
                    id="min-similarity"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={minSimilarity}
                    onChange={(event) =>
                      setMinSimilarity(Number(event.target.value))
                    }
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.1] accent-rose-500"
                  />

                  <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
                    <span>Broader matches</span>
                    <span>Closer matches</span>
                  </div>
                </div>
              </div>

              <p className="mt-4 border-t border-white/[0.06] pt-3 text-[11px] leading-5 text-zinc-600">
                Filters apply when you run your next search. Higher similarity
                thresholds generally return fewer, more relevant matches.
              </p>
            </div>
          )}

          {/* Suggested queries */}
          {!results && !isSearching && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-rose-400/80" />
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                  Try searching
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      setQuery(example);
                      void handleSearch(example);
                    }}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-zinc-500 transition-all duration-200 hover:border-rose-500/25 hover:bg-rose-500/[0.05] hover:text-rose-300"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Results area */}
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          {/* Initial state */}
          {!results && !isSearching && (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-3xl bg-rose-500/[0.09] blur-2xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.08] bg-[#151519] shadow-2xl">
                  <Search className="h-8 w-8 text-rose-400/80" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-lg border border-rose-500/20 bg-[#1a1116]">
                    <Sparkles className="h-3 w-3 text-rose-400" />
                  </span>
                </div>
              </div>

              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-400/80">
                Discover your knowledge
              </p>

              <h2 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
                What are you looking for?
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">
                Search your indexed documents by meaning, not just exact
                keywords. Synapse finds passages that are semantically
                relevant to your question.
              </p>

              <div className="mt-7 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  {
                    title: 'Find key clauses',
                    description: 'Locate terms and provisions',
                    query: 'termination clause',
                  },
                  {
                    title: 'Explore facts',
                    description: 'Find figures and important details',
                    query: 'important facts and figures',
                  },
                  {
                    title: 'Understand obligations',
                    description: 'Discover duties and responsibilities',
                    query: 'obligations and responsibilities',
                  },
                  {
                    title: 'Check definitions',
                    description: 'Find defined terms and meanings',
                    query: 'definitions of key terms',
                  },
                ].map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      setQuery(item.query);
                      void handleSearch(item.query);
                    }}
                    className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-left transition-all hover:border-rose-500/20 hover:bg-rose-500/[0.035]"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] transition-colors group-hover:border-rose-500/20 group-hover:bg-rose-500/[0.07]">
                      <FileText className="h-3.5 w-3.5 text-zinc-500 group-hover:text-rose-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-300 transition-colors group-hover:text-white">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-600">
                        {item.description}
                      </p>
                    </div>

                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-700 transition-colors group-hover:text-rose-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading state */}
          {isSearching && (
            <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-rose-500/[0.12] blur-xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-[#171116]">
                  <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
                </div>
              </div>

              <h2 className="text-sm font-semibold text-zinc-200">
                Searching your knowledge base
              </h2>

              <p className="mt-2 max-w-xs text-xs leading-5 text-zinc-500">
                Comparing your query against document embeddings to find
                relevant passages.
              </p>

              <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-rose-500" />
              </div>
            </div>
          )}

          {/* Search results */}
          {results && !isSearching && (
            <div className="animate-fade-in">
              {/* Summary */}
              <div className="mb-5 flex flex-col gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/15 bg-rose-500/[0.07]">
                      <BarChart2 className="h-3.5 w-3.5 text-rose-400" />
                    </div>

                    <h2 className="text-sm font-semibold text-zinc-100">
                      Search results
                    </h2>

                    <span className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium tabular-nums text-zinc-400">
                      {results.totalMatches}
                    </span>
                  </div>

                  <p className="mt-2 break-words text-xs leading-5 text-zinc-500">
                    Results for{' '}
                    <span className="font-medium text-rose-300">
                      &ldquo;{results.query}&rdquo;
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearSearch}
                  className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-white/[0.07] px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-rose-500/20 hover:bg-rose-500/[0.05] hover:text-rose-300 sm:self-center"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear results
                </button>
              </div>

              {results.totalMatches === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-[#111114] px-5 py-14 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/15 bg-amber-500/[0.06]">
                    <AlertCircle className="h-6 w-6 text-amber-400" />
                  </div>

                  <h3 className="text-sm font-semibold text-zinc-200">
                    No matching passages found
                  </h3>

                  <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-500">
                    Try different wording, broaden your query, or lower the
                    minimum similarity threshold in the filters.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setMinSimilarity(0.1);
                      void handleSearch();
                    }}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-2.5 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/[0.12]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Try a broader search
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-zinc-500">
                      Showing{' '}
                      <span className="font-medium text-zinc-300">
                        {results.matches.length}
                      </span>{' '}
                      relevant passage
                      {results.matches.length !== 1 ? 's' : ''}
                    </p>

                    <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Ranked by similarity
                    </span>
                  </div>

                  <div className="space-y-3">
                    {results.matches.map((match, index) => (
                      <ResultCard
                        key={`${match.fileName ?? 'document'}-${match.chunkIndex ?? index}-${index}`}
                        match={match}
                        index={index}
                      />
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
                    <Sparkles className="h-3.5 w-3.5 text-rose-400/70" />
                    <p className="text-[11px] text-zinc-600">
                      Powered by Synapse semantic search
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchView;