/**
 * Rōmaji → kana conversion, modelled on a Japanese IME.
 *
 * The spelling drill accepts rōmaji typed on a QWERTY keyboard and compares the
 * *kana* it resolves to against the target reading. That way every legitimate
 * romanisation is accepted: `shi` / `si`, `tsu` / `tu`, `fu` / `hu`, `sha` / `sya`
 * and so on — exactly how a native IME behaves.
 */

// Longest-match-first table. Values may be multi-kana.
const TABLE: Record<string, string> = {
  // vowels
  a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',
  // k
  ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ',
  kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ',
  // g
  ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
  gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',
  // s
  sa: 'さ', si: 'し', shi: 'し', su: 'す', se: 'せ', so: 'そ',
  sya: 'しゃ', sha: 'しゃ', syu: 'しゅ', shu: 'しゅ', syo: 'しょ', sho: 'しょ',
  // z
  za: 'ざ', zi: 'じ', ji: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
  zya: 'じゃ', ja: 'じゃ', zyu: 'じゅ', ju: 'じゅ', zyo: 'じょ', jo: 'じょ',
  // t
  ta: 'た', ti: 'ち', chi: 'ち', tu: 'つ', tsu: 'つ', te: 'て', to: 'と',
  tya: 'ちゃ', cha: 'ちゃ', tyu: 'ちゅ', chu: 'ちゅ', tyo: 'ちょ', cho: 'ちょ',
  // d
  da: 'だ', di: 'ぢ', du: 'づ', de: 'で', do: 'ど',
  // n
  na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の',
  nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ',
  // h
  ha: 'は', hi: 'ひ', hu: 'ふ', fu: 'ふ', he: 'へ', ho: 'ほ',
  hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ',
  // b
  ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ',
  bya: 'びゃ', byu: 'びゅ', byo: 'びょ',
  // p
  pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
  pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ',
  // m
  ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も',
  mya: 'みゃ', myu: 'みゅ', myo: 'みょ',
  // y
  ya: 'や', yu: 'ゆ', yo: 'よ',
  // r
  ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ',
  rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',
  // w
  wa: 'わ', wi: 'うぃ', we: 'うぇ', wo: 'を',
  // v (loanwords)
  va: 'ゔぁ', vi: 'ゔぃ', vu: 'ゔ', ve: 'ゔぇ', vo: 'ゔぉ',
  // small kana typed directly
  la: 'ぁ', li: 'ぃ', lu: 'ぅ', le: 'ぇ', lo: 'ぉ',
  lya: 'ゃ', lyu: 'ゅ', lyo: 'ょ', ltu: 'っ', ltsu: 'っ',
  xa: 'ぁ', xi: 'ぃ', xu: 'ぅ', xe: 'ぇ', xo: 'ぉ',
  xya: 'ゃ', xyu: 'ゅ', xyo: 'ょ', xtu: 'っ', xtsu: 'っ',
  // standalone n
  n: 'ん',
}

// Sokuon: a doubled consonant (other than n) produces っ before the next kana.
const SOKUON_CONSONANTS = 'kgsztdhbpmyrwcfjv'

/** Convert a rōmaji string to hiragana. Unknown trailing fragments are kept. */
export function romajiToKana(input: string): string {
  const src = input.toLowerCase().replace(/[^a-z'\-]/g, '')
  let out = ''
  let i = 0

  while (i < src.length) {
    const rest = src.slice(i)

    // sokuon: doubled consonant -> っ, then continue from the second one
    const c = src[i]
    const next = src[i + 1]
    if (c && next && c === next && SOKUON_CONSONANTS.includes(c) && rest.length > 1) {
      out += 'っ'
      i += 1
      continue
    }

    // explicit syllable break: n'ya -> んや
    if (c === 'n' && next === "'") {
      out += 'ん'
      i += 2
      continue
    }

    // 'n' followed by a consonant or end-of-string -> ん
    if (c === 'n' && (i + 1 === src.length || (next && !'aiueoy'.includes(next)))) {
      out += 'ん'
      i += 1
      continue
    }

    // longest match, 3 -> 2 -> 1
    let matched = false
    for (let len = 3; len >= 1; len--) {
      const chunk = rest.slice(0, len)
      const kana = TABLE[chunk]
      if (kana) {
        out += kana
        i += len
        matched = true
        break
      }
    }
    if (!matched) {
      // unknown letter — pass through so the user sees what they typed
      out += src[i]
      i += 1
    }
  }

  return out
}

/** Kana → rōmaji (Hepburn), used for hints and for grading feedback. */
const KANA_TO_ROMAJI: Record<string, string> = {}
for (const [romaji, kana] of Object.entries(TABLE)) {
  // prefer the Hepburn spelling when several rōmaji map to the same kana
  const preferred: Record<string, string> = {
    し: 'shi', ち: 'chi', つ: 'tsu', ふ: 'fu', じ: 'ji', ぢ: 'ji', づ: 'zu',
    しゃ: 'sha', しゅ: 'shu', しょ: 'sho', ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
    じゃ: 'ja', じゅ: 'ju', じょ: 'jo', を: 'o', ん: 'n',
  }
  KANA_TO_ROMAJI[kana] = preferred[kana] ?? romaji
}

export function kanaToRomaji(kana: string): string {
  let out = ''
  let i = 0
  while (i < kana.length) {
    // doubled consonant from っ
    if (kana[i] === 'っ') {
      const nextKana = kana[i + 1]
      const nextRomaji = nextKana ? KANA_TO_ROMAJI[nextKana] : ''
      out += nextRomaji ? nextRomaji[0] : ''
      i += 1
      continue
    }
    if (kana[i] === 'ー') {
      out += '-'
      i += 1
      continue
    }
    let matched = false
    for (let len = 2; len >= 1; len--) {
      const chunk = kana.slice(i, i + len)
      const r = KANA_TO_ROMAJI[chunk]
      if (r) {
        out += r
        i += len
        matched = true
        break
      }
    }
    if (!matched) {
      out += kana[i]
      i += 1
    }
  }
  return out
}

/** Normalise a kana string for lenient comparison. */
export function normaliseKana(kana: string, strict: boolean): string {
  let s = kana.trim()
  if (!strict) {
    // ゔ/ヴ, small/large kana and the prolonged-sound mark are treated leniently
    s = s.replace(/ヴ/g, 'ゔ')
  }
  return s
}

/** Grade a rōmaji answer against the target kana reading. */
export function gradeSpelling(
  typed: string,
  targetKana: string,
  strict: boolean,
): { correct: boolean; produced: string } {
  const produced = romajiToKana(typed)
  const a = normaliseKana(produced, strict)
  const b = normaliseKana(targetKana, strict)
  if (a === b) return { correct: true, produced }

  if (!strict) {
    // allow a missing prolonged-sound mark, e.g. りょこう vs りょこー
    const strip = (x: string) => x.replace(/ー/g, '')
    if (strip(a) === strip(b)) return { correct: true, produced }
  }
  return { correct: false, produced }
}

/** Split a kana reading into morae for per-mora display. */
export function splitMorae(kana: string): string[] {
  const small = 'ゃゅょぁぃぅぇぉ'
  const out: string[] = []
  for (let i = 0; i < kana.length; i++) {
    const ch = kana[i]
    if (small.includes(ch) && out.length > 0) {
      out[out.length - 1] += ch
    } else {
      out.push(ch)
    }
  }
  return out
}
