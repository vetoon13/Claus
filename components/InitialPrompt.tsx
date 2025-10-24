
import React, { useState } from 'react';
import { AttachedFile } from '../types';
import SparkleIcon from './icons/SparkleIcon';
import UploadIcon from './icons/UploadIcon';
import LoaderIcon from './icons/LoaderIcon';
import PaperPlaneIcon from './icons/PaperPlaneIcon';
import { useTranslations } from '../contexts/LanguageContext';

interface InitialPromptProps {
  onGenerate: (prompt: string, files: AttachedFile[]) => void;
  isLoading: boolean;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // remove the "data:mime/type;base64," part
    };
    reader.onerror = (error) => reject(error);
  });
};

const InitialPrompt: React.FC<InitialPromptProps> = ({ onGenerate, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const t = useTranslations();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: AttachedFile[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        try {
          const base64 = await fileToBase64(file);
          newFiles.push({ name: file.name, type: file.type, base64 });
        } catch (error) {
          console.error("Error converting file to base64:", error);
        }
      }
      setFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  }

  const handleSubmit = () => {
    if (prompt.trim() || files.length > 0) {
      onGenerate(prompt, files);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-20">
      <div className="w-full max-w-2xl p-8 rounded-lg">
        <div className="text-center mb-8">
          <SparkleIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-100">{t('initialPrompt.title')}</h1>
          <p className="text-gray-400 mt-2">{t('initialPrompt.subtitle')}</p>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('initialPrompt.placeholder')}
            className="w-full h-28 bg-transparent text-lg text-gray-200 placeholder-gray-500 focus:outline-none resize-none"
            disabled={isLoading}
          />
          
          <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
            <div>
              <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 transition-colors">
                <UploadIcon className="w-5 h-5 mr-2" />
                {t('initialPrompt.attachFiles')}
              </label>
              <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} disabled={isLoading} />
            </div>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed flex items-center"
              disabled={isLoading || (!prompt.trim() && files.length === 0)}
            >
              {isLoading ? <LoaderIcon className="w-5 h-5 mr-2"/> : <PaperPlaneIcon className="w-5 h-5 mr-2"/>}
              {t('initialPrompt.generate')}
            </button>
          </div>
        </div>
        
        {files.length > 0 && (
          <div className="mt-4 max-w-2xl mx-auto">
            <p className="text-sm text-gray-500 mb-2">{t('initialPrompt.attachments')}</p>
            <div className="flex flex-wrap gap-2">
              {files.map(file => (
                <div key={file.name} className="bg-gray-700 text-xs text-gray-300 px-2 py-1 rounded-full flex items-center">
                  <span>{file.name}</span>
                  <button onClick={() => removeFile(file.name)} className="ml-2 text-gray-500 hover:text-white">&times;</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitialPrompt;
