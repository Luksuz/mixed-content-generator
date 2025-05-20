import { ScriptSection } from "@/types";
import { GeneratedImageSet, ImageProvider } from "@/types/image-generation";
import { VideoJob } from "@/app/(main)/(home)/components/video-status";

// Mock Script Data
export const mockScriptSections: ScriptSection[] = [
  {
    title: "Introduction",
    writingInstructions: "Write a brief introduction about AI technology and its impact on daily life.",
    image_generation_prompt: "Futuristic cityscape with AI-powered interfaces integrated into daily life, holographic displays, and people interacting with AI assistants, photorealistic, cinematic lighting, high detail"
  },
  {
    title: "Current Applications",
    writingInstructions: "Explain how AI is currently being used in healthcare, education, and transportation.",
    image_generation_prompt: "Split-screen showing: 1) Doctors using AI diagnostic tools with medical holographic displays, 2) Students learning with AI tutors in a futuristic classroom, 3) Self-driving vehicles navigating a smart city, cinematic, photorealistic"
  },
  {
    title: "Future Developments",
    writingInstructions: "Discuss the potential future developments of AI in the next decade.",
    image_generation_prompt: "Advanced humanoid robots working alongside humans in a clean, bright laboratory environment with holographic displays showing AI code and neural networks, utopian future, high-tech aesthetic, photorealistic"
  },
  {
    title: "Ethical Considerations",
    writingInstructions: "Address the ethical considerations and potential concerns surrounding AI development.",
    image_generation_prompt: "Philosophy discussion panel with diverse experts debating AI ethics, with visual metaphor of balanced scales containing human brain and circuit board, dramatic lighting, thought-provoking, realistic style"
  },
  {
    title: "Conclusion",
    writingInstructions: "Summarize the main points and provide a forward-looking conclusion.",
    image_generation_prompt: "Sunrise over futuristic cityscape with harmonious integration of nature and technology, hopeful scene showing humans and AI systems coexisting peacefully, golden hour lighting, inspirational"
  }
];

export const mockFullScriptMarkdown: string = `
# The Evolution and Impact of Artificial Intelligence

## Introduction
Artificial Intelligence (AI) has rapidly evolved from a theoretical concept to a transformative force in our daily lives. From the smartphones in our pockets to the algorithms determining what content we see online, AI technologies are increasingly woven into the fabric of modern society. This technological revolution is not only changing how we interact with machines but is reshaping entire industries and creating new possibilities previously confined to science fiction.

## Current Applications
### Healthcare
In healthcare, AI is revolutionizing diagnosis and treatment. Machine learning algorithms can now analyze medical images with accuracy that rivals—and sometimes exceeds—human specialists. Predictive analytics help identify patients at risk of developing certain conditions, allowing for earlier intervention and better outcomes. AI-powered robotic assistants are also making surgery more precise than ever before.

### Education
The education sector has embraced AI through personalized learning platforms that adapt to each student's needs. These systems can identify knowledge gaps, adjust difficulty levels, and provide customized resources that enhance the learning experience. Virtual tutors are available 24/7, democratizing access to quality education regardless of geographic or economic barriers.

### Transportation
Perhaps the most visible AI revolution is occurring in transportation. Autonomous vehicles are becoming increasingly sophisticated, promising safer roads by eliminating human error. Smart traffic management systems are reducing congestion in urban areas, while AI logistics optimization is making supply chains more efficient and environmentally friendly.

## Future Developments
Looking ahead, the next decade promises even more profound advancements. Quantum computing will likely supercharge AI capabilities, enabling the processing of vastly more complex problems. We may see the emergence of artificial general intelligence (AGI) that can perform any intellectual task that a human can do. Brain-computer interfaces could create direct pathways between human cognition and digital systems, fundamentally altering how we access and process information.

## Ethical Considerations
However, these advancements bring significant ethical challenges. Questions about privacy become increasingly urgent as AI systems collect and analyze more personal data. The potential for algorithmic bias requires vigilant oversight to ensure fair and equitable outcomes. Perhaps most profoundly, we must consider the implications for employment as automation capabilities expand, potentially displacing workers across various sectors.

## Conclusion
As we navigate this AI-powered future, our greatest challenge will be harnessing these powerful technologies while preserving human dignity, autonomy, and purpose. With thoughtful governance, inclusive design processes, and a commitment to ethical principles, AI can become one of humanity's greatest tools for solving complex problems and creating a more equitable world. The coming decades will be defined not just by what AI can do, but by how we choose to direct and integrate these capabilities into our societies.
`;

export const mockFullScriptCleaned: string = `The Evolution and Impact of Artificial Intelligence. Introduction. Artificial Intelligence has rapidly evolved from a theoretical concept to a transformative force in our daily lives. From the smartphones in our pockets to the algorithms determining what content we see online, AI technologies are increasingly woven into the fabric of modern society. This technological revolution is not only changing how we interact with machines but is reshaping entire industries and creating new possibilities previously confined to science fiction. Current Applications. In healthcare, AI is revolutionizing diagnosis and treatment. Machine learning algorithms can now analyze medical images with accuracy that rivals—and sometimes exceeds—human specialists. Predictive analytics help identify patients at risk of developing certain conditions, allowing for earlier intervention and better outcomes. AI-powered robotic assistants are also making surgery more precise than ever before. The education sector has embraced AI through personalized learning platforms that adapt to each student's needs. These systems can identify knowledge gaps, adjust difficulty levels, and provide customized resources that enhance the learning experience. Virtual tutors are available 24/7, democratizing access to quality education regardless of geographic or economic barriers. Perhaps the most visible AI revolution is occurring in transportation. Autonomous vehicles are becoming increasingly sophisticated, promising safer roads by eliminating human error. Smart traffic management systems are reducing congestion in urban areas, while AI logistics optimization is making supply chains more efficient and environmentally friendly. Future Developments. Looking ahead, the next decade promises even more profound advancements. Quantum computing will likely supercharge AI capabilities, enabling the processing of vastly more complex problems. We may see the emergence of artificial general intelligence that can perform any intellectual task that a human can do. Brain-computer interfaces could create direct pathways between human cognition and digital systems, fundamentally altering how we access and process information. Ethical Considerations. However, these advancements bring significant ethical challenges. Questions about privacy become increasingly urgent as AI systems collect and analyze more personal data. The potential for algorithmic bias requires vigilant oversight to ensure fair and equitable outcomes. Perhaps most profoundly, we must consider the implications for employment as automation capabilities expand, potentially displacing workers across various sectors. Conclusion. As we navigate this AI-powered future, our greatest challenge will be harnessing these powerful technologies while preserving human dignity, autonomy, and purpose. With thoughtful governance, inclusive design processes, and a commitment to ethical principles, AI can become one of humanity's greatest tools for solving complex problems and creating a more equitable world. The coming decades will be defined not just by what AI can do, but by how we choose to direct and integrate these capabilities into our societies.`;

// Mock Audio Data
export const mockAudioUrl = "https://storage.googleapis.com/ai-content-gen-mock-data/ai-evolution-narration.mp3";
export const mockSubtitlesUrl = "https://storage.googleapis.com/ai-content-gen-mock-data/ai-evolution-subtitles.srt";

// Mock Providers
export const mockProviders: ImageProvider[] = ["openai", "minimax"];

// Mock Image Data
export const mockGeneratedImageSets: GeneratedImageSet[] = [
  {
    originalPrompt: "Futuristic cityscape with AI-powered interfaces integrated into daily life, holographic displays, and people interacting with AI assistants, photorealistic, cinematic lighting, high detail",
    imageUrls: [
      "https://storage.googleapis.com/ai-content-gen-mock-data/futuristic-cityscape-1.jpg",
      "https://storage.googleapis.com/ai-content-gen-mock-data/futuristic-cityscape-2.jpg"
    ],
    imageData: []
  },
  {
    originalPrompt: "Split-screen showing: 1) Doctors using AI diagnostic tools with medical holographic displays, 2) Students learning with AI tutors in a futuristic classroom, 3) Self-driving vehicles navigating a smart city, cinematic, photorealistic",
    imageUrls: [
      "https://storage.googleapis.com/ai-content-gen-mock-data/ai-applications-1.jpg",
      "https://storage.googleapis.com/ai-content-gen-mock-data/ai-applications-2.jpg"
    ],
    imageData: []
  },
  {
    originalPrompt: "Advanced humanoid robots working alongside humans in a clean, bright laboratory environment with holographic displays showing AI code and neural networks, utopian future, high-tech aesthetic, photorealistic",
    imageUrls: [
      "https://storage.googleapis.com/ai-content-gen-mock-data/future-ai-1.jpg",
      "https://storage.googleapis.com/ai-content-gen-mock-data/future-ai-2.jpg"
    ],
    imageData: []
  },
  {
    originalPrompt: "Philosophy discussion panel with diverse experts debating AI ethics, with visual metaphor of balanced scales containing human brain and circuit board, dramatic lighting, thought-provoking, realistic style",
    imageUrls: [
      "https://storage.googleapis.com/ai-content-gen-mock-data/ai-ethics-1.jpg"
    ],
    imageData: []
  },
  {
    originalPrompt: "Sunrise over futuristic cityscape with harmonious integration of nature and technology, hopeful scene showing humans and AI systems coexisting peacefully, golden hour lighting, inspirational",
    imageUrls: [
      "https://storage.googleapis.com/ai-content-gen-mock-data/ai-future-harmony-1.jpg",
      "https://storage.googleapis.com/ai-content-gen-mock-data/ai-future-harmony-2.jpg"
    ],
    imageData: []
  },
  {
    originalPrompt: "A woman with headphones sitting at a desk with multiple holographic screens displaying voice analysis software and waveforms, glowing blue and purple interface, futuristic audio recording studio",
    imageUrls: [
      "https://storage.googleapis.com/ai-content-gen-mock-data/audio-production-1.jpg"
    ],
    imageData: []
  }
];

// Enhanced Mock Thumbnail Data
export const mockThumbnailUrl = "https://storage.googleapis.com/ai-content-gen-mock-data/ai-evolution-thumbnail.jpg";

export const mockThumbnails = [
  {
    id: "thumb-001",
    url: "https://storage.googleapis.com/ai-content-gen-mock-data/thumbnails/ai-future-blue.jpg",
    title: "The Future of AI",
    style: "futuristic",
    colors: ["blue", "cyan"],
    description: "Futuristic cityscape with neural network overlay"
  },
  {
    id: "thumb-002",
    url: "https://storage.googleapis.com/ai-content-gen-mock-data/thumbnails/ai-healthcare-green.jpg",
    title: "AI in Healthcare",
    style: "professional",
    colors: ["green", "white"],
    description: "Doctor using AI diagnostics with holographic interface"
  },
  {
    id: "thumb-003",
    url: "https://storage.googleapis.com/ai-content-gen-mock-data/thumbnails/ai-ethics-orange.jpg",
    title: "Ethical Considerations in AI",
    style: "dramatic",
    colors: ["orange", "red"],
    description: "Balance scale with human and robot silhouettes"
  },
  {
    id: "thumb-004",
    url: "https://storage.googleapis.com/ai-content-gen-mock-data/thumbnails/ai-education-purple.jpg",
    title: "AI Revolution in Education",
    style: "colorful",
    colors: ["purple", "pink"],
    description: "Students in futuristic classroom with AI tutor"
  },
  {
    id: "thumb-005",
    url: "https://storage.googleapis.com/ai-content-gen-mock-data/thumbnails/ai-transport-silver.jpg",
    title: "The Future of Transportation",
    style: "minimal",
    colors: ["gray", "blue"],
    description: "Autonomous vehicles in smart city environment"
  }
];

// Function to get a random thumbnail
export const getRandomThumbnail = () => {
  return mockThumbnails[Math.floor(Math.random() * mockThumbnails.length)];
};

// Function to generate a thumbnail based on a theme or keyword
export const getThumbnailByTheme = (theme: string) => {
  const themesMap: {[key: string]: string} = {
    "health": "thumb-002",
    "healthcare": "thumb-002",
    "medical": "thumb-002",
    "ethics": "thumb-003",
    "ethical": "thumb-003",
    "future": "thumb-001",
    "education": "thumb-004",
    "learning": "thumb-004",
    "transport": "thumb-005",
    "transportation": "thumb-005",
    "vehicle": "thumb-005",
    "car": "thumb-005"
  };
  
  const thumbId = themesMap[theme.toLowerCase()] || "thumb-001";
  return mockThumbnails.find(thumb => thumb.id === thumbId) || mockThumbnails[0];
};

// Function to simulate thumbnail generation with a delay
export const simulateThumbnailGeneration = async (prompt: string): Promise<string> => {
  await simulateLoading(2000); // Wait 2 seconds
  
  // Define the themesMap here so it's accessible
  const themesMap: {[key: string]: string} = {
    "health": "thumb-002",
    "healthcare": "thumb-002",
    "medical": "thumb-002",
    "ethics": "thumb-003",
    "ethical": "thumb-003",
    "future": "thumb-001",
    "education": "thumb-004",
    "learning": "thumb-004",
    "transport": "thumb-005",
    "transportation": "thumb-005",
    "vehicle": "thumb-005",
    "car": "thumb-005"
  };
  
  // Find matching keywords in the prompt
  const matches = Object.keys(themesMap).filter(keyword => 
    prompt.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Get a themed thumbnail or a random one if no themes match
  const thumbnailId = matches.length > 0 ? themesMap[matches[0]] : mockThumbnails[0].id;
  const thumbnail = mockThumbnails.find(thumb => thumb.id === thumbnailId) || mockThumbnails[0];
    
  return thumbnail.url;
};

// Mock Video Data
export const mockVideoUrl = "https://storage.googleapis.com/ai-content-gen-mock-data/ai-evolution-video.mp4";

// Mock Video Jobs
export const mockVideoJobs: VideoJob[] = [
  {
    id: "video-12345",
    status: "completed",
    videoUrl: "https://storage.googleapis.com/ai-content-gen-mock-data/ai-evolution-video.mp4",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000), // 6.5 days ago
    user_id: "user-123",
    thumbnail_url: "https://storage.googleapis.com/ai-content-gen-mock-data/ai-evolution-thumbnail.jpg"
  },
  {
    id: "video-23456",
    status: "processing",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    user_id: "user-123"
  },
  {
    id: "video-34567",
    status: "pending",
    createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
    user_id: "user-123"
  },
  {
    id: "video-45678",
    status: "failed",
    errorMessage: "Error processing video: Audio file could not be processed",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 3 days and 30 minutes ago
    user_id: "user-123"
  }
];

// Mock function to simulate loading delay
export const simulateLoading = (ms = 1500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper function to get random items from an array
export const getRandomItems = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to generate a random string ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
}; 