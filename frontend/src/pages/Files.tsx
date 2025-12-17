import React, { useState, useRef, useEffect } from 'react';
import { Folder, FileText, Image, MoreHorizontal, Download, UploadCloud, File as FileIcon, Archive, Box, Trash2, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FileAsset, ProjectFolder } from '../types';
import { uploadFile, fetchFiles, deleteFile } from '../services/fileService';
import { toast } from 'react-hot-toast';

interface DeletedToast {
  id: string;
  file: FileAsset;
  timeoutId: NodeJS.Timeout;
}

const Files: React.FC = () => {
  const { user } = useAuth();
  const [folders] = useState<ProjectFolder[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Delete Logic State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileAsset | null>(null);
  const [toasts, setToasts] = useState<DeletedToast[]>([]);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadFiles();
  }, [user]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await fetchFiles();
      setRecentFiles(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileType = (fileName: string): FileAsset['type'] => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image';
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx'].includes(ext || '')) return 'doc';
    if (['zip', 'rar', '7z', 'tar'].includes(ext || '')) return 'archive';
    return 'other';
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    const toastId = toast.loading('Uploading files...');

    try {
      // Upload sequentially or parallel
      for (let i = 0; i < files.length; i++) {
        await uploadFile(files[i], user.id);
      }

      toast.success('Upload complete', { id: toastId });

      // Refresh list
      await loadFiles();

    } catch (err: any) {
      console.error(err);
      toast.error('Upload failed: ' + err.message, { id: toastId });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = (file: FileAsset) => {
    // Just open the URL
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (isYesterday) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFileIcon = (type: FileAsset['type']) => {
    switch (type) {
      case 'image': return <Image size={16} />;
      case 'doc': return <FileText size={16} />;
      case 'archive': return <Archive size={16} />;
      default: return <FileIcon size={16} />;
    }
  };

  // Delete Handlers
  const handleDeleteClick = (file: FileAsset) => {
    setFileToDelete(file);
    setDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setFileToDelete(null);
  };

  const confirmDelete = () => {
    if (!fileToDelete) return;

    const file = fileToDelete;

    // Optimistic remove
    setRecentFiles(prev => prev.filter(f => f.id !== file.id));
    setDeleteModalOpen(false);
    setFileToDelete(null);

    // Add toast with undo capability
    const toastId = Math.random().toString(36).substr(2, 9);

    // DELAYED DELETION
    const timeoutId = setTimeout(async () => {
      try {
        await deleteFile(file.id, file.url);
        // Remove toast from state
        setToasts(prev => prev.filter(t => t.id !== toastId));
      } catch (err: any) {
        console.error('Failed to delete file', err);
        // Optionally revert? For now, silent fail or toast error
        toast.error('Failed to delete ' + file.name);
        // Revert UI if needed, but tricky since we are inside timeout
        loadFiles(); // Sync
      }
    }, 5000); // 5 seconds to undo

    setToasts(prev => [...prev, { id: toastId, file, timeoutId }]);
  };

  const handleUndo = (toastItem: DeletedToast) => {
    clearTimeout(toastItem.timeoutId); // CANCEL DB DELETE
    // Restore file in UI
    setRecentFiles(prev => [toastItem.file, ...prev]);
    // Remove toast
    setToasts(prev => prev.filter(t => t.id !== toastItem.id));
  };

  return (
    <div className="space-y-8 relative">
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && fileToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancelDelete();
          }}
        >
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle size={24} />
              </div>
              <h3 id="delete-modal-title" className="text-lg font-bold text-white">Delete file?</h3>
            </div>

            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Are you sure you want to delete <span className="text-white font-medium">"{fileToDelete.name}"</span> ({fileToDelete.sizeLabel})?
              <br />This action can be undone for 5 seconds.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                ref={deleteButtonRef}
                autoFocus
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-900/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toasts Container */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#222] border border-gray-700 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-2 fade-in duration-300 w-fit"
            role="alert"
          >
            <span className="text-sm text-gray-300">
              <span className="font-bold text-white">{toast.file.name}</span> deleted
            </span>
            <div className="h-4 w-px bg-gray-700" />
            <button
              onClick={() => handleUndo(toast)}
              className="text-sm font-bold text-[#1DCD9C] hover:underline focus:outline-none focus:ring-2 focus:ring-[#1DCD9C] rounded px-1"
            >
              Undo
            </button>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-gray-500 hover:text-white transition-colors ml-1"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Assets & Files</h2>

        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <button
          onClick={handleUploadClick}
          disabled={uploading}
          className={`flex items-center gap-2 bg-[#1DCD9C] text-black font-semibold px-4 py-2 rounded-lg transition-colors text-sm ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1abe90]'
            }`}
        >
          <UploadCloud size={18} /> {uploading ? 'Uploading...' : 'Upload New'}
        </button>
      </div>

      <div>
        <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4">Project Folders</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {folders.length === 0 ? (
            <p className="text-gray-500 text-sm col-span-3">No folders found.</p>
          ) : (
            folders.map((folder) => (
              <div key={folder.id} className="bg-[#222] border border-gray-800 p-4 rounded-xl hover:border-[#1DCD9C]/50 cursor-pointer transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <Folder size={40} className="text-[#1DCD9C] fill-[#1DCD9C]/20" />
                  <button className="text-gray-500 hover:text-white"><MoreHorizontal size={20} /></button>
                </div>
                <h4 className="text-white font-medium group-hover:text-[#1DCD9C] transition-colors">{folder.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{folder.fileCount} files • {folder.totalSizeLabel}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4">Recent Uploads</h3>
        <div className="bg-[#222] border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500">
                  <th className="p-4 font-normal">Name</th>
                  <th className="p-4 font-normal hidden md:table-cell">Date Uploaded</th>
                  <th className="p-4 font-normal hidden md:table-cell">Size</th>
                  <th className="p-4 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentFiles.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-500">{loading ? 'Loading...' : 'No files uploaded yet.'}</td></tr>
                ) : (
                  recentFiles.map((file) => (
                    <tr key={file.id} className={`border-b border-gray-800 last:border-0 hover:bg-white/5 transition-colors ${file.isNew ? 'bg-[#1DCD9C]/5' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-gray-800 text-gray-400">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-200 font-medium">{file.name}</span>
                              {file.isNew && (
                                <span className="text-[10px] bg-[#1DCD9C] text-black px-1.5 rounded font-bold">New</span>
                              )}
                            </div>
                            {/* Mobile only details */}
                            <div className="md:hidden text-xs text-gray-500 mt-0.5">
                              {file.sizeLabel} • {formatDate(file.uploadedAt || '')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500 hidden md:table-cell">{formatDate(file.uploadedAt || '')}</td>
                      <td className="p-4 text-gray-500 hidden md:table-cell font-mono text-xs">{file.sizeLabel}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(file)}
                            className="text-gray-400 hover:text-[#1DCD9C] p-2 transition-colors rounded-lg hover:bg-white/5"
                            aria-label={`Download file ${file.name}`}
                            title="Download file"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(file)}
                            className="text-gray-400 hover:text-red-400 p-2 transition-colors rounded-lg hover:bg-white/5"
                            aria-label={`Delete file ${file.name}`}
                            title="Delete file"
                            tabIndex={0}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Files;
