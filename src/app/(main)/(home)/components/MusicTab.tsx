"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Music2 } from 'lucide-react';

const MusicTab: React.FC = () => {
  return (
    <Card className="w-full futuristic-card animate-fadeIn shadow-glow-red relative overflow-hidden">
      <CardHeader className="relative z-10">
        <CardTitle className="gradient-text flex items-center gap-2">
          <Music2 className="h-5 w-5 text-red-400" />
          Music Generation
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          AI-powered music generation and selection for your videos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <p className="text-muted-foreground">Music generation features are under development.</p>
        {/* Placeholder for future content */}
      </CardContent>
    </Card>
  );
};

export default MusicTab; 