
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { generateInitialContent, iterateOnSelection, getProactiveSuggestions, getChatResponse } from './services/geminiService';
import { AttachedFile, SelectionInfo, Suggestion, FlowData, ChatMessage } from './types';
import InitialPrompt from './components/InitialPrompt';
import Toolbar from './components/Toolbar';
import Header from './components/Header';
import FlowBuilder from './components/FlowBuilder';
import Login from './components/Login';
import Chatbot from './components/Chatbot';
import { useTranslations } from './contexts/LanguageContext';

export type View = 'writer' | 'flow';

// Simple debounce function
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isIterating, setIsIterating] = useState<boolean>(false);
  const [showInitialPrompt, setShowInitialPrompt] = useState<boolean>(true);
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null);
  const [activeView, setActiveView] = useState<View>('writer');
  const [flow, setFlow] = useState<FlowData>({
    nodes: [
      { id: `node_${Date.now()}`, content: "Welcome to our service! How can I help you today?", position: { x: 100, y: 100 }, options: [] },
    ],
    edges: [],
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  useEffect(() => {
    setChatMessages([{ role: 'model', content: t('chatbot.greeting') }]);
  }, [t]);


  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleGenerate = async (prompt: string, files: AttachedFile[]) => {
    setIsLoading(true);
    try {
        const content = await generateInitialContent(prompt, files);
        setEditorContent(content);
    } catch (error) {
        setEditorContent(t('gemini.generateError'))
    }
    setShowInitialPrompt(false);
    setIsLoading(false);
  };
  
  const handleSelectionChange = useCallback(() => {
    if (activeView !== 'writer') return;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        const rect = range.getBoundingClientRect();
        const text = selection.toString().trim();
        if (text) {
          setSelectionInfo({ text, rect, range: range.cloneRange() });
        }
      }
    } else {
      setSelectionInfo(null);
    }
  }, [activeView]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  const handleIterate = async (instruction: string) => {
      if (!selectionInfo || !editorRef.current) return;
      
      setIsIterating(true);
      const fullText = editorRef.current.innerText; // Use innerText to avoid HTML tags
      const originalSelection = selectionInfo.text;
      const { range } = selectionInfo;

      try {
        const newText = await iterateOnSelection(fullText, originalSelection, instruction);
        
        range.deleteContents();
        range.insertNode(document.createTextNode(newText));

        // Position cursor at the end of the new text
        const selection = window.getSelection();
        if (selection) {
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        
        // State is now out of sync, but will be synced on next user input.
        // This is a trade-off to preserve cursor position.
        // We can manually trigger the suggestion fetcher.
        debouncedFetchSuggestions();

      } catch (error) {
        console.error("Iteration failed:", error);
      }
      
      setSelectionInfo(null);
      setIsIterating(false);
  };

  const applySuggestions = useCallback((suggestions: Suggestion[]) => {
    if (!editorRef.current) return;
    let newContent = editorRef.current.innerHTML;
    let suggestionsApplied = 0;

    suggestions.forEach(suggestion => {
        const regex = new RegExp(`(?<!>)${suggestion.originalText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}(?!<)`, 'g');
        if (newContent.match(regex)) {
             newContent = newContent.replace(regex, `<span class="suggestion-highlight" title="Suggestion: ${suggestion.suggestedText}">${suggestion.originalText}</span>`);
            suggestionsApplied++;
        }
    });

    if (suggestionsApplied > 0) {
        setEditorContent(newContent);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    if (!editorRef.current || isIterating || isLoading) return;
    const plainText = editorRef.current.innerText;
    if (plainText.length > 50) {
        const suggestions = await getProactiveSuggestions(plainText);
        if (suggestions.length > 0) {
            applySuggestions(suggestions);
        }
    }
  }, [isIterating, isLoading, applySuggestions]);

  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 2000), [fetchSuggestions]);

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    setEditorContent(e.currentTarget.innerHTML);
    debouncedFetchSuggestions();
  };
  
  const handleSendMessage = async (message: string) => {
    const newUserMessage: ChatMessage = { role: 'user', content: message };
    const updatedMessages = [...chatMessages, newUserMessage];
    setChatMessages(updatedMessages);
    setIsChatLoading(true);

    try {
        const historyForApi = chatMessages.slice(1);
        const response = await getChatResponse(historyForApi, message);
        const newModelMessage: ChatMessage = { role: 'model', content: response };
        setChatMessages(prev => [...prev, newModelMessage]);
    } catch (error) {
        const errorMessage: ChatMessage = { role: 'model', content: t('gemini.chatError') };
        setChatMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsChatLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <Header activeView={activeView} setActiveView={setActiveView} flow={flow} />
      <main className="w-full flex-grow flex flex-col items-center p-4 sm:p-8">
        {activeView === 'writer' ? (
          <>
            {showInitialPrompt && <InitialPrompt onGenerate={handleGenerate} isLoading={isLoading} />}
            <div className="w-full max-w-4xl mx-auto flex-grow relative">
              <Toolbar selectionInfo={selectionInfo} onIterate={handleIterate} isLoading={isIterating} />
              <div
                  ref={editorRef}
                  contentEditable={!showInitialPrompt && !isLoading}
                  onInput={handleContentChange}
                  dangerouslySetInnerHTML={{ __html: editorContent }}
                  className="editor-content w-full h-full p-4 sm:p-8 text-lg leading-relaxed text-gray-300 prose prose-invert prose-lg max-w-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md"
                  style={{minHeight: '80vh'}}
              >
              </div>
              <style>{`
                  .suggestion-highlight {
                      border-bottom: 2px dotted #a855f7; /* purple-500 */
                      cursor: help;
                  }
              `}</style>
            </div>
          </>
        ) : (
          <FlowBuilder flow={flow} setFlow={setFlow} />
        )}
      </main>
      <Chatbot 
        messages={chatMessages} 
        onSendMessage={handleSendMessage} 
        isLoading={isChatLoading}
      />
    </div>
  );
};

export default App;