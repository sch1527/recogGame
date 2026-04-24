export interface CharacterTheme {
  id: string;
  name: string;
  title: string;
  description: string;
  stats: { label: string; value: number }[];
  headColor: string;
  bodyColor: string;
  accent: string;
  borderColor: string;
}

export const CHARACTERS: CharacterTheme[] = [
  {
    id: 'bolt',
    name: 'BOLT',
    title: '전기 로봇',
    description: '전기 에너지를 무기로 사용하는 표준형 전투 로봇.\n안정적인 출력과 뛰어난 범용성으로\n입문자에게 적합하다.',
    stats: [
      { label: '공격', value: 3 },
      { label: '속도', value: 3 },
      { label: '방어', value: 3 },
    ],
    headColor: '#3399ff',
    bodyColor: '#1155cc',
    accent: '#00eeff',
    borderColor: '#3366cc',
  },
  {
    id: 'ember',
    name: 'EMBER',
    title: '화염 전사',
    description: '고온 플라즈마 포를 탑재한 공격형 로봇.\n압도적인 화력으로 적을 섬멸하지만\n방어력은 다소 낮은 편이다.',
    stats: [
      { label: '공격', value: 5 },
      { label: '속도', value: 2 },
      { label: '방어', value: 1 },
    ],
    headColor: '#ff4444',
    bodyColor: '#aa1111',
    accent: '#ffaa00',
    borderColor: '#cc3300',
  },
  {
    id: 'venom',
    name: 'VENOM',
    title: '독소 외계인',
    description: '미지의 행성에서 온 생체 병기.\n독성 광선으로 목표를 잠식하며\n뛰어난 기동력을 자랑한다.',
    stats: [
      { label: '공격', value: 2 },
      { label: '속도', value: 5 },
      { label: '방어', value: 2 },
    ],
    headColor: '#33cc66',
    bodyColor: '#116633',
    accent: '#00ff99',
    borderColor: '#117744',
  },
];

export const DEFAULT_CHARACTER_ID = 'bolt';
