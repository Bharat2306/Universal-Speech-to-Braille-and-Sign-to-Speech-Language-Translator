// Mapping of letters to braille Unicode characters
export const brailleMap: Record<string, string> = {
  a: "⠁",
  b: "⠃",
  c: "⠉",
  d: "⠙",
  e: "⠑",
  f: "⠋",
  g: "⠛",
  h: "⠓",
  i: "⠊",
  j: "⠚",
  k: "⠅",
  l: "⠇",
  m: "⠍",
  n: "⠝",
  o: "⠕",
  p: "⠏",
  q: "⠟",
  r: "⠗",
  s: "⠎",
  t: "⠞",
  u: "⠥",
  v: "⠧",
  w: "⠺",
  x: "⠭",
  y: "⠽",
  z: "⠵",
  "0": "⠼⠚",
  "1": "⠼⠁",
  "2": "⠼⠃",
  "3": "⠼⠉",
  "4": "⠼⠙",
  "5": "⠼⠑",
  "6": "⠼⠋",
  "7": "⠼⠛",
  "8": "⠼⠓",
  "9": "⠼⠊",
  ".": "⠲",
  ",": "⠂",
  ";": "⠆",
  ":": "⠒",
  "?": "⠦",
  "!": "⠖",
  "'": "⠄",
  '"': "⠄⠄",
  "(": "⠐⠣",
  ")": "⠐⠜",
  "-": "⠤",
  " ": "⠀",
}

// Reverse mapping for braille to text conversion
export const textMap: Record<string, string> = Object.entries(brailleMap).reduce(
  (acc, [key, value]) => {
    acc[value] = key
    return acc
  },
  {} as Record<string, string>,
)

// Convert text to braille
export function convertTextToBraille(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((char) => brailleMap[char] || char)
    .join("")
}

// Convert braille to text
export function convertBrailleToText(braille: string): string {
  // Handle multi-character braille symbols (like numbers)
  let result = ""
  let i = 0

  while (i < braille.length) {
    // Check for number prefix
    if (braille[i] === "⠼" && i + 1 < braille.length) {
      const numChar = braille[i + 1]
      const numKey = `⠼${numChar}`

      // Find the corresponding number
      for (const [key, value] of Object.entries(brailleMap)) {
        if (value === numKey) {
          result += key
          i += 2
          continue
        }
      }
    } else {
      // Regular character
      result += textMap[braille[i]] || braille[i]
      i++
    }
  }

  return result
}

// Common braille words and phrases
export const commonBrailleWords: Record<string, string> = {
  hello: "⠓⠑⠇⠇⠕",
  goodbye: "⠛⠕⠕⠙⠃⠽⠑",
  "thank you": "⠞⠓⠁⠝⠅⠀⠽⠕⠥",
  please: "⠏⠇⠑⠁⠎⠑",
  help: "⠓⠑⠇⠏",
  yes: "⠽⠑⠎",
  no: "⠝⠕",
  sorry: "⠎⠕⠗⠗⠽",
  "excuse me": "⠑⠭⠉⠥⠎⠑⠀⠍⠑",
  "how are you": "⠓⠕⠺⠀⠁⠗⠑⠀⠽⠕⠥",
  "I am fine": "⠊⠀⠁⠍⠀⠋⠊⠝⠑",
  "good morning": "⠛⠕⠕⠙⠀⠍⠕⠗⠝⠊⠝⠛",
  "good afternoon": "⠛⠕⠕⠙⠀⠁⠋⠞⠑⠗⠝⠕⠕⠝",
  "good evening": "⠛⠕⠕⠙⠀⠑⠧⠑⠝⠊⠝⠛",
  "good night": "⠛⠕⠕⠙⠀⠝⠊⠛⠓⠞",
  "my name is": "⠍⠽⠀⠝⠁⠍⠑⠀⠊⠎",
  "nice to meet you": "⠝⠊⠉⠑⠀⠞⠕⠀⠍⠑⠑⠞⠀⠽⠕⠥",
  water: "⠺⠁⠞⠑⠗",
  food: "⠋⠕⠕⠙",
  bathroom: "⠃⠁⠞⠓⠗⠕⠕⠍",
  emergency: "⠑⠍⠑⠗⠛⠑⠝⠉⠽",
  doctor: "⠙⠕⠉⠞⠕⠗",
  hospital: "⠓⠕⠎⠏⠊⠞⠁⠇",
  family: "⠋⠁⠍⠊⠇⠽",
  friend: "⠋⠗⠊⠑⠝⠙",
}
