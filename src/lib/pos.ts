const POS_LABEL: Record<string, string> = {
  noun: '名词',
  verb: '动词',
  adjective: '形容词',
  adverb: '副词',
}

export function posLabel(pos: string): string {
  return POS_LABEL[pos] ?? pos
}
