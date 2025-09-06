"use client";

import { useState } from "react";
import { Bot, Check, Loader2, Sparkles, X } from "lucide-react";

import { suggestContentChanges } from "@/ai/flows/suggest-content-changes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AiSuggesterProps {
  existingContent: string;
  onApplySuggestion: (newContent: string) => void;
}

interface Suggestion {
  suggestedContent: string;
  reasoning: string;
}

export function AiSuggester({
  existingContent,
  onApplySuggestion,
}: AiSuggesterProps) {
  const [newInformation, setNewInformation] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSuggest = async () => {
    if (!newInformation.trim()) {
      toast({
        variant: "destructive",
        title: "Input required",
        description: "Please provide some new information to get a suggestion.",
      });
      return;
    }

    setIsLoading(true);
    setSuggestion(null);

    try {
      const result = await suggestContentChanges({
        existingContent,
        newInformation,
      });
      setSuggestion(result);
    } catch (error) {
      console.error("AI suggestion failed:", error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description:
          "Failed to get AI suggestion. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (suggestion) {
      onApplySuggestion(suggestion.suggestedContent);
      setSuggestion(null);
      setNewInformation("");
      toast({
        title: "Suggestion Applied!",
        description: "The content has been updated.",
      });
    }
  };

  const handleReject = () => {
    setSuggestion(null);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6" />
          <div>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>
              Get AI-powered suggestions to improve your content.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-info">New Information</Label>
          <Textarea
            id="new-info"
            value={newInformation}
            onChange={(e) => setNewInformation(e.target.value)}
            placeholder="Enter a new fact, a different perspective, or a correction..."
          />
        </div>
        <Button
          onClick={handleSuggest}
          disabled={isLoading}
          className="w-full"
          variant="secondary"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Generating..." : "Get Suggestion"}
        </Button>
      </CardContent>

      {suggestion && (
        <div className="border-t">
          <CardHeader>
            <CardTitle className="text-lg">Suggestion Received</CardTitle>
            <CardDescription className="pt-1 !mt-0">
              {suggestion.reasoning}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={suggestion.suggestedContent}
              className="min-h-[200px] bg-muted/50"
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReject}>
              <X className="mr-2 h-4 w-4" /> Decline
            </Button>
            <Button onClick={handleAccept} className="bg-accent hover:bg-accent/90">
              <Check className="mr-2 h-4 w-4" /> Accept
            </Button>
          </CardFooter>
        </div>
      )}
    </Card>
  );
}
