
import React from 'react';
import { FlowData } from '../types';
import { useTranslations } from '../contexts/LanguageContext';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  flow: FlowData;
}

const findRootNodeContent = (flow: FlowData): string => {
    if (!flow || !flow.nodes || flow.nodes.length === 0) {
        return "Hello! I'd like to chat.";
    }

    const targetNodeIds = new Set(flow.edges.map(edge => edge.targetNodeId));
    const rootNode = flow.nodes.find(node => !targetNodeIds.has(node.id));

    return rootNode ? rootNode.content : flow.nodes[0].content;
};

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose, flow }) => {
    const t = useTranslations();
    if (!isOpen) return null;

    const firstMessage = findRootNodeContent(flow);
    const waUrl = `https://wa.me/?text=${encodeURIComponent(firstMessage)}`;
    const qrUrl = `https://chart.googleapis.com/chart?chs=256x256&cht=qr&chl=${encodeURIComponent(waUrl)}&choe=UTF-8`;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-sm w-full text-center relative border border-gray-700"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 text-gray-500 hover:text-white text-2xl"
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold text-white mb-4">{t('whatsAppModal.title')}</h2>
                <p className="text-gray-400 mb-6">{t('whatsAppModal.subtitle')}</p>
                <div className="flex justify-center mb-6">
                    <img
                        src={qrUrl}
                        alt="WhatsApp QR Code"
                        width="256"
                        height="256"
                        className="bg-white p-2 rounded-lg shadow-md"
                    />
                </div>
                <div className="text-left text-gray-400 text-sm space-y-2">
                    <p>{t('whatsAppModal.step1')}</p>
                    <p>{t('whatsAppModal.step2')}</p>
                    <p>{t('whatsAppModal.step3')}</p>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppModal;