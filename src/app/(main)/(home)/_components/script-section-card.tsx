"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScriptSection } from "@/types";

interface ScriptSectionCardProps {
  section: ScriptSection;
  index: number;
  onUpdate: (updatedSection: ScriptSection) => void;
}

const ScriptSectionCard = ({
  section,
  index,
  onUpdate,
}: ScriptSectionCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(section.title);
  const [editedInstructions, setEditedInstructions] = useState(
    section.writingInstructions
  );

  const handleSave = () => {
    onUpdate({
      title: editedTitle,
      writingInstructions: editedInstructions,
      image_generation_prompt: section.image_generation_prompt,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(section.title);
    setEditedInstructions(section.writingInstructions);
    setIsEditing(false);
  };

  return (
    <div className="border rounded-lg p-4 bg-card shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">
            Section {index + 1}
          </span>
        </div>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <Label htmlFor={`title-${index}`}>Title</Label>
            <Input
              id={`title-${index}`}
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`instructions-${index}`}>Writing Instructions</Label>
            <textarea
              id={`instructions-${index}`}
              value={editedInstructions}
              onChange={(e) => setEditedInstructions(e.target.value)}
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{section.title}</h3>
          <div className="text-sm whitespace-pre-wrap">
            {section.writingInstructions}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptSectionCard; 