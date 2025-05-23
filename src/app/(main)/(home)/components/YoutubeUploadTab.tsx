"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Youtube } from 'lucide-react';

const YoutubeUploadTab: React.FC = () => {
  return (
    <Card className="w-full futuristic-card animate-fadeIn shadow-glow-red relative overflow-hidden">
      <CardHeader className="relative z-10">
        <CardTitle className="gradient-text flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-400" />
          Upload to YouTube
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Streamline your video uploading process directly to YouTube.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <p className="text-muted-foreground">YouTube uploading integration coming soon.</p>
        {/* Placeholder for future content */}
      </CardContent>
    </Card>
  );
};

export default YoutubeUploadTab; 