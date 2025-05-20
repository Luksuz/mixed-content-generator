'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { 
  Folder, 
  FileIcon, 
  ChevronRight, 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  Archive, 
  FileCode,
  Play,
  UploadCloud,
  CloudIcon,
  Sparkles,
  FolderIcon,
  AlertCircle
} from 'lucide-react';
import { toast } from "react-hot-toast";

// Assuming you might need both the Root and Viewport from Radix ScrollArea
const ScrollArea = ScrollAreaPrimitive.Root;
const ScrollAreaViewport = ScrollAreaPrimitive.Viewport;

interface Item {
  id: string;
  name: string;
  type: 'folder' | 'file';
  extension?: string;
  children?: Item[];
  size?: number;
  icon?: string;
}

export default function GoogleDriveComponent() {
  const { data: session, status } = useSession();
  const [structure, setStructure] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  
  // Upload state
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden file input

  // Function to fetch structure (extracted for reuse)
  const fetchStructure = async () => {
    if (status === 'authenticated') {
      try {
        setIsLoading(true);
        setFetchError(null);
        const response = await fetch('/api/folders');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch folder structure (${response.status})`);
        }
        const data = await response.json();
        setStructure(data.structure || []);
      } catch (error: any) {
        console.error('Error fetching folder structure:', error);
        setFetchError(error.message || 'An unknown error occurred');
        setStructure([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStructure(); // Fetch on initial load/auth change
  }, [status]);

  const toggleFolderOpen = (folderId: string) => {
    setOpenFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Handle file selection from hidden input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFileToUpload(event.target.files[0]);
    }
  };

  // Trigger hidden file input click
  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  // Handle the upload process
  const handleUpload = async () => {
    if (!fileToUpload) {
      toast.error("Please select a file first.");
      return;
    }
    if (status !== 'authenticated') {
      toast.error("Please sign in to upload.");
      return;
    }

    // Simplified parentId logic for direct uploads, always uploads to 'root' for now
    const parentId = 'root'; 

    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${fileToUpload.name} to Drive root...`);

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('parentId', parentId);

    try {
      const response = await fetch('/api/upload-to-drive', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Upload failed with status: " + response.status);
      }

      toast.success(`Successfully uploaded ${result.fileName}!`, { id: toastId });
      setFileToUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchStructure(); 

    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error.message}`, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to get file-specific icon
  const getFileIcon = (extension?: string) => {
    const ext = extension?.toLowerCase();
    switch (ext) {
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
      case 'odt':
        return <FileText size={16} className="text-blue-400 mr-2 flex-shrink-0" />;
      case 'pdf':
        return <FileText size={16} className="text-red-400 mr-2 flex-shrink-0" />; // PDF often red
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet size={16} className="text-green-400 mr-2 flex-shrink-0" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
      case 'webp':
        return <FileImage size={16} className="text-purple-400 mr-2 flex-shrink-0" />;
      case 'mp3':
      case 'wav':
      case 'aac':
      case 'ogg':
        return <Play size={16} className="text-orange-400 mr-2 flex-shrink-0" />; // Using FilePlay for audio
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'mkv':
        return <Play size={16} className="text-indigo-400 mr-2 flex-shrink-0" />; // Using FilePlay for video
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return <Archive size={16} className="text-yellow-400 mr-2 flex-shrink-0" />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'html':
      case 'css':
      case 'json':
      case 'py':
      case 'java':
        return <FileCode size={16} className="text-teal-400 mr-2 flex-shrink-0" />;
      default:
        return <FileIcon size={16} className="text-gray-400 mr-2 flex-shrink-0" />;
    }
  };

  const renderItem = (item: Item, level: number = 0) => {
    const isFolderOpen = openFolders[item.id] || false;
    const basePadding = level * 1.5;

    const itemContainerClasses = `flex items-center space-x-2 p-2 mb-1 transition-colors w-full 
      ${item.type === 'folder' 
        ? 'rounded-md border border-blue-500/20 bg-blue-900/10 hover:bg-blue-800/20 backdrop-blur-sm'
        : 'rounded-md border border-cyan-500/20 bg-slate-900/30 hover:bg-slate-800/40 backdrop-blur-sm'
      }`;

    if (item.type === 'folder') {
      return (
        <CollapsiblePrimitive.Root 
          key={item.id} 
          open={isFolderOpen} 
          onOpenChange={() => toggleFolderOpen(item.id)}
          style={{ paddingLeft: `${basePadding}rem` }}
          className="animate-zoomIn"
        >
          <div className={itemContainerClasses}>
            <CollapsiblePrimitive.Trigger asChild>
              <button className="flex items-center text-left flex-grow p-1 rounded hover:bg-blue-800/30 min-w-0 transition-colors">
                <ChevronRight 
                  size={16} 
                  className={`transform transition-transform duration-150 ${isFolderOpen ? 'rotate-90' : ''} mr-1 flex-shrink-0 text-blue-400`}
                />
                <Folder size={16} className="text-blue-400 mr-2 flex-shrink-0" />
                <span 
                  className="text-sm font-medium cursor-pointer truncate flex-grow min-w-0 glow-text"
                  title={item.name}
                >
                  {item.name}
                </span>
              </button>
            </CollapsiblePrimitive.Trigger>
          </div>
          <CollapsiblePrimitive.Content className="overflow-hidden transition-all duration-300 ease-in-out">
            {item.children && item.children.length > 0 && (
              <ul className="mt-1 border-l border-dashed border-blue-500/30 ml-2">
                {item.children.map((child) => renderItem(child, level + 1))}
              </ul>
            )}
          </CollapsiblePrimitive.Content>
        </CollapsiblePrimitive.Root>
      );
    } else {
      return (
        <div 
          key={item.id} 
          className={itemContainerClasses} 
          style={{ marginLeft: `${basePadding}rem` }}
        >
          <span style={{ width: '16px' }} className="mr-1 flex-shrink-0"></span>
          {getFileIcon(item.extension)}
          <span 
            className="text-sm font-medium truncate flex-grow min-w-0 text-cyan-300"
            title={item.name}
          >
            {item.name}
          </span>
        </div>
      );
    }
  };

  if (status === 'loading') {
    return (
      <div className="p-6 text-center animate-pulse">
        <div className="inline-flex items-center gap-2">
          <CloudIcon className="h-6 w-6 text-blue-400 animate-pulse" />
          <span className="glow-text">Loading session...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg futuristic-card m-4 animate-fadeIn">
        <CloudIcon className="h-12 w-12 text-blue-400 mb-4 animate-float" />
        <p className="mb-6 text-muted-foreground text-center">
          Connect your Google Drive account to browse and manage your files.
        </p>
        <Button 
          onClick={() => signIn('google')} 
          className="shimmer bg-gradient-to-r from-blue-600/80 to-purple-600/80 border-0 shadow-glow-blue"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Connect to Google Drive
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 relative animate-fadeIn">
      {/* Background effects */}
      <div className="blob w-[250px] h-[250px] top-0 -right-20 opacity-5 z-0"></div>
      <div className="blob-cyan w-[250px] h-[250px] -bottom-40 -left-20 opacity-5 z-0"></div>
      
      {isLoading && (
        <div className="p-6 text-center animate-pulse flex flex-col items-center">
          <CloudIcon className="h-8 w-8 text-blue-400 mb-2 animate-spin" />
          <span className="glow-text">Loading files...</span>
        </div>
      )}
      
      {fetchError && (
        <div className="text-red-500 p-4 text-center bg-red-900/20 border border-red-500/30 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 inline-block mr-2" />
          Error: {fetchError}
        </div>
      )}
      
      {!isLoading && !fetchError && (
        <ScrollArea className="w-full border border-blue-500/20 rounded-lg p-2 futuristic-card shadow-glow-blue relative z-10">
          <ScrollAreaViewport className="futuristic-scrollbar max-h-[400px]">
            {structure.length > 0 ? (
              <ul>{structure.map((item) => renderItem(item, 0))}</ul>
            ) : (
              <div className="text-muted-foreground text-center p-8 flex flex-col items-center">
                <FolderIcon className="h-10 w-10 text-blue-400/50 mb-3" />
                <p>No files or folders found.</p>
              </div>
            )}
          </ScrollAreaViewport>
        </ScrollArea>
      )}
      
      {!isLoading && (
        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-blue-500/20 space-y-2 sm:space-y-0 sm:space-x-4 relative z-10">
          <div className="flex items-center space-x-2 flex-grow min-w-0">
             {/* Hidden File Input */}
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               style={{ display: 'none' }} 
             />
             <Button 
               variant="outline" 
               size="sm" 
               onClick={handleSelectFileClick}
               disabled={isUploading}
               className="futuristic-input hover:bg-blue-600/20 hover:shadow-glow-blue"
             >
               <FileIcon className="mr-2 h-4 w-4 text-blue-400" />
               Select File to Upload to Root
             </Button>
             {fileToUpload && (
               <span className="text-sm text-cyan-400 truncate flex-shrink-0 border border-cyan-500/30 bg-cyan-900/20 px-3 py-1 rounded-full" title={fileToUpload.name}> 
                 {fileToUpload.name}
               </span>
             )}
          </div>
          
          <Button 
            onClick={handleUpload} 
            disabled={!fileToUpload || isUploading}
            size="sm" 
            className="flex-shrink-0 shimmer bg-gradient-to-r from-blue-600/80 to-cyan-600/80 border-0 shadow-glow-cyan relative overflow-hidden"
          >
            {isUploading ? (
              <span className="flex items-center">
                <CloudIcon className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </span>
            ) : (
              <span className="flex items-center">
                <UploadCloud size={16} className="mr-2" />
                Upload to Root
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 