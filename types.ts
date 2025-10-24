
export interface AttachedFile {
  name: string;
  type: string;
  base64: string;
}

export interface SelectionInfo {
  text: string;
  rect: DOMRect;
  range: Range;
}

export interface Suggestion {
  originalText: string;
  suggestedText: string;
}

export interface FlowOption {
  id: string;
  text: string;
}

export interface FlowNode {
  id: string;
  content: string;
  position: { x: number; y: number };
  options: FlowOption[];
}

export interface FlowEdge {
  id: string;
  sourceNodeId: string;
  sourceOptionId: string;
  targetNodeId: string;
}

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}


export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}