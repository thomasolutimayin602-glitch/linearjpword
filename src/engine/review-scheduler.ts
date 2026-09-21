import type { StudyRecord } from '../types'

/**
 * 复习调度算法 — 基于艾宾浩斯遗忘曲线的间隔重复
 * 
 * 短期复习: 当前session答错 -> 在当前轮次重复，直到连续答对3次
 * 长期复习: 7天 / 15天 / 30天遗忘点
 */

// 长期复习间隔（天）
export const REVIEW_INTERVALS = [7, 15, 30]

/**
 * 判断一个词今天是否需要复习
 */
export function isWordDueForReview(record: StudyRecord, _today: string): boolean {
  // 短期复习：当前session中有错
  if (record.isInCurrentSession && record.sessionWrong > 0) return true
  // 长期复习：到达遗忘点
  if (record.nextReviewAt && record.nextReviewAt <= Date.now()) return true
  return false
}

/**
 * 答对后更新复习计划
 */
export function updateOnCorrect(
  record: StudyRecord,
  _allRecords: Map<number, StudyRecord>
): StudyRecord {
  const now = Date.now()
  return {
    ...record,
    masteryLevel: Math.min(100, record.masteryLevel + 5),
    consecutiveCorrect: record.consecutiveCorrect + 1,
    consecutiveWrong: 0,
    totalCorrect: record.totalCorrect + 1,
    sessionCorrect: record.sessionCorrect + 1,
    lastCorrectAt: now,
    status: record.masteryLevel + 5 >= 80 ? 'mastered' : 'learning',
    // 答对后更新下一复习时间
    nextReviewAt: getNextReviewDate(record.consecutiveCorrect + 1, now),
  }
}

/**
 * 答错后更新复习计划
 */
export function updateOnWrong(
  record: StudyRecord,
  _allRecords: Map<number, StudyRecord>
): StudyRecord {
  const now = Date.now()
  return {
    ...record,
    masteryLevel: Math.max(0, record.masteryLevel - 10),
    consecutiveCorrect: 0,
    consecutiveWrong: record.consecutiveWrong + 1,
    totalWrong: record.totalWrong + 1,
    sessionWrong: record.sessionWrong + 1,
    lastWrongAt: now,
    status: 'learning',
    // 答错后重置短期复习：立即在当前session中重复
    isInCurrentSession: true,
    // 短期复习：下次立刻出现
    nextReviewAt: null,
  }
}

/**
 * 猜对/不确定 —— 等同于答错
 */
export const updateOnUnsure = updateOnWrong

/**
 * 获取下一个复习日期（基于连续答对次数）
 * 连续答对次数越高，间隔越长
 */
function getNextReviewDate(consecutiveCorrect: number, now: number): number {
  const dayMs = 24 * 60 * 60 * 1000
  if (consecutiveCorrect < 3) return now + dayMs           // 1天后
  if (consecutiveCorrect < 5) return now + 7 * dayMs       // 7天
  if (consecutiveCorrect < 8) return now + 15 * dayMs      // 15天
  return now + 30 * dayMs                                   // 30天
}

/**
 * session结束后: 重置session状态
 */
export function endSession(record: StudyRecord): StudyRecord {
  return {
    ...record,
    isInCurrentSession: false,
    sessionWrong: 0,
    sessionCorrect: 0,
  }
}

/**
 * 生成今日的复习队列
 */
export function buildTodayReviewQueue(
  records: StudyRecord[],
  _today: string,
  dailyNewWords: number
): { newWords: StudyRecord[]; reviewWords: StudyRecord[]; overdueWords: StudyRecord[] } {
  const newWords: StudyRecord[] = []
  const reviewWords: StudyRecord[] = []
  const overdueWords: StudyRecord[] = []
  const now = Date.now()

  for (const r of records) {
    if (r.status === 'filtered') continue
    if (r.status === 'new') {
      if (newWords.length < dailyNewWords) newWords.push(r)
    } else if (r.nextReviewAt && r.nextReviewAt <= now) {
      if (r.nextReviewAt < now - 2 * 24 * 60 * 60 * 1000) {
        overdueWords.push(r)
      } else {
        reviewWords.push(r)
      }
    }
  }

  return { newWords, reviewWords, overdueWords }
}
