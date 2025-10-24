
import React, { useState, useEffect, useRef } from 'react';
import { SelectionInfo } from '../types';
import SparkleIcon from './icons/SparkleIcon';
import PaperPlaneIcon from './icons/PaperPlaneIcon';
import LoaderIcon from './icons/LoaderIcon';
import { useTranslations } from '../contexts/LanguageContext';

interface ToolbarProps {
  selectionInfo: SelectionInfo | null;
  onIterate: (instruction: string) => void;
  isLoading: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ selectionInfo, onIterate, isLoading }) => {
  const [instruction, setInstruction] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  useEffect(() => {
    if (selectionInfo) {
      inputRef.current?.focus();
    } else {
      setInstruction('');
    }
  }, [selectionInfo]);
  
  if (!selectionInfo) {
    return null;
  }

  const { rect } = selectionInfo;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim() && !isLoading) {
      onIterate(instruction);
    }
  };

  const top = window.scrollY + rect.top - 56;
  
  return (
    <div
      className="absolute z-10 p-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl flex items-center transition-all duration-150 ease-out"
      style={{
        top: `${top}px`,
        left: `${window.scrollX + rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
        width: 'clamp(300px, 50vw, 500px)',
      }}
    >
      <SparkleIcon className="w-5 h-5 text-purple-400 mr-3 flex-shrink-0" />
      <form onSubmit={handleSubmit} className="w-full">
        <input
          ref={inputRef}
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={t('toolbar.placeholder')}
          className="w-full bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none"
          disabled={isLoading}
        />
      </form>
      <button
        type="submit"
        onClick={handleSubmit}
        className="ml-3 p-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading || !instruction.trim()}
      >
        {isLoading ? <LoaderIcon className="w-5 h-5"/> : <PaperPlaneIcon className="w-5 h-5 text-gray-400" />}
      </button>
    </div>
  );
};

export default Toolbar;
