export interface CharacterTheme {
  id: string;
  name: string;
  title: string;
  description: string;
  stats: { label: string; value: number }[];
  headColor: string;
  accent: string;
  bodyColor: string;
  borderColor: string;
}

export const CHARACTERS: CharacterTheme[] = [
  {
    id: 'singsing',
    name: '싱싱',
    title: 'SingSing',
    description: '강력한 목소리 에너지를 발사하여 멀리 있는 블록을 진동시켜 파괴합니다.',
    stats: [
      { label: '파워', value: 5 },
      { label: '속도', value: 3 },
      { label: '콤보', value: 8 },
    ],
    headColor: '#FF85C1',
    accent: '#ff44aa',
    bodyColor: '#cc3388',
    borderColor: '#ff88cc',
  },
  {
    id: 'ember',
    name: 'EMBER',
    title: '화염 전사',
    description: '고온 플라즈마 포를 탑재한 공격형 로봇. 압도적인 화력으로 적을 섬멸하지만 방어력은 다소 낮은 편이다.',
    stats: [
      { label: '파워', value: 5 },
      { label: '속도', value: 2 },
      { label: '콤보', value: 1 },
    ],
    headColor: '#ff4444',
    accent: '#ff6600',
    bodyColor: '#cc2200',
    borderColor: '#ff8844',
  },
  {
    id: 'venom',
    name: 'VENOM',
    title: '독소 외계인',
    description: '미지의 행성에서 온 생체 병기. 독성 광선으로 목표를 잠식하며 뛰어난 기동력을 자랑한다.',
    stats: [
      { label: '파워', value: 2 },
      { label: '속도', value: 5 },
      { label: '콤보', value: 2 },
    ],
    headColor: '#33cc66',
    accent: '#00ff88',
    bodyColor: '#116633',
    borderColor: '#44ee88',
  },
];

export const DEFAULT_CHARACTER_ID = 'singsing';
