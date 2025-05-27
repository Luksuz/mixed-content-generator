"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Lightbulb, Search, RefreshCw, CheckCircle, Plus, X } from 'lucide-react';
import { motion } from "framer-motion";

interface TopicGroup {
  category: string;
  topics: string[];
}

const IdeationTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [topicGroups, setTopicGroups] = useState<TopicGroup[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // New state for multiple links
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");

  // Mock data for demonstration
  const mockTopicGroups: TopicGroup[] = [
    {
      category: "Harsh Lives & Brutal Jobs",
      topics: [
        "Surviving Life as a Medieval Executioner's Assistant",
        "Why It Sucked to Be a Royal Stable Boy",
        "Could You Survive as a Roman Gladiator Trainer?",
        "The Miserable Life of a Victorian Rat Catcher",
        "Why Being a Medieval Bell Ringer Was Actually Terrifying",
        "The Job of a Mummy Maker in Ancient Egypt"
      ]
    },
    {
      category: "Survive or Die: Historical Hard Mode",
      topics: [
        "Could You Survive a Winter in Feudal Japan?",
        "Why You Wouldn't Last a Day in a Viking Longhouse",
        "How to Not Die in a Medieval Siege (Spoiler: You Probably Will)",
        "Black Death: 100 Ways It Destroyed the World",
        "Why Being Born in the Middle Ages Was Basically a Death Sentence",
        "Could You Survive as a Woman in the Aztec Empire?"
      ]
    },
    {
      category: "Dark Medicine & Strange Beliefs",
      topics: [
        "Medieval Medical Practices That Would Kill You Today",
        "How Ancient Doctors \"Cured\" Mental Illness",
        "Why Pregnant Women Were Terrified of 16th Century Doctors",
        "Insane Theories Medieval Scientists Actually Believed",
        "How People with Disabilities Were \"Treated\" in History",
        "The Painful Truth Behind Bloodletting and Leeches"
      ]
    },
    {
      category: "Scandals, Sex & Secrets",
      topics: [
        "How Royal Families Hid Their Most Embarrassing Secrets",
        "What Really Happened in Medieval Bathhouses",
        "Forbidden Romances That Changed History",
        "The Dark Reality of Medieval Brothels",
        "Why Some Popes Had Secret Children (and Armies)",
        "How Courtesans Held More Power Than Queens"
      ]
    },
    {
      category: "Crime, Punishment & Public Humiliation",
      topics: [
        "The Most Ridiculous Crimes You Could Be Executed For",
        "Why People Were Publicly Shamed for Sneezing Wrong",
        "Real Medieval Crimes That Sound Like Jokes",
        "The Craziest Public Punishments in Feudal Societies",
        "How Ancient Courts Used Animals as Legal Witnesses",
        "Being Accused of Witchcraft in the 1500s: A Survival Guide"
      ]
    },
    {
      category: "Weird Culture & Everyday Life",
      topics: [
        "What It Was Like to Visit a Tavern in the Dark Ages",
        "Why Colorful Clothing Could Get You Killed",
        "The Meaning of Hairstyles in the Middle Ages",
        "What Kind of Music Did Medieval People Party To?",
        "How Toilets Worked in Castles (And Who Cleaned Them)",
        "What a Normal Day Looked Like for a Roman Peasant"
      ]
    },
    {
      category: "Death, Ghosts & the Afterlife",
      topics: [
        "How Medieval People Buried the Dead to Prevent Zombies",
        "Why Churches Kept Skeletons on Display",
        "Haunted Castles That Were Considered \"Normal\" Homes",
        "How Ancient Cultures Prepared for the End of the World",
        "The Forgotten Job of Grave Disturbers",
        "What People Thought Dying Felt Like in Different Eras"
      ]
    }
  ];

  const addLink = () => {
    if (newLink.trim() && !links.includes(newLink.trim())) {
      setLinks(prev => [...prev, newLink.trim()]);
      setNewLink("");
    }
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setTopicGroups([]);
    setSelectedTopics([]);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setTopicGroups(mockTopicGroups);
    setIsSearching(false);
    setHasSearched(true);
  };

  const handleRegenerateGroup = async (categoryIndex: number) => {
    // Simulate regenerating a specific category
    console.log(`Regenerating category: ${topicGroups[categoryIndex].category}`);
    // In a real implementation, you would call an API to regenerate topics for this category
  };

  const toggleTopicSelection = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleConfirmTitle = () => {
    if (selectedTopics.length === 0) {
      alert("Please select at least one topic.");
      return;
    }
    
    // Get the selected topic (if multiple, take the first one)
    const selectedTitle = selectedTopics[0];
    
    // Store in localStorage so the Script tab can access it
    localStorage.setItem('scriptGenerator.title', selectedTitle);
    
    // Optionally, switch to script tab
    // You could emit an event or use a callback prop to switch tabs
  };

  return (
    <Card className="w-full futuristic-card animate-fadeIn shadow-glow-red relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob w-[300px] h-[300px] top-0 right-0 opacity-5 absolute"></div>
      <div className="blob-red w-[200px] h-[200px] bottom-0 left-0 opacity-5 absolute"></div>
      
      <CardHeader className="relative z-10">
        <CardTitle className="gradient-text flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-red-400" />
          Ideation Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 relative z-10">
        {/* Links Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-link" className="glow-text">Reference Links</Label>
            <div className="flex gap-2">
              <Input
                id="new-link"
                placeholder="Add a reference link (URL, article, video, etc.)"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                className="futuristic-input"
                onKeyPress={(e) => e.key === 'Enter' && addLink()}
              />
              <Button 
                variant="outline"
                onClick={addLink}
                disabled={!newLink.trim()}
                className="futuristic-input hover:bg-red-600/20 hover:shadow-glow-red"
              >
                <Plus className="h-4 w-4 text-red-400" />
              </Button>
            </div>
            
            {links.length > 0 && (
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 border rounded-md p-2 backdrop-blur-sm bg-opacity-20 bg-red-900/10 border-red-700/30 animate-zoomIn" style={{animationDelay: `${index * 100}ms`}}>
                    <div className="flex-grow text-sm break-all">{link}</div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 hover:bg-red-700/20 hover:text-red-500 transition-colors" 
                      onClick={() => removeLink(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="text-xs text-muted-foreground">
                  {links.length} reference link{links.length !== 1 ? 's' : ''} added
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-query" className="glow-text">Search Query</Label>
            <Input
              id="search-query"
              placeholder="Enter anything you want to explore..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="futuristic-input"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <Button 
            className="w-full relative overflow-hidden shimmer bg-gradient-to-r from-red-600/80 to-red-700/80 border-0 shadow-glow-red" 
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>

        {/* Loading State */}
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 backdrop-blur-md bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-lg p-4"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-400">
                Generating Ideas...
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </motion.div>
        )}

        {/* Results Section */}
        {hasSearched && topicGroups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Selected Topics Counter */}
            {selectedTopics.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                <span className="text-green-300">
                  {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConfirmTitle}
                  className="bg-green-600/20 border-green-500/50 text-green-300 hover:bg-green-600/30"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Title
                </Button>
              </div>
            )}

            {/* Topic Groups */}
            {topicGroups.map((group, groupIndex) => (
              <motion.div
                key={groupIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
                className="space-y-3 p-4 border rounded-lg futuristic-card shadow-glow-red/50"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold gradient-text">
                    {group.category}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerateGroup(groupIndex)}
                    className="futuristic-input hover:bg-red-600/20 hover:shadow-glow-red"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {group.topics.map((topic, topicIndex) => (
                    <div 
                      key={topicIndex}
                      className="flex items-center gap-3 p-2 hover:bg-red-600/10 rounded-md transition-colors duration-200"
                    >
                      <Checkbox
                        id={`topic-${groupIndex}-${topicIndex}`}
                        checked={selectedTopics.includes(topic)}
                        onCheckedChange={() => toggleTopicSelection(topic)}
                        className="border-red-500/50 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                      <Label
                        htmlFor={`topic-${groupIndex}-${topicIndex}`}
                        className="flex-grow cursor-pointer text-sm"
                      >
                        {topic}
                      </Label>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!hasSearched && !isSearching && (
          <div className="text-center text-muted-foreground py-8">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-red-400/50" />
            <p>Enter a search query to discover engaging content ideas.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IdeationTab; 