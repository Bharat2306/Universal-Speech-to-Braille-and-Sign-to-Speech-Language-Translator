"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { convertTextToBraille } from "@/lib/braille-utils"
import { Volume2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { commonWords } from "@/lib/common-words"

export default function TextToBraille() {
  const [text, setText] = useState("")
  const [braille, setBraille] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (text) {
      const brailleText = convertTextToBraille(text)
      setBraille(brailleText)
    } else {
      setBraille("")
    }
  }, [text])

  const handleClear = () => {
    setText("")
    setBraille("")
  }

  const handleCopy = () => {
    navigator.clipboard
      .writeText(braille)
      .then(() => {
        // Could add a toast notification here
        console.log("Braille copied to clipboard")
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

  const addCommonWord = (word: string) => {
    const newText = text ? `${text} ${word}` : word
    setText(newText)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="text-input" className="block text-sm font-medium">
            Enter Text
          </label>
          {text && (
            <Button variant="outline" size="sm" onClick={speakText}>
              <Volume2 className="mr-2 h-4 w-4" />
              Speak Text
            </Button>
          )}
        </div>
        <Textarea
          id="text-input"
          placeholder="Type text to convert to braille..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Common Words:</h3>
        <div className="flex flex-wrap gap-2">
          {commonWords.map((word) => (
            <Badge
              key={word}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => addCommonWord(word)}
            >
              {word}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Braille Output</label>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={handleClear} disabled={!text}>
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!braille}>
              Copy
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="min-h-24 text-2xl break-words">
              {braille || <span className="text-muted-foreground text-base">Braille will appear here...</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-medium mb-2">How to read braille:</h3>
        <p className="text-sm text-muted-foreground">
          Braille consists of 6-dot cells arranged in a 2×3 grid. Each character is represented by a different pattern
          of raised dots. In this digital representation, we use Unicode braille patterns to visually represent what
          would normally be tactile dots.
        </p>
      </div>
    </div>
  )
}
