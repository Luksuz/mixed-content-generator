export * from './supabase'; // Export Supabase types
export * from './image-generation';
export * from './video-generation';

// Define a generic User type if needed, or rely on Supabase User type directly
// For example, if you have app-specific user properties beyond Supabase auth user

// Keep existing User type for predefinedUsers or adjust if it conflicts
export interface User {
  id: string;
  name: string;
  // Add other app-specific user properties here if any
}

export const predefinedUsers: User[] = [
  { id: 'user1', name: 'Alice' },
  { id: 'user2', name: 'Bob' },
  { id: 'user3', name: 'Charlie' },
];


// You might want to define Job types here too, e.g.
export interface Job {
  id: string;
  userId: string;
  type: 'image_generation' | 'video_generation'; // or other job types
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  // Add other job-specific properties
  prompt?: string; // example for image/video generation
  resultUrl?: string;
}

export interface ScriptSection {
  title: string;
  writingInstructions: string;
  image_generation_prompt: string;
}
