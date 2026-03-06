
import { CELData } from './types';

export const MOCK_CEL_DATA: CELData = {
  generatedAt: "2026-01-07T15:22:10Z",
  incidentCount: 7,
  scoringModel: "v3.4.0",
  confidenceScore: 0.82,
  confidenceBand: "HIGH",
  timeSpan: {
    start: "Jan 01, 2026",
    end: "Jan 04, 2026",
    duration: "3 days",
    multiplier: 1.15
  },
  drivers: ["TTP similarity (+0.27)", "Infrastructure reuse (+0.16)", "Kill chain bonus (+0.05)"],
  components: [
    { type: 'attribute', name: 'TTP_similarity', value: 0.78, weight: 0.35, effect: 0.27, evidenceRefs: ['EV-001', 'EV-002'] },
    { type: 'attribute', name: 'Infrastructure_reuse', value: 0.65, weight: 0.25, effect: 0.16, evidenceRefs: ['EV-010'] },
    { type: 'multiplier', name: 'Timeline_multiplier', value: 1.15, effect: 0.07, evidenceRefs: ['EV-070'] },
    { type: 'bonus', name: 'Kill_chain_bonus', value: 1, effect: 0.05, evidenceRefs: ['EV-050'] },
    { type: 'penalty', name: 'Weak_link_penalty', value: 1, effect: -0.03, evidenceRefs: [] }
  ],
  evidence: {
    ttps: [
      { id: 'T1059', type: 'technique', name: 'Command and Scripting', coverage: 'INC-SIR01, INC-SIR02, INC-SIR03', match: 0.78 },
      { id: 'T1071', type: 'technique', name: 'Application Layer Protocol', coverage: 'INC-SIR01, INC-SIR02, INC-SIR05', match: 0.63 }
    ],
    infrastructure: [
      { id: 'EV-010', type: 'domain', name: 'login-example.com', coverage: 'INC-SIR01, INC-SIR02, INC-SIR04', match: 0.85 },
      { id: 'EV-011', type: 'ip', name: '203.0.113.10', coverage: 'INC-SIR02, INC-SIR03', match: 0.90 },
      { id: 'EV-012', type: 'url', name: 'https://example.com/update', coverage: 'INC-SIR01, INC-SIR05', match: 0.75 }
    ],
    credentials: [
      { id: 'EV-090', type: 'username', name: 'user_admin', coverage: 'INC-SIR01, INC-SIR04', match: 1.0, isMasked: false }
    ],
    malware: [
      { id: 'M-01', type: 'tool', name: 'Cobalt Strike', coverage: 'INC-SIR01, INC-SIR02, INC-SIR03, INC-SIR05', match: 0.95 },
      { id: 'M-02', type: 'malware', name: 'Mimikatz', coverage: 'INC-SIR02, INC-SIR04', match: 0.88 }
    ],
    hashes: [
      { id: 'H-01', type: 'sha256', name: '9f3a5b2c7d8e9f0a1b2c3d4e5f6a7b8c', coverage: 'INC-SIR01, INC-SIR02, INC-SIR06', match: 1.0 },
      { id: 'H-02', type: 'sha256', name: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', coverage: 'INC-SIR04, INC-SIR05', match: 1.0 }
    ],
    hostArtifacts: [
      { id: 'HA-01', type: 'registry', name: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', coverage: 'INC-SIR03, INC-SIR06', match: 0.82 }
    ]
  } as any,
  killChain: {
    phases: {
      'Reconnaissance': [],
      'Weaponization': [],
      'Delivery': ['INC-SIR01', 'INC-SIR04'],
      'Execution': ['INC-SIR01', 'INC-SIR06'],
      'Installation': ['INC-SIR03', 'INC-SIR06'],
      'Command & Control': ['INC-SIR02', 'INC-SIR05'],
      'Actions on Objectives': ['INC-SIR07']
    },
    continuity: [
      { transition: 'Delivery → Execution', confidence: 0.72, reasons: ['EV-001', 'EV-010'] },
      { transition: 'Execution → Installation', confidence: 0.60, reasons: ['EV-002'] },
      { transition: 'Installation → C2', confidence: 0.80, reasons: ['EV-050'] }
    ]
  },
  incidents: [
    { id: 'INC-SIR01', start: 'Jan 01, 2026 at 09:00 AM', end: 'Jan 01, 2026 at 11:30 AM', phase: 'Delivery' },
    { id: 'INC-SIR02', start: 'Jan 01, 2026 at 02:15 PM', end: 'Jan 02, 2026 at 08:00 AM', phase: 'C2' },
    { id: 'INC-SIR03', start: 'Jan 02, 2026 at 10:00 AM', end: 'Jan 02, 2026 at 04:00 PM', phase: 'Installation' },
    { id: 'INC-SIR04', start: 'Jan 02, 2026 at 05:00 PM', end: 'Jan 03, 2026 at 09:00 AM', phase: 'Delivery' },
    { id: 'INC-SIR05', start: 'Jan 03, 2026 at 11:30 AM', end: 'Jan 03, 2026 at 11:45 PM', phase: 'C2' },
    { id: 'INC-SIR06', start: 'Jan 04, 2026 at 01:00 AM', end: 'Jan 04, 2026 at 06:00 AM', phase: 'Execution' },
    { id: 'INC-SIR07', start: 'Jan 04, 2026 at 09:00 AM', end: 'Jan 04, 2026 at 08:00 PM', phase: 'Objectives' }
  ]
};
