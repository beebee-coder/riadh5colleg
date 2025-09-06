"use client";

import { useState } from "react";
import { AiSuggester } from "@/components/ai-suggester";
import { ContentEditor } from "@/components/content-editor";
import { Icons } from "@/components/icons";

export default function SimplePageClient() {
  const [title, setTitle] = useState("Welcome to SimplePage");
  const [content, setContent] = useState(
    "This is a simple page that you can edit. The content is managed in real-time. On the right, you can use the AI assistant to get suggestions for improving your content. Just provide some new information, and the AI will determine if it's useful and suggest an updated version of this text."
  );
  const [key, setKey] = useState(0);

  const handleApplySuggestion = (newContent: string) => {
    setContent(newContent);
    setKey((prevKey) => prevKey + 1); // Re-trigger animation on content change
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Icons.logo className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              SimplePage
            </span>
          </div>
        </div>
      </header>

      <main
        key={key}
        className="flex-1 animate-in fade-in-50 duration-500"
      >
        <div className="container mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
            <ContentEditor
              title={title}
              content={content}
              setTitle={setTitle}
              setContent={setContent}
            />
            <div className="lg:sticky lg:top-24">
              <AiSuggester
                existingContent={content}
                onApplySuggestion={handleApplySuggestion}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
