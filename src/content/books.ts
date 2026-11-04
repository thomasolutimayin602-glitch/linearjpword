import { WORDS } from '../data/words'
import type { WordBook } from '../types'

const SEED_VERSION = '2026.11-seed.1'

function idsForTags(requiredTags: string[]): number[] {
  const tags = new Set(requiredTags)
  return WORDS.filter(word => word.tags.some(tag => tags.has(tag))).map(word => word.id)
}

export const DEFAULT_BOOK_ID = 'n5-core'

export const BOOKS: WordBook[] = [
  {
    id: DEFAULT_BOOK_ID,
    title: 'N5 入门核心词',
    subtitle: '完整种子词表',
    description: '按五十音顺序整理的 N5 入门种子词汇，覆盖日常、时间、人物、动作、自然与状态等基础主题。',
    level: 'N5',
    wordIds: WORDS.map(word => word.id),
    version: SEED_VERSION,
    source: 'bundled',
    availability: 'offline',
    isDevelopmentContent: true,
    accent: '#FF6A5F',
    icon: 'あ',
  },
  {
    id: 'n5-daily',
    title: 'N5 日常生活',
    subtitle: '起居、动作与常见物品',
    description: '从起床、出门到日常交流最常用的入门词，适合想先应对生活场景的学习者。',
    level: 'N5',
    wordIds: idsForTags(['daily', 'action', 'place', 'object', 'speech']),
    version: SEED_VERSION,
    source: 'bundled',
    availability: 'offline',
    isDevelopmentContent: true,
    accent: '#4E8FDB',
    icon: '日',
  },
  {
    id: 'n5-nature',
    title: 'N5 自然与天气',
    subtitle: '季节、天气、颜色与动物',
    description: '围绕天气、季节、自然景物、颜色和动物组织的一组入门词，适合主题串联记忆。',
    level: 'N5',
    wordIds: idsForTags(['nature', 'weather', 'season', 'colour', 'animal']),
    version: SEED_VERSION,
    source: 'bundled',
    availability: 'offline',
    isDevelopmentContent: true,
    accent: '#3EA878',
    icon: '空',
  },
  {
    id: 'n5-people',
    title: 'N5 人物与时间',
    subtitle: '称呼、工作与时间表达',
    description: '人物、家庭、工作和时间相关高频词，帮助搭起日常陈述与约定的基础表达。',
    level: 'N5',
    wordIds: idsForTags(['person', 'family', 'work', 'time', 'thought']),
    version: SEED_VERSION,
    source: 'bundled',
    availability: 'offline',
    isDevelopmentContent: true,
    accent: '#9A72D8',
    icon: '人',
  },
  {
    id: 'n5-travel',
    title: 'N5 出行与饮食',
    subtitle: '交通、地点与食物',
    description: '旅行、出门、交通、地点和饮食场景词，适合准备日本短期旅行或会话练习。',
    level: 'N5',
    wordIds: idsForTags(['place', 'motion', 'transport', 'food', 'daily']),
    version: SEED_VERSION,
    source: 'bundled',
    availability: 'offline',
    isDevelopmentContent: true,
    accent: '#E39A32',
    icon: '旅',
  },
]
