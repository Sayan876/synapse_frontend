
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  File,
  FileImage,
  FileCode2,
  FileSpreadsheet,
  Trash2,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Database,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { documentApi } from '../services/api';
import { useDocumentStore } from '../store/documentStore';
import type { UploadingFile } from '../types';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCEPTED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'text/csv': ['.csv'],
};

const FILE_FORMATS = [
  { ext: 'PDF', color: 'text-rose-400 bg-rose-400/10 border-rose-400/15' },
  { ext: 'DOCX', color: 'text-sky-400 bg-sky-400/10 border-sky-400/15' },
  { ext: 'TXT', color: 'text-slate-300 bg-slate-400/10 border-slate-400/15' },
  { ext: 'MD', color: 'text-violet-400 bg-violet-400/10 border-violet-400/15' },
  { ext: 'CSV', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/15' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    return <FileText className="h-5 w-5 text-rose-400" />;
  }

  if (ext === 'csv') {
    return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
  }

  if (ext === 'md') {
    return <FileCode2 className="h-5 w-5 text-violet-400" />;
  }

  if (ext === 'docx') {
    return <FileImage className="h-5 w-5 text-sky-400" />;
  }

  return <File className="h-5 w-5 text-slate-400" />;
}

function getStatusLabel(status: UploadingFile['status']): string {
  switch (status) {
    case 'pending':
      return 'Ready to upload';
    case 'uploading':
      return 'Uploading document';
    case 'done':
      return 'Indexed successfully';
    case 'error':
      return 'Upload failed';
    default:
      return 'Processing';
  }
}

const UploadDialog: React.FC<UploadDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { fetchDocuments } = useDocumentStore();

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length === 0) return;

    const newFiles: UploadingFile[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'pending',
    }));

    setFiles((previous) => [...previous, ...newFiles]);
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections,
  } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
    disabled: isUploading,
  });

  const removeFile = (id: string) => {
    if (isUploading) return;
    setFiles((previous) => previous.filter((file) => file.id !== id));
  };

  const clearFiles = () => {
    if (!isUploading) setFiles([]);
  };

  const handleUpload = async () => {
    const pending = files.filter((file) => file.status === 'pending');

    if (pending.length === 0 || isUploading) return;

    setIsUploading(true);

    let successCount = 0;
    let failureCount = 0;

    await Promise.all(
      pending.map(async (uploadFile) => {
        setFiles((previous) =>
          previous.map((file) =>
            file.id === uploadFile.id
              ? { ...file, status: 'uploading' }
              : file,
          ),
        );

        try {
          const response = await documentApi.upload(
            uploadFile.file,
            (progress) => {
              setFiles((previous) =>
                previous.map((file) =>
                  file.id === uploadFile.id
                    ? { ...file, progress }
                    : file,
                ),
              );
            },
          );

          successCount += 1;

          setFiles((previous) =>
            previous.map((file) =>
              file.id === uploadFile.id
                ? {
                    ...file,
                    status: 'done',
                    progress: 100,
                    result: response.data,
                  }
                : file,
            ),
          );
        } catch (error: unknown) {
          failureCount += 1;

          const message =
            error instanceof Error
              ? error.message
              : 'Something went wrong while uploading this document.';

          setFiles((previous) =>
            previous.map((file) =>
              file.id === uploadFile.id
                ? {
                    ...file,
                    status: 'error',
                    error: message,
                  }
                : file,
            ),
          );
        }
      }),
    );

    setIsUploading(false);

    try {
      await fetchDocuments();
    } catch {
      toast.error('Uploads finished, but the document list could not refresh.');
    }

    if (successCount > 0) {
      toast.success(
        `${successCount} document${successCount === 1 ? '' : 's'} uploaded successfully`,
      );
    }

    if (failureCount > 0) {
      toast.error(
        `${failureCount} document${failureCount === 1 ? '' : 's'} failed to upload`,
      );
    }
  };

  const handleClose = () => {
    if (isUploading) return;

    setFiles([]);
    onClose();
  };

  const retryFailed = () => {
    if (isUploading) return;

    setFiles((previous) =>
      previous.map((file) =>
        file.status === 'error'
          ? { ...file, status: 'pending', progress: 0, error: undefined }
          : file,
      ),
    );
  };

  const allDone =
    files.length > 0 &&
    files.every(
      (file) => file.status === 'done' || file.status === 'error',
    );

  const pendingCount = files.filter(
    (file) => file.status === 'pending',
  ).length;

  const successCount = files.filter(
    (file) => file.status === 'done',
  ).length;

  const errorCount = files.filter(
    (file) => file.status === 'error',
  ).length;

  const totalSize = files.reduce(
    (total, file) => total + file.file.size,
    0,
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-3 sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
        >
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label="Close upload dialog"
            className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-md"
            onClick={handleClose}
            disabled={isUploading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-dialog-title"
            className="relative z-10 my-auto flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#101012] shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:rounded-3xl"
            initial={{ opacity: 0, y: 22, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* Accent line */}
            <div className="h-[2px] shrink-0 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

            {/* Header */}
            <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/[0.09]">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent" />
                  <Upload className="relative h-5 w-5 text-rose-400" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      id="upload-dialog-title"
                      className="text-base font-semibold tracking-tight text-white sm:text-lg"
                    >
                      Add to your knowledge base
                    </h2>
                    <span className="rounded-md border border-rose-500/20 bg-rose-500/[0.08] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-400">
                      Synapse
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Upload documents for AI-powered search
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                aria-label="Close dialog"
                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent text-slate-500 transition hover:border-white/[0.08] hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Drop zone */}
              <div
                {...getRootProps()}
                className={clsx(
                  'group relative cursor-pointer overflow-hidden rounded-2xl border border-dashed p-6 text-center transition-all duration-200 sm:p-8',
                  isDragActive
                    ? 'border-rose-400 bg-rose-500/[0.08]'
                    : 'border-white/[0.14] bg-white/[0.015] hover:border-rose-500/50 hover:bg-rose-500/[0.025]',
                  isDragReject && 'border-red-400 bg-red-500/[0.06]',
                  isUploading && 'cursor-not-allowed opacity-60',
                )}
              >
                <input {...getInputProps()} />

                {/* Decorative background */}
                <div
                  className={clsx(
                    'pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/[0.07] via-transparent to-transparent transition-opacity duration-300',
                    isDragActive
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100',
                  )}
                />

                <div className="relative flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: isDragActive ? 1.08 : 1,
                      y: isDragActive ? -3 : 0,
                    }}
                    className={clsx(
                      'mb-4 flex h-[66px] w-[66px] items-center justify-center rounded-[22px] border transition-colors duration-200',
                      isDragActive
                        ? 'border-rose-400/30 bg-rose-500/15'
                        : 'border-white/[0.08] bg-[#19191d] group-hover:border-rose-500/20 group-hover:bg-rose-500/[0.06]',
                    )}
                  >
                    <Upload
                      className={clsx(
                        'h-7 w-7 transition-colors',
                        isDragActive
                          ? 'text-rose-300'
                          : 'text-slate-400 group-hover:text-rose-400',
                      )}
                    />
                  </motion.div>

                  <h3 className="text-sm font-semibold text-white sm:text-base">
                    {isDragReject
                      ? 'Unsupported file format'
                      : isDragActive
                        ? 'Drop your files here'
                        : 'Drag and drop your documents'}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
                    Or{' '}
                    <span className="font-medium text-rose-400 underline-offset-4 group-hover:underline">
                      browse files
                    </span>{' '}
                    from your computer
                  </p>

                  <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                    {FILE_FORMATS.map(({ ext, color }) => (
                      <span
                        key={ext}
                        className={clsx(
                          'rounded-lg border px-2.5 py-1 text-[10px] font-semibold tracking-wide',
                          color,
                        )}
                      >
                        .{ext.toLowerCase()}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 text-[10px] text-slate-600">
                    Multiple files supported · Files are processed securely
                  </p>
                </div>
              </div>

              {/* Rejected file feedback */}
              {fileRejections.length > 0 && (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.05] p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-amber-300">
                      Some files could not be added
                    </p>
                    <p className="mt-1 break-words text-[11px] leading-relaxed text-slate-500">
                      {fileRejections
                        .map((rejection) => {
                          const reasons = rejection.errors
                            .map((error) => error.message)
                            .join(', ');

                          return `${rejection.file.name}: ${reasons}`;
                        })
                        .join(' · ')}
                    </p>
                  </div>
                </div>
              )}

              {/* File list heading and stats */}
              {files.length > 0 && (
                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          Selected documents
                        </h3>
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-white/[0.07] px-1.5 text-[10px] font-semibold text-slate-300">
                          {files.length}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {formatBytes(totalSize)} total size
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={clearFiles}
                      disabled={isUploading}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-rose-500/[0.08] hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear all
                    </button>
                  </div>

                  {/* Summary counters */}
                  {(successCount > 0 || errorCount > 0) && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {successCount > 0 && (
                        <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 py-1.5 text-[10px] font-medium text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          {successCount} completed
                        </span>
                      )}

                      {errorCount > 0 && (
                        <span className="flex items-center gap-1.5 rounded-lg border border-red-500/15 bg-red-500/[0.06] px-2.5 py-1.5 text-[10px] font-medium text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          {errorCount} failed
                        </span>
                      )}
                    </div>
                  )}

                  {/* File cards */}
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {files.map((uploadFile) => (
                        <motion.div
                          key={uploadFile.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ duration: 0.16 }}
                          className={clsx(
                            'group/file rounded-xl border p-3 transition-colors',
                            uploadFile.status === 'error'
                              ? 'border-red-500/15 bg-red-500/[0.025]'
                              : uploadFile.status === 'done'
                                ? 'border-emerald-500/15 bg-emerald-500/[0.025]'
                                : 'border-white/[0.07] bg-[#171719] hover:border-white/[0.12]',
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.035]">
                              {getFileIcon(uploadFile.file.name)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p
                                    title={uploadFile.file.name}
                                    className="truncate text-xs font-medium text-slate-200"
                                  >
                                    {uploadFile.file.name}
                                  </p>
                                  <p className="mt-1 text-[10px] text-slate-500">
                                    {formatBytes(uploadFile.file.size)}
                                    <span className="mx-1.5 text-slate-700">
                                      ·
                                    </span>
                                    {getStatusLabel(uploadFile.status)}
                                  </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                  {uploadFile.status === 'pending' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeFile(uploadFile.id)
                                      }
                                      disabled={isUploading}
                                      aria-label={`Remove ${uploadFile.file.name}`}
                                      className="rounded-lg p-1 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  )}

                                  {uploadFile.status === 'uploading' && (
                                    <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                                  )}

                                  {uploadFile.status === 'done' && (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                  )}

                                  {uploadFile.status === 'error' && (
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                  )}
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                                <motion.div
                                  className={clsx(
                                    'h-full rounded-full',
                                    uploadFile.status === 'done'
                                      ? 'bg-emerald-500'
                                      : uploadFile.status === 'error'
                                        ? 'bg-red-500'
                                        : uploadFile.status === 'uploading'
                                          ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                                          : 'bg-white/10',
                                  )}
                                  initial={false}
                                  animate={{
                                    width:
                                      uploadFile.status === 'pending'
                                        ? '0%'
                                        : `${uploadFile.progress}%`,
                                  }}
                                  transition={{ duration: 0.2 }}
                                />
                              </div>

                              {/* Result or error details */}
                              {uploadFile.status === 'error' && (
                                <p className="mt-2 break-words text-[10px] leading-relaxed text-red-400">
                                  {uploadFile.error || 'Upload failed.'}
                                </p>
                              )}

                              {uploadFile.status === 'done' &&
                                uploadFile.result && (
                                  <p className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400">
                                    <Database className="h-3 w-3" />
                                    {uploadFile.result.chunksCreated ?? 0}{' '}
                                    chunks indexed
                                  </p>
                                )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {files.length === 0 && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/[0.08]">
                    <Sparkles className="h-4 w-4 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-300">
                      Turn your files into knowledge
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      Synapse extracts document content, creates searchable
                      chunks, and prepares it for semantic AI retrieval.
                    </p>
                  </div>
                </div>
              )}

              {/* Privacy / processing note */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/70" />
                Documents are processed by your configured backend
              </div>
            </div>

            {/* Footer */}
            <footer className="flex flex-col-reverse gap-3 border-t border-white/[0.07] bg-[#0d0d0f] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex min-w-0 items-center gap-2 text-[10px] text-slate-600">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                <span>
                  {isUploading
                    ? 'Processing your documents...'
                    : allDone
                      ? `${successCount} successful · ${errorCount} failed`
                      : `${pendingCount} document${pendingCount === 1 ? '' : 's'} ready`}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2">
                {allDone && errorCount > 0 && (
                  <button
                    type="button"
                    onClick={retryFailed}
                    disabled={isUploading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.09] px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:border-rose-500/30 hover:bg-rose-500/[0.05] hover:text-rose-300 disabled:opacity-40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Retry failed
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isUploading}
                  className="rounded-xl border border-white/[0.09] px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:border-white/[0.15] hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {allDone ? 'Close' : 'Cancel'}
                </button>

                {!allDone && (
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading || pendingCount === 0}
                    className="group flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Upload {pendingCount} file
                        {pendingCount !== 1 ? 's' : ''}
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadDialog;
