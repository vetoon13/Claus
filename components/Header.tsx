
import React, { useState } from 'react';
import { View } from '../App';
import { FlowData } from '../types';
import SparkleIcon from './icons/SparkleIcon';
import FlowIcon from './icons/FlowIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import WhatsAppModal from './WhatsAppModal';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslations } from '../contexts/LanguageContext';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
  flow: FlowData;
}

const NavButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ isActive, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gray-700 text-white'
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-2">{label}</span>
  </button>
);

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView, flow }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations();

  return (
    <>
      <header className="w-full bg-gray-900 border-b border-gray-800 shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
                <SparkleIcon className="h-8 w-8 text-purple-400" />
                <h1 className="text-xl font-bold ml-2 text-gray-100">{t('header.title')}</h1>
            </div>
            <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded-lg border border-gray-700">
                <NavButton
                    isActive={activeView === 'writer'}
                    onClick={() => setActiveView('writer')}
                    icon={<SparkleIcon className="w-5 h-5" />}
                    label={t('header.writer')}
                />
                <NavButton
                    isActive={activeView === 'flow'}
                    onClick={() => setActiveView('flow')}
                    icon={<FlowIcon className="w-5 h-5" />}
                    label={t('header.flowBuilder')}
                />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span className="ml-2">{t('header.whatsAppButton')}</span>
              </button>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>
      <WhatsAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} flow={flow} />
    </>
  );
};

export default Header;