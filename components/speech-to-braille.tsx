"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Mic, MicOff, Volume2, AlertTriangle, RefreshCw, Zap } from "lucide-react"
import { convertTextToBraille } from "@/lib/braille-utils"
import { Badge } from "@/components/ui/badge"
import { commonWords } from "@/lib/common-words"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

export default function SpeechToBraille() {
  const [isListening, setIsListening] = useState(false)
  const [spokenText, setSpokenText] = useState("")
  const [brailleOutput, setBrailleOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [recognitionSupported, setRecognitionSupported] = useState(false) // Default to false until we confirm support
  const [debugInfo, setDebugInfo] = useState<string>("Initializing...")
  const [isTrainingMode, setIsTrainingMode] = useState(false)
  const [trainedWords, setTrainedWords] = useState<string[]>([])
  const [currentTrainingWord, setCurrentTrainingWord] = useState<string>("")
  const [trainingAttempts, setTrainingAttempts] = useState(0)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [customWords, setCustomWords] = useState<string[]>([])
  const [newCustomWord, setNewCustomWord] = useState("")
  const [apiInitialized, setApiInitialized] = useState(false)

  // Use refs to store recognition objects
  const recognitionRef = useRef<any>(null)
  const trainingRecognitionRef = useRef<any>(null)
  const isMountedRef = useRef(true)

  // Function to safely create a speech recognition instance
  const createRecognitionInstance = () => {
    try {
      if (typeof window === "undefined") return null

      // Check for SpeechRecognition support
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) return null

      return new SpeechRecognition()
    } catch (err) {
      console.error("Error creating speech recognition instance:", err)
      return null
    }
  }

  // Initialize speech recognition - separated into its own function for clarity
  const initializeSpeechRecognition = () => {
    if (apiInitialized) return // Only initialize once

    try {
      setDebugInfo("Checking speech recognition support...")

      // Check if we're in a browser environment
      if (typeof window === "undefined") {
        setDebugInfo("Not in browser environment")
        return
      }

      // Check for SpeechRecognition support
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        setRecognitionSupported(false)
        setError("Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.")
        setDebugInfo("Speech recognition not supported")
        return
      }

      setRecognitionSupported(true)
      setDebugInfo("Speech recognition is supported")

      // Initialize main recognition instance
      if (!recognitionRef.current) {
        const recognition = createRecognitionInstance()
        if (!recognition) {
          setRecognitionSupported(false)
          setError("Failed to create speech recognition instance")
          setDebugInfo("Failed to create recognition instance")
          return
        }

        recognitionRef.current = recognition
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "en-US"
        recognitionRef.current.maxAlternatives = 1

        // Set up event handlers
        recognitionRef.current.onresult = (event: any) => {
          if (!isMountedRef.current) return

          try {
            const transcript = Array.from(event.results)
              .map((result: any) => result[0])
              .map((result) => result.transcript)
              .join("")

            setSpokenText(transcript)
            setBrailleOutput(convertTextToBraille(transcript))
            setDebugInfo(`Recognized: ${transcript}`)
          } catch (err) {
            console.error("Error processing recognition result:", err)
            setDebugInfo("Error processing recognition result")
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          if (!isMountedRef.current) return

          console.error("Speech recognition error", event.error)

          // Handle specific error types
          if (event.error === "aborted") {
            setDebugInfo("Recognition aborted - will attempt to restart")
            // Don't set error for aborted - just try to restart
            setTimeout(() => {
              if (isListening && isMountedRef.current) {
                try {
                  recognitionRef.current.start()
                  setDebugInfo("Restarted after abort")
                } catch (e) {
                  console.error("Failed to restart after abort:", e)
                  // Don't set error here to avoid cascading errors
                }
              }
            }, 1000)
          } else if (event.error === "not-allowed") {
            setError("Microphone access denied. Please allow microphone access in your browser settings.")
          } else if (event.error === "network") {
            setError("Network error occurred. Please check your internet connection.")
          } else {
            setError(`Speech recognition error: ${event.error}`)
          }

          if (event.error !== "aborted" && isMountedRef.current) {
            setIsListening(false)
          }
        }

        recognitionRef.current.onend = () => {
          if (!isMountedRef.current) return

          setDebugInfo("Recognition ended")
          if (isListening) {
            // Add a small delay before restarting to avoid rapid restart issues
            setTimeout(() => {
              if (isListening && isMountedRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start()
                  setDebugInfo("Restarted after end")
                } catch (e) {
                  console.error("Failed to restart recognition", e)
                  // Don't set error here to avoid cascading errors
                }
              }
            }, 300)
          }
        }
      }

      // Initialize training recognition instance
      if (!trainingRecognitionRef.current) {
        const trainingRecognition = createRecognitionInstance()
        if (!trainingRecognition) {
          setDebugInfo("Failed to create training recognition instance")
          return
        }

        trainingRecognitionRef.current = trainingRecognition
        trainingRecognitionRef.current.continuous = false
        trainingRecognitionRef.current.interimResults = false
        trainingRecognitionRef.current.lang = "en-US"
        trainingRecognitionRef.current.maxAlternatives = 1

        // Set up event handlers
        trainingRecognitionRef.current.onresult = (event: any) => {
          if (!isMountedRef.current) return

          try {
            if (event.results.length > 0) {
              const transcript = event.results[0][0].transcript.trim().toLowerCase()
              setDebugInfo(`Training recognized: "${transcript}" for "${currentTrainingWord}"`)

              // Check if the recognized word matches the training word
              if (transcript === currentTrainingWord.toLowerCase()) {
                // Success - add to trained words
                setTrainedWords((prev) => [...prev, currentTrainingWord])
                setTrainingProgress(100)
                setDebugInfo(`Successfully trained "${currentTrainingWord}"!`)

                // Reset after a moment
                setTimeout(() => {
                  if (isMountedRef.current) {
                    setCurrentTrainingWord("")
                    setTrainingAttempts(0)
                    setTrainingProgress(0)
                  }
                }, 1500)
              } else {
                // Increment attempts
                setTrainingAttempts((prev) => prev + 1)
                setDebugInfo(
                  `Attempt ${trainingAttempts + 1}: Said "${transcript}" instead of "${currentTrainingWord}"`,
                )

                if (trainingAttempts >= 2) {
                  // After 3 attempts, move on
                  setDebugInfo(`Moving on after 3 attempts for "${currentTrainingWord}"`)
                  setTimeout(() => {
                    if (isMountedRef.current) {
                      setCurrentTrainingWord("")
                      setTrainingAttempts(0)
                      setTrainingProgress(0)
                    }
                  }, 1500)
                } else {
                  // Try again
                  setTrainingProgress((trainingAttempts + 1) * 33)
                  setTimeout(() => {
                    if (isTrainingMode && isMountedRef.current) startTrainingRecognition()
                  }, 1500)
                }
              }
            }
          } catch (err) {
            console.error("Error processing training result:", err)
            setDebugInfo("Error processing training result")
          }
        }

        trainingRecognitionRef.current.onerror = (event: any) => {
          if (!isMountedRef.current) return

          console.error("Training recognition error", event.error)
          setDebugInfo(`Training error: ${event.error}`)
          setTrainingAttempts((prev) => prev + 1)

          if (trainingAttempts >= 2) {
            // After 3 attempts, move on
            setTimeout(() => {
              if (isMountedRef.current) {
                setCurrentTrainingWord("")
                setTrainingAttempts(0)
                setTrainingProgress(0)
              }
            }, 1500)
          } else {
            // Try again
            setTimeout(() => {
              if (isTrainingMode && isMountedRef.current) startTrainingRecognition()
            }, 1500)
          }
        }
      }

      setApiInitialized(true)
      setDebugInfo("Speech recognition initialized successfully")
    } catch (err) {
      console.error("Error initializing speech recognition:", err)
      setRecognitionSupported(false)
      setError("Failed to initialize speech recognition. Please try a different browser.")
      setDebugInfo("Initialization error")
    }
  }

  // Initialize on component mount
  useEffect(() => {
    isMountedRef.current = true

    // Delay initialization slightly to ensure the component is fully mounted
    const initTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        initializeSpeechRecognition()
      }
    }, 500)

    // Cleanup function
    return () => {
      isMountedRef.current = false
      clearTimeout(initTimeout)

      // Safely stop recognition instances
      try {
        if (recognitionRef.current) {
          recognitionRef.current.onresult = null
          recognitionRef.current.onerror = null
          recognitionRef.current.onend = null
          recognitionRef.current.stop()
        }
      } catch (e) {
        console.error("Error cleaning up recognition:", e)
      }

      try {
        if (trainingRecognitionRef.current) {
          trainingRecognitionRef.current.onresult = null
          trainingRecognitionRef.current.onerror = null
          trainingRecognitionRef.current.onend = null
          trainingRecognitionRef.current.stop()
        }
      } catch (e) {
        console.error("Error cleaning up training recognition:", e)
      }
    }
  }, [])

  // Effect to handle listening state changes
  useEffect(() => {
    if (!recognitionSupported || !recognitionRef.current) return

    if (isListening) {
      try {
        recognitionRef.current.start()
        setDebugInfo("Started listening")
      } catch (err) {
        console.error("Error starting recognition in effect:", err)
        setIsListening(false)
        setDebugInfo("Failed to start listening")
      }
    } else {
      try {
        recognitionRef.current.stop()
        setDebugInfo("Stopped listening")
      } catch (err) {
        console.error("Error stopping recognition in effect:", err)
        setDebugInfo("Failed to stop listening")
      }
    }
  }, [isListening, recognitionSupported])

  // Toggle listening state
  const toggleListening = () => {
    if (!recognitionSupported) {
      setError("Speech recognition is not supported in your browser")
      return
    }

    if (!recognitionRef.current) {
      setError("Speech recognition not initialized. Please refresh the page.")
      return
    }

    setIsListening((prev) => !prev)
    setError(null)
  }

  // Reset everything
  const handleReset = () => {
    setIsListening(false)
    setSpokenText("")
    setBrailleOutput("")
    setError(null)
    setDebugInfo("Reset")
  }

  // Speak the text using text-to-speech
  const speakText = () => {
    if (!spokenText) return

    try {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(spokenText)
        window.speechSynthesis.speak(utterance)
        setDebugInfo("Speaking text")
      } else {
        setError("Text-to-speech is not supported in your browser")
        setDebugInfo("Text-to-speech not supported")
      }
    } catch (err) {
      console.error("Error with text-to-speech:", err)
      setError("Failed to use text-to-speech")
    }
  }

  // Add common word to input
  const addCommonWord = (word: string) => {
    const newText = spokenText ? `${spokenText} ${word}` : word
    setSpokenText(newText)
    setBrailleOutput(convertTextToBraille(newText))
    setDebugInfo(`Added word: ${word}`)
  }

  // Start training mode
  const startTrainingMode = () => {
    setIsListening(false)
    setIsTrainingMode(true)
    setDebugInfo("Entered training mode")
  }

  // Exit training mode
  const exitTrainingMode = () => {
    try {
      if (trainingRecognitionRef.current) {
        trainingRecognitionRef.current.stop()
      }
    } catch (err) {
      console.error("Error stopping training recognition:", err)
    }

    setIsTrainingMode(false)
    setCurrentTrainingWord("")
    setTrainingAttempts(0)
    setTrainingProgress(0)
    setDebugInfo("Exited training mode")
  }

  // Start training a specific word
  const startTrainingWord = (word: string) => {
    if (!recognitionSupported || !trainingRecognitionRef.current) {
      setError("Speech recognition is not supported or not initialized")
      return
    }

    setCurrentTrainingWord(word)
    setTrainingAttempts(0)
    setTrainingProgress(0)
    setDebugInfo(`Starting training for: ${word}`)
    startTrainingRecognition()
  }

  // Start the training recognition process
  const startTrainingRecognition = () => {
    if (!trainingRecognitionRef.current || !recognitionSupported) {
      setDebugInfo("Training recognition not available")
      return
    }

    try {
      // First make sure it's stopped
      try {
        trainingRecognitionRef.current.stop()
      } catch (e) {
        // Ignore errors when stopping
      }

      // Add a delay before starting again
      setTimeout(() => {
        if (!isMountedRef.current) return

        setDebugInfo(`Say: "${currentTrainingWord}" clearly`)
        try {
          trainingRecognitionRef.current.start()
        } catch (err) {
          console.error("Error starting training recognition:", err)
          setDebugInfo(`Training start error: ${err.message || "Unknown error"}`)

          // Move to next attempt on error
          setTrainingAttempts((prev) => prev + 1)
          if (trainingAttempts >= 2) {
            setTimeout(() => {
              if (isMountedRef.current) {
                setCurrentTrainingWord("")
                setTrainingAttempts(0)
                setTrainingProgress(0)
              }
            }, 1500)
          } else {
            setTimeout(() => {
              if (isTrainingMode && isMountedRef.current) startTrainingRecognition()
            }, 1500)
          }
        }
      }, 500)
    } catch (err) {
      console.error("Error in training recognition:", err)
      setDebugInfo(`Training error: ${err.message || "Unknown error"}`)
    }
  }

  // Add a custom word to train
  const addCustomWord = () => {
    if (!newCustomWord.trim()) return

    setCustomWords((prev) => [...prev, newCustomWord.trim()])
    setNewCustomWord("")
    setDebugInfo(`Added custom word: ${newCustomWord.trim()}`)
  }

  // Request microphone permission explicitly
  const requestMicrophonePermission = async () => {
    try {
      setDebugInfo("Requesting microphone permission...")
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setDebugInfo("Microphone permission granted")

      // Re-initialize speech recognition after permission is granted
      initializeSpeechRecognition()

      return true
    } catch (err) {
      console.error("Microphone permission denied:", err)
      setError("Microphone access denied. Please allow microphone access in your browser settings.")
      setDebugInfo("Microphone permission denied")
      return false
    }
  }

  // Reinitialize speech recognition
  const reinitializeSpeechRecognition = () => {
    setApiInitialized(false)

    // Clean up existing instances
    try {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    } catch (e) {
      console.error("Error cleaning up recognition:", e)
    }

    try {
      if (trainingRecognitionRef.current) {
        trainingRecognitionRef.current.onresult = null
        trainingRecognitionRef.current.onerror = null
        trainingRecognitionRef.current.onend = null
        trainingRecognitionRef.current.stop()
        trainingRecognitionRef.current = null
      }
    } catch (e) {
      console.error("Error cleaning up training recognition:", e)
    }

    // Reinitialize
    setTimeout(() => {
      if (isMountedRef.current) {
        initializeSpeechRecognition()
      }
    }, 500)
  }

  return (
    <Tabs defaultValue="recognition" className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="recognition">Recognition Mode</TabsTrigger>
        <TabsTrigger value="training">Training Mode</TabsTrigger>
      </TabsList>

      <TabsContent value="recognition">
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
                {error.includes("not supported") ? (
                  <p className="mt-2 text-sm">Try using Google Chrome or Microsoft Edge for the best experience.</p>
                ) : (
                  <div className="mt-2 space-x-2">
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={reinitializeSpeechRecognition}>
                      Reinitialize
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col items-center justify-center space-y-4">
            {!recognitionSupported ? (
              <div className="text-center">
                <p className="text-amber-600 mb-2">Speech recognition not available in this browser</p>
                <Button variant="outline" onClick={requestMicrophonePermission}>
                  Try to Enable Speech Recognition
                </Button>
              </div>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={toggleListening}
                  disabled={!recognitionSupported}
                  variant={isListening ? "destructive" : "default"}
                  className="h-16 w-16 rounded-full"
                >
                  {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
                <p className="text-sm text-center">
                  {isListening ? "Listening... Speak now" : "Click to start listening"}
                </p>
              </>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Recognized Speech:</h3>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={handleReset} disabled={!spokenText}>
                  Clear
                </Button>
                <Button variant="outline" size="sm" onClick={speakText} disabled={!spokenText}>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Speak
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="min-h-24 break-words">
                  {spokenText || <span className="text-muted-foreground">Your speech will appear here...</span>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Braille Output:</h3>
            <Card>
              <CardContent className="p-4">
                <div className="min-h-24 text-2xl break-words">
                  {brailleOutput || (
                    <span className="text-muted-foreground text-base">Braille will appear here...</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Common Words:</h3>
            <div className="flex flex-wrap gap-2">
              {commonWords.map((word) => (
                <Badge
                  key={word}
                  variant="outline"
                  className={`cursor-pointer hover:bg-primary hover:text-primary-foreground ${
                    trainedWords.includes(word)
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : ""
                  }`}
                  onClick={() => addCommonWord(word)}
                >
                  {word}
                </Badge>
              ))}

              {customWords.map((word) => (
                <Badge
                  key={`custom-${word}`}
                  variant="outline"
                  className={`cursor-pointer hover:bg-primary hover:text-primary-foreground ${
                    trainedWords.includes(word)
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : ""
                  }`}
                  onClick={() => addCommonWord(word)}
                >
                  {word}
                </Badge>
              ))}
            </div>
          </div>

          {/* Debug information */}
          <div className="text-xs text-gray-500 mt-2">Status: {debugInfo}</div>
        </div>
      </TabsContent>

      <TabsContent value="training">
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Speech Training Mode</h3>
            <p className="text-sm mb-4">
              Train the system to better recognize your voice and pronunciation. Select words to train or add your own
              custom words.
            </p>

            {!recognitionSupported && (
              <Button variant="outline" onClick={requestMicrophonePermission} className="mt-2">
                Try to Enable Speech Recognition
              </Button>
            )}
          </div>

          {currentTrainingWord ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-medium">Say: "{currentTrainingWord}"</h3>
                <p className="text-sm text-muted-foreground">Speak clearly into your microphone</p>
              </div>

              <Progress value={trainingProgress} className="w-full" />

              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setCurrentTrainingWord("")}>
                  Skip
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Add Custom Word:</h3>
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Enter a custom word or phrase to train"
                    value={newCustomWord}
                    onChange={(e) => setNewCustomWord(e.target.value)}
                    className="resize-none"
                  />
                  <Button onClick={addCustomWord} disabled={!newCustomWord.trim()}>
                    Add
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Train Common Words:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commonWords.map((word) => (
                    <Button
                      key={word}
                      variant="outline"
                      className={`justify-start ${
                        trainedWords.includes(word)
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : ""
                      }`}
                      onClick={() => startTrainingWord(word)}
                      disabled={!recognitionSupported}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      {word}
                    </Button>
                  ))}
                </div>
              </div>

              {customWords.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Train Custom Words:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {customWords.map((word) => (
                      <Button
                        key={`train-${word}`}
                        variant="outline"
                        className={`justify-start ${
                          trainedWords.includes(word)
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : ""
                        }`}
                        onClick={() => startTrainingWord(word)}
                        disabled={!recognitionSupported}
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        {word}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <Button onClick={exitTrainingMode}>Exit Training Mode</Button>
              </div>
            </div>
          )}

          {/* Debug information */}
          <div className="text-xs text-gray-500 mt-2">Status: {debugInfo}</div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
