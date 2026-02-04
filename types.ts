
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Restaurant {
  name: string;
  description: string;
  atmosphere: string;
  url?: string;
}

export interface SearchResult {
  text: string;
  restaurants: Restaurant[];
  sources: GroundingChunk[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export enum AppState {
  PROPOSAL = 'PROPOSAL',
  CELEBRATION = 'CELEBRATION',
  EXPLORE = 'EXPLORE'
}
