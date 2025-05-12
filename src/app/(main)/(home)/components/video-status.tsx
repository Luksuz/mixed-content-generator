"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface VideoJob {
  id: string; // video_id from backend
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string | null;
  errorMessage?: string | null;
  createdAt: Date | string; // Store as Date object or ISO string
  updatedAt?: Date | string;
}

interface VideoStatusProps {
  jobs: VideoJob[];
}

const VideoStatus: React.FC<VideoStatusProps> = ({ jobs }) => {

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
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
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

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Video Generation Jobs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.length === 0 && (
          <p className="text-sm text-muted-foreground">No video generation jobs started yet.</p>
        )}
        {jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((job) => (
          <div key={job.id} className="p-4 border rounded-md space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium truncate mr-2" title={job.id}>Job ID: {job.id.substring(0, 8)}...</p>
              <Badge variant={getStatusBadgeVariant(job.status)} className="capitalize flex items-center gap-1">
                 {getStatusIcon(job.status)} 
                 {job.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Started: {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
            </p>
            {job.status === 'completed' && job.videoUrl && (
              <Button 
                size="sm" 
                onClick={() => handleDownload(job.videoUrl!)}
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Video
              </Button>
            )}
            {job.status === 'failed' && job.errorMessage && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="text-xs">
                  {job.errorMessage}
                </AlertDescription>
              </Alert>
            )}
            {/* We might need a way to trigger status updates here later */}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default VideoStatus; 