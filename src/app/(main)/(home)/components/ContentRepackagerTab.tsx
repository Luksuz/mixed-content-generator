"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Recycle } from 'lucide-react'; // Using Recycle as PackageReuse is not available

const ContentRepackagerTab: React.FC = () => {
  return (
    <Card className="w-full futuristic-card animate-fadeIn shadow-glow-red relative overflow-hidden">
      <CardHeader className="relative z-10">
        <CardTitle className="gradient-text flex items-center gap-2">
          <Recycle className="h-5 w-5 text-red-400" />
          Content Repackager
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Repurpose and adapt your existing content for different platforms and formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <p className="text-muted-foreground">Content repackaging tools are currently in development.</p>
        {/* Placeholder for future content */}
      </CardContent>
    </Card>
  );
};

export default ContentRepackagerTab; 
