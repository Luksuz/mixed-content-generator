"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lightbulb } from 'lucide-react';

const IdeationTab: React.FC = () => {
  return (
    <Card className="w-full futuristic-card animate-fadeIn shadow-glow-red relative overflow-hidden">
      <CardHeader className="relative z-10">
        <CardTitle className="gradient-text flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-red-400" />
          Ideation Assistant
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Explore content ideas, analyze YouTube channels, and kickstart your scriptwriting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <p className="text-muted-foreground">Ideation features coming soon. (e.g., YouTube link analysis, idea suggestions, etc.)</p>
        {/* Placeholder for future content */}
      </CardContent>
    </Card>
  );
};

export default IdeationTab; 