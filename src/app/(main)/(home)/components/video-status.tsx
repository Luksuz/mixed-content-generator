"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import * as SelectPrimitive from '@radix-ui/react-select';
import { Download, AlertCircle, Clock, CheckCircle, Loader2, UploadCloud, ChevronsUpDown, Check, Film, Sparkles } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useInterval } from "@/hooks/use-interval";
import { motion } from "framer-motion";

export interface VideoJob {
  id: string; // video_id from backend
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string | null;
  errorMessage?: string | null;
  createdAt: Date | string; // Store as Date object or ISO string
  updatedAt?: Date | string;
  user_id: string; // Add user_id field
  thumbnail_url?: string | null;
  subtitles_url?: string | null; // Add subtitles URL field
}

interface DriveFolder {
  id: string;
  name: string;
}

interface VideoStatusProps {
  jobs: VideoJob[];
  isLoading: boolean; // Add isLoading prop
}

const VideoStatus: React.FC<VideoStatusProps> = ({ jobs, isLoading }) => {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [isFetchingFolders, setIsFetchingFolders] = useState<boolean>(false);
  const [targetFolderId, setTargetFolderId] = useState<string | undefined>(undefined);
  const [jobToUpload, setJobToUpload] = useState<VideoJob | null>(null);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState<boolean>(false);
  const [pollingJobs, setPollingJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const inProgressJobs = jobs.filter(job => 
      job.status === 'pending' || job.status === 'processing'
    );
    
    setPollingJobs(new Set(inProgressJobs.map(job => job.id)));
  }, [jobs]);

  useInterval(() => {
    if (pollingJobs.size === 0) return;

    const checkJobStatus = async (jobId: string) => {
      try {
        const response = await fetch(`/api/video-status/${jobId}`);
        
        if (!response.ok) {
          console.error(`Error checking status for job ${jobId}:`, response.statusText);
          return;
        }
        
        const data = await response.json();
        
        if (data.status === 'completed' || data.status === 'failed') {
          setPollingJobs(prev => {
            const updated = new Set(prev);
            updated.delete(jobId);
            return updated;
          });
          
          if (data.status === 'completed') {
            toast.success(`Video "${jobId}" is ready!`);
          } else {
            toast.error(`Video processing failed: ${data.errorMessage || 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error(`Failed to check status for job ${jobId}:`, error);
      }
    };

    Array.from(pollingJobs).forEach(checkJobStatus);
  }, 10000);

  const getStatusBadgeVariant = (status: VideoJob['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default'; // Greenish or primary
      case 'processing':
        return 'secondary'; // Yellowish or blue
      case 'pending':
        return 'outline'; // Gray
      case 'failed':
        return 'destructive'; // Red
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: VideoJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
      case 'pending':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status: VideoJob['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-emerald-500/30';
      case 'processing':
        return 'bg-gradient-to-r from-red-600/20 to-red-700/20 border-red-500/30';
      case 'pending':
        return 'bg-gradient-to-r from-slate-600/20 to-gray-600/20 border-slate-500/30';
      case 'failed':
        return 'bg-gradient-to-r from-red-600/20 to-rose-600/20 border-red-500/30';
      default:
        return 'bg-black/20 border-white/10';
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop() || `video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchDriveFolders = async () => {
    setIsFetchingFolders(true);
    try {
      const response = await fetch('/api/list-drive-folders');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch Drive folders');
      }
      const data = await response.json();
      setFolders(data.folders || []);
      if (data.folders && data.folders.length > 0) {
        // setTargetFolderId(data.folders[0].id); // Optionally pre-select first folder
      } else {
        toast.error("No Google Drive folders found or accessible.");
      }
    } catch (error: any) {
      console.error("Error fetching drive folders:", error);
      toast.error(error.message || "Could not load folders.");
      setFolders([]);
    } finally {
      setIsFetchingFolders(false);
    }
  };

  const handleInitiateDriveUpload = async (job: VideoJob) => {
    setJobToUpload(job);
    setTargetFolderId(undefined);
    if (folders.length === 0) {
      await fetchDriveFolders();
    }
  };

  const handleConfirmDriveUpload = async () => {
    if (!jobToUpload || !jobToUpload.videoUrl || !targetFolderId) {
      toast.error("Missing video URL or target folder.");
      return;
    }

    setIsUploadingToDrive(true);
    const toastId = toast.loading(`Preparing to upload video to Drive...`);

    try {
      toast.loading(`Downloading video for upload...`, { id: toastId });
      const videoResponse = await fetch(jobToUpload.videoUrl);
      if (!videoResponse.ok) throw new Error('Failed to download video file for upload.');
      const videoBlob = await videoResponse.blob();
      const videoFile = new File([videoBlob], jobToUpload.videoUrl.split('/').pop() || `video-${jobToUpload.id}.mp4`, {
        type: videoBlob.type || 'video/mp4',
      });

      toast.loading(`Uploading ${videoFile.name} to Google Drive...`, { id: toastId });
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('parentId', targetFolderId);

      const uploadApiResponse = await fetch('/api/upload-to-drive', {
        method: 'POST',
        body: formData,
      });

      const result = await uploadApiResponse.json();
      if (!uploadApiResponse.ok || result.error) {
        throw new Error(result.error || "Drive upload failed");
      }

      toast.success(`Successfully uploaded ${result.fileName} to Google Drive!`, { id: toastId });
      setJobToUpload(null);
      setTargetFolderId(undefined);

    } catch (error: any) {
      console.error("Drive upload error:", error);
      toast.error(`Drive upload failed: ${error.message}`, { id: toastId });
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // Transition variants for list animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Card className="mt-8 futuristic-card relative overflow-hidden animate-fadeIn shadow-glow-red">
      {/* Background blobs */}
      <div className="blob w-[250px] h-[250px] top-0 -right-20 opacity-10"></div>
      <div className="blob-red w-[200px] h-[200px] -bottom-10 -left-10 opacity-10"></div>

      <CardHeader className="relative z-10 border-b border-red-700/20">
        <CardTitle className="gradient-text flex items-center gap-2">
          <Film className="h-5 w-5 text-red-400" />
          Video Generation Jobs
        </CardTitle>
        {pollingJobs.size > 0 && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2 text-red-400" />
            <span className="glow-text-red">Polling for updates on {pollingJobs.size} job(s)...</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4 relative z-10 futuristic-scrollbar max-h-[600px] overflow-y-auto py-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-red-400 mr-3" />
            <span className="glow-text-red">Loading jobs...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Film className="h-12 w-12 text-red-400 opacity-50 mb-3" />
            <p className="text-muted-foreground">No video generation jobs found for the selected user.</p>
          </div>
        ) : (
          jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((job, index) => (
            <div 
              key={job.id} 
              className="flex flex-col sm:flex-row rounded-lg overflow-hidden border border-red-700/20 shadow-glow-red animate-zoomIn futuristic-card"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Thumbnail section */}
              <div className="sm:w-64 aspect-video bg-gradient-to-br from-slate-900 to-red-900/30 relative flex-shrink-0">
                {job.thumbnail_url ? (
                  <img 
                    src={job.thumbnail_url} 
                    alt="Video thumbnail" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Film className="h-10 w-10 text-muted-foreground opacity-50" />
                  </div>
                )}
                <Badge 
                  variant={getStatusBadgeVariant(job.status)} 
                  className={`absolute top-2 right-2 capitalize flex items-center gap-1 
                    ${job.status === 'completed' ? 'shadow-glow-red bg-red-500/20' : 
                      job.status === 'processing' ? 'shadow-glow-red bg-red-600/20' : 
                      job.status === 'pending' ? 'shadow-glow-red bg-red-400/20' : 
                      'shadow-glow-red bg-red-700/20'}`}
                >
                   {getStatusIcon(job.status)} 
                   {job.status}
                </Badge>
              </div>
              
              {/* Details section */}
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-medium truncate mr-2 glow-text-red" title={job.id}>
                      Video ID: {job.id.substring(0, 8)}...
                    </h3>
                    <span className="text-xs text-muted-foreground flex flex-wrap">
                      <span className="mr-2">Created: {formatDistanceToNow(new Date(job.createdAt))} ago</span>
                      {job.updatedAt && (
                        <span>Updated: {formatDistanceToNow(new Date(job.updatedAt))} ago</span>
                      )}
                    </span>
                    {job.subtitles_url && (
                      <span className="text-xs text-red-400 flex items-center mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        With subtitles
                      </span>
                    )}
                  </div>
              </div>
              
              {job.status === 'completed' && job.videoUrl && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleDownload(job.videoUrl!)}
                    className="flex-grow shimmer bg-gradient-to-r from-red-600/80 to-red-700/80 border-0 shadow-glow-red"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Video
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleInitiateDriveUpload(job)}
                    disabled={isFetchingFolders || (jobToUpload === job && isUploadingToDrive)}
                    className="flex-grow futuristic-input hover:bg-red-700/20 hover:shadow-glow-red"
                  >
                    <UploadCloud className="mr-2 h-4 w-4 text-red-400" />
                    {jobToUpload === job && isUploadingToDrive ? 'Uploading...' : (jobToUpload === job && isFetchingFolders ? 'Loading Folders...' : 'Upload to GDrive')}
                  </Button>
                </div>
              )}

              {jobToUpload === job && (
                <div className="mt-2 space-y-2 p-3 border rounded-md bg-red-900/10 border-red-700/20">
                  <p className="text-sm font-medium glow-text-red">Select Google Drive Folder:</p>
                  {isFetchingFolders ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2 text-red-400" />
                      <span className="text-muted-foreground">Fetching folders...</span>
                    </div>
                  ) : folders.length > 0 ? (
                    <SelectPrimitive.Root onValueChange={setTargetFolderId} value={targetFolderId}>
                      <SelectPrimitive.Trigger className="inline-flex items-center justify-between rounded-md border border-red-700/30 bg-red-900/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full backdrop-blur-sm">
                        <SelectPrimitive.Value placeholder="Select a folder..." />
                        <SelectPrimitive.Icon asChild>
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </SelectPrimitive.Icon>
                      </SelectPrimitive.Trigger>
                      <SelectPrimitive.Portal>
                        <SelectPrimitive.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-red-700/30 bg-red-900/90 text-white shadow-md animate-in fade-in-80 backdrop-blur-md">
                          <SelectPrimitive.Viewport className="p-1">
                            {folders.map(folder => (
                              <SelectPrimitive.Item 
                                key={folder.id} 
                                value={folder.id} 
                                className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-red-800/50 focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                              >
                                <SelectPrimitive.ItemText>{folder.name}</SelectPrimitive.ItemText>
                                <SelectPrimitive.ItemIndicator className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                  <Check className="h-4 w-4" />
                                </SelectPrimitive.ItemIndicator>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  ) : (
                    <p className="text-xs text-muted-foreground">No folders found or could not load them. Try signing in to Google Drive again or ensure permissions are correct.</p>
                  )}
                  <Button 
                    size="sm" 
                    onClick={handleConfirmDriveUpload} 
                    disabled={!targetFolderId || isUploadingToDrive || isFetchingFolders}
                    className="w-full shimmer bg-gradient-to-r from-red-700/80 to-red-800/80 border-0 shadow-glow-red"
                   >
                    {isUploadingToDrive ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Confirm Upload to Drive
                  </Button>
                </div>
              )}

              {job.status === 'failed' && job.errorMessage && (
                  <Alert variant="destructive" className="mt-2 text-xs bg-red-900/20 border-red-700/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription className="text-xs">
                    {job.errorMessage}
                  </AlertDescription>
                </Alert>
              )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default VideoStatus; 