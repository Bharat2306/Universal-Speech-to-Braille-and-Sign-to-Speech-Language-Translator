"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { convertBrailleToText } from "@/lib/braille-utils"
import { Volume2 } from "lucide-react"

export default function BrailleToText() {
  const [braille, setBraille] = useState("")
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleConvert = () => {
    const convertedText = convertBrailleToText(braille)
    setText(convertedText)
  }

  const handleClear = () => {
    setBraille("")
    setText("")
  }

  const handleCopy = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Could add a toast notification here
        console.log("Text copied to clipboard")
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        setError("Failed to copy to clipboard")
      })
  }

  const speakText = () => {
    if (!text) return

    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.speak(utterance)
    } else {
      setError("Text-to-speech is not supported in your browser")
    }
  }

  // Braille character buttons for input
  const brailleChars = [
    { char: "⠁", label: "a" },
    { char: "⠃", label: "b" },
    { char: "⠉", label: "c" },
    { char: "⠙", label: "d" },
    { char: "⠑", label: "e" },
    { char: "⠋", label: "f" },
    { char: "⠛", label: "g" },
    { char: "⠓", label: "h" },
    { char: "⠊", label: "i" },
    { char: "⠚", label: "j" },
    { char: "⠅", label: "k" },
    { char: "⠇", label: "l" },
    { char: "⠍", label: "m" },
    { char: "⠝", label: "n" },
    { char: "⠕", label: "o" },
    { char: "⠏", label: "p" },
    { char: "⠟", label: "q" },
    { char: "⠗", label: "r" },
    { char: "⠎", label: "s" },
    { char: "⠞", label: "t" },
    { char: "⠥", label: "u" },
    { char: "⠧", label: "v" },
    { char: "⠺", label: "w" },
    { char: "⠭", label: "x" },
    { char: "⠽", label: "y" },
    { char: "⠵", label: "z" },
    { char: "⠀", label: "space" },
    { char: "⠼⠁", label: "1" },
    { char: "⠼⠃", label: "2" },
    { char: "⠼⠉", label: "3" },
    { char: "⠼⠙", label: "4" },
    { char: "⠼⠑", label: "5" },
    { char: "⠼⠋", label: "6" },
    { char: "⠼⠛", label: "7" },
    { char: "⠼⠓", label: "8" },
    { char: "⠼⠊", label: "9" },
    { char: "⠼⠚", label: "0" },
  ]

  const addBrailleChar = (char: string) => {
    setBraille((prev) => prev + char)
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="braille-input" className="block text-sm font-medium mb-2">
          Enter Braille
        </label>
        <Textarea
          id="braille-input"
          placeholder="Enter braille characters..."
          value={braille}
          onChange={(e) => setBraille(e.target.value)}
          rows={3}
          className="resize-none text-2xl"
        />
      </div>

      <div className="grid grid-cols-9 gap-2">
        {brailleChars.map((item) => (
          <Button
            key={item.label}
            variant="outline"
            className="h-12 text-xl"
            onClick={() => addBrailleChar(item.char)}
            title={item.label}
          >
            {item.char}
          </Button>
        ))}
      </div>

      <div className="flex space-x-2">
        <Button onClick={handleConvert} disabled={!braille} className="flex-1">
          Convert to Text
        </Button>
        <Button variant="outline" onClick={handleClear} disabled={!braille && !text}>
          Clear All
        </Button>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Text Output</label>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!text}>
              Copy
            </Button>
            {text && (
              <Button variant="outline" size="sm" onClick={speakText}>
                <Volume2 className="mr-2 h-4 w-4" />
                Speak
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="min-h-24 break-words">
              {text || <span className="text-muted-foreground">Converted text will appear here...</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
