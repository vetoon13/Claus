
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import ChatIcon from './icons/ChatIcon';
import CloseIcon from './icons/CloseIcon';
import PaperPlaneIcon from './icons/PaperPlaneIcon';
import LoaderIcon from './icons/LoaderIcon';
import SparkleIcon from './icons/SparkleIcon';
import { useTranslations } from '../contexts/LanguageContext';

interface ChatbotProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({ messages, onSendMessage, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-transform transform hover:scale-110 z-40"
        aria-label={t('chatbot.openChat')}
      >
        <ChatIcon className="w-8 h-8" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[calc(100%-3rem)] sm:w-96 h-[70vh] sm:h-[60vh] flex flex-col bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center">
            <SparkleIcon className="w-6 h-6 text-purple-400" />
            <h3 className="font-bold text-lg ml-2 text-white">{t('chatbot.title')}</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
          aria-label={t('chatbot.closeChat')}
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <SparkleIcon className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-lg'
                    : 'bg-gray-700 text-gray-200 rounded-bl-lg'
                }`}
              >
                <p className="text-sm break-words">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <SparkleIcon className="w-5 h-5 text-white" />
                </div>
                 <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-2xl bg-gray-700 text-gray-200 rounded-bl-lg">
                    <LoaderIcon className="w-5 h-5 text-gray-400" />
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chatbot.placeholder')}
            className="w-full bg-gray-700 text-gray-200 placeholder-gray-400 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-purple-600 text-white rounded-full disabled:bg-purple-800 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
             aria-label={t('chatbot.sendMessage')}
          >
            <PaperPlaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
