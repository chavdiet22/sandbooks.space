import React from 'react';
import { useNotesStore } from '../store/notesStore';
import { FaFolderOpen, FaUnlink } from 'react-icons/fa';

export const FileSystemSync: React.FC = () => {
    const { connectToLocalFolder, disconnectFromLocalFolder, storageType, storageName } = useNotesStore();

    // Show connected state when using file system
    if (storageType === 'fileSystem') {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-green-500 bg-green-500/10 rounded-md">
                <FaFolderOpen />
                <span className="truncate max-w-[150px]" title={storageName}>
                    {storageName}
                </span>
                <button
                    onClick={disconnectFromLocalFolder}
                    className="ml-auto p-1 hover:bg-green-500/20 rounded"
                    title="Switch back to browser storage"
                >
                    <FaUnlink />
                </button>
            </div>
        );
    }

    // Show connect button when in localStorage mode
    return (
        <button
            onClick={connectToLocalFolder}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-md w-full transition-colors"
            title="Connect to a local folder - notes will be saved as markdown files"
        >
            <FaFolderOpen />
            <span>Open Folder</span>
        </button>
    );
};
