
import React, { useState, useRef, useCallback, MouseEvent } from 'react';
import { FlowData, FlowNode, FlowEdge, FlowOption } from '../types';
import TrashIcon from './icons/TrashIcon';
import SaveIcon from './icons/SaveIcon';
import LoadIcon from './icons/LoadIcon';
import PlusIcon from './icons/PlusIcon';
import { useTranslations } from '../contexts/LanguageContext';

interface FlowBuilderProps {
  flow: FlowData;
  setFlow: React.Dispatch<React.SetStateAction<FlowData>>;
}

const getEdgePath = (sourcePos: { x: number; y: number }, targetPos: { x: number; y: number }): string => {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  return `M${sourcePos.x},${sourcePos.y} C${sourcePos.x + dx / 2},${sourcePos.y} ${targetPos.x - dx / 2},${targetPos.y} ${targetPos.x},${targetPos.y}`;
};

const FlowBuilder: React.FC<FlowBuilderProps> = ({ flow, setFlow }) => {
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [draggingNode, setDraggingNode] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [linking, setLinking] = useState<{ sourceNodeId: string; sourceOptionId: string; startPos: { x: number, y: number } } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  const showFeedback = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(''), 2500);
  };

  const addNode = () => {
    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      content: "",
      position: { x: 50, y: 50 },
      options: [],
    };
    setFlow(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
  };

  const updateNode = (id: string, updates: Partial<FlowNode>) => {
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => node.id === id ? { ...node, ...updates } : node),
    }));
  };

  const removeNode = (id: string) => {
    setFlow(prev => ({
      nodes: prev.nodes.filter(node => node.id !== id),
      edges: prev.edges.filter(edge => edge.sourceNodeId !== id && edge.targetNodeId !== id),
    }));
  };

  const addOption = (nodeId: string) => {
    const newOption: FlowOption = { id: `option_${Date.now()}`, text: "" };
    const nodes = flow.nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, options: [...node.options, newOption] };
      }
      return node;
    });
    setFlow(prev => ({ ...prev, nodes }));
  };

  const updateOption = (nodeId: string, optionId: string, text: string) => {
    const nodes = flow.nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          options: node.options.map(opt => opt.id === optionId ? { ...opt, text } : opt),
        };
      }
      return node;
    });
    setFlow(prev => ({ ...prev, nodes }));
  };

  const removeOption = (nodeId: string, optionId: string) => {
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId 
          ? { ...node, options: node.options.filter(opt => opt.id !== optionId) } 
          : node
      ),
      edges: prev.edges.filter(edge => edge.sourceOptionId !== optionId),
    }));
  };

  const handleMouseDownNode = (e: MouseEvent<HTMLDivElement>, nodeId: string) => {
    if (e.target !== e.currentTarget) return; // Prevent drag on inputs
    const node = flow.nodes.find(n => n.id === nodeId);
    if (node && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      setDraggingNode({
        id: nodeId,
        offsetX: e.clientX - canvasRect.left - node.position.x,
        offsetY: e.clientY - canvasRect.top - node.position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const currentMousePos = {
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top,
    };
    setMousePos(currentMousePos);

    if (draggingNode) {
      const newX = currentMousePos.x - draggingNode.offsetX;
      const newY = currentMousePos.y - draggingNode.offsetY;
      updateNode(draggingNode.id, { position: { x: newX, y: newY } });
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
    setLinking(null);
  };
  
  const handleMouseUpNode = (nodeId: string) => {
      if (linking) {
        const newEdge: FlowEdge = {
            id: `edge_${Date.now()}`,
            sourceNodeId: linking.sourceNodeId,
            sourceOptionId: linking.sourceOptionId,
            targetNodeId: nodeId
        };
        setFlow(prev => ({...prev, edges: [...prev.edges, newEdge]}));
      }
      setLinking(null);
  };

  const startLinking = (e: MouseEvent, nodeId: string, optionId: string) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const optionEl = e.currentTarget as HTMLDivElement;
    const optionRect = optionEl.getBoundingClientRect();

    setLinking({
        sourceNodeId: nodeId,
        sourceOptionId: optionId,
        startPos: {
            x: optionRect.right - canvasRect.left + 4,
            y: optionRect.top - canvasRect.top + optionRect.height / 2,
        }
    });
  };

  const handleSaveFlow = () => {
    try {
      localStorage.setItem('magic-writer-flow', JSON.stringify(flow));
      showFeedback(t('flowBuilder.feedback.saveSuccess'));
    } catch (error) {
      showFeedback(t('flowBuilder.feedback.saveError'));
    }
  };

  const handleLoadFlow = () => {
    try {
      const savedFlowJSON = localStorage.getItem('magic-writer-flow');
      if (savedFlowJSON) {
        const savedFlow: FlowData = JSON.parse(savedFlowJSON);
        if (savedFlow && Array.isArray(savedFlow.nodes) && Array.isArray(savedFlow.edges)) {
          setFlow(savedFlow);
          showFeedback(t('flowBuilder.feedback.loadSuccess'));
        } else {
          showFeedback(t('flowBuilder.feedback.loadInvalid'));
        }
      } else {
        showFeedback(t('flowBuilder.feedback.loadNotFound'));
      }
    } catch (error) {
      showFeedback(t('flowBuilder.feedback.loadError'));
    }
  };

  return (
    <div className="w-full flex-grow flex flex-col">
      <div className="text-center my-8">
        <h1 className="text-4xl font-bold text-gray-100">{t('flowBuilder.title')}</h1>
        <p className="text-gray-400 mt-2">{t('flowBuilder.subtitle')}</p>
      </div>

      <div className="flex justify-center items-center space-x-4 mb-4">
        <button onClick={handleSaveFlow} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-700 flex items-center"><SaveIcon className="w-5 h-5 mr-2"/>{t('flowBuilder.saveFlow')}</button>
        <button onClick={handleLoadFlow} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-700 flex items-center"><LoadIcon className="w-5 h-5 mr-2"/>{t('flowBuilder.loadFlow')}</button>
        <button onClick={addNode} className="px-4 py-2 bg-purple-600 rounded-md hover:bg-purple-700 flex items-center"><PlusIcon className="w-5 h-5 mr-2"/>{t('flowBuilder.addNode')}</button>
        {feedbackMessage && <p className="text-sm text-gray-400 h-5">{feedbackMessage}</p>}
      </div>
      
      <div
        ref={canvasRef}
        className="w-full flex-grow bg-gray-800 border border-gray-700 rounded-lg relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            {flow.edges.map(edge => {
                const sourceNode = flow.nodes.find(n => n.id === edge.sourceNodeId);
                const targetNode = flow.nodes.find(n => n.id === edge.targetNodeId);
                const sourceOption = sourceNode?.options.find(o => o.id === edge.sourceOptionId);
                
                if (!sourceNode || !targetNode || !sourceOption) return null;

                const sourceOptionIndex = sourceNode.options.findIndex(o => o.id === edge.sourceOptionId);
                const optionYOffset = 118 + sourceOptionIndex * 44 + 22;

                const sourcePos = { x: sourceNode.position.x + 290, y: sourceNode.position.y + optionYOffset };
                const targetPos = { x: targetNode.position.x, y: targetNode.position.y + 40 };

                return <path key={edge.id} d={getEdgePath(sourcePos, targetPos)} stroke="#4a5568" strokeWidth="2" fill="none" />;
            })}
             {linking && <path d={getEdgePath(linking.startPos, mousePos)} stroke="#a855f7" strokeWidth="2" fill="none" />}
        </svg>

        {flow.nodes.map(node => (
          <div
            key={node.id}
            className="absolute bg-gray-900 border border-gray-600 rounded-lg shadow-xl cursor-grab active:cursor-grabbing p-4 w-72"
            style={{ top: node.position.y, left: node.position.x, zIndex: 1 }}
            onMouseDown={(e) => handleMouseDownNode(e, node.id)}
            onMouseUp={() => handleMouseUpNode(node.id)}
          >
             <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center pointer-events-none border-2 border-gray-900"></div>
            <textarea
              value={node.content}
              onChange={(e) => updateNode(node.id, { content: e.target.value })}
              placeholder={t('flowBuilder.nodePlaceholder')}
              className="w-full h-20 bg-gray-800 text-gray-200 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none cursor-text"
            />
            <div className="mt-2 space-y-1">
                {node.options.map(option => (
                    <div key={option.id} className="flex items-center group">
                        <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(node.id, option.id, e.target.value)}
                            placeholder={t('flowBuilder.optionPlaceholder')}
                            className="flex-grow bg-gray-700 text-sm p-1 rounded-l-md focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-text"
                        />
                         <button onClick={() => removeOption(node.id, option.id)} className="px-1 bg-gray-700 text-gray-500 hover:text-red-400 hidden group-hover:block">&times;</button>
                        <div
                            onMouseDown={(e) => startLinking(e, node.id, option.id)}
                            className="absolute -right-3 w-6 h-6 bg-gray-600 rounded-full cursor-pointer hover:bg-purple-500 border-2 border-gray-900"
                         />
                    </div>
                ))}
            </div>
             <div className="mt-2 flex justify-between">
                <button onClick={() => addOption(node.id)} className="text-xs text-purple-400 hover:text-purple-300 flex items-center"><PlusIcon className="w-4 h-4 mr-1"/>{t('flowBuilder.addOption')}</button>
                <button onClick={() => removeNode(node.id)} className="text-xs text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlowBuilder;
