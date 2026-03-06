
export enum Status {
  GOOD = 'good',
  WARN = 'warn',
  BAD = 'bad',
  INFO = 'info'
}

export interface ScoreComponent {
  type: 'attribute' | 'multiplier' | 'bonus' | 'penalty';
  name: string;
  value: number;
  weight?: number;
  effect: number;
  evidenceRefs: string[];
}

export interface EvidenceItem {
  id: string;
  type: string;
  name: string;
  coverage: string;
  match: number;
  value?: string;
  isMasked?: boolean;
}

export interface Incident {
  id: string;
  start: string;
  end: string;
  phase: string;
}

export interface CELData {
  generatedAt: string;
  incidentCount: number;
  scoringModel: string;
  confidenceScore: number;
  confidenceBand: string;
  timeSpan: {
    start: string;
    end: string;
    duration: string;
    multiplier: number;
  };
  drivers: string[];
  components: ScoreComponent[];
  evidence: {
    ttps: EvidenceItem[];
    infrastructure: EvidenceItem[];
    credentials: EvidenceItem[];
  };
  killChain: {
    phases: Record<string, string[]>;
    continuity: Array<{
      transition: string;
      confidence: number;
      reasons: string[];
    }>;
  };
  incidents: Incident[];
}
