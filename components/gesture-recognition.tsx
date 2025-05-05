"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Camera, AlertTriangle, RefreshCw, Volume2, Zap } from "lucide-react"
import { brailleMap } from "@/lib/braille-utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

// Define the interface for hand landmarks
interface Landmark {
  x: number
  y: number
  z: number
}

// Define gesture training data
interface GestureTrainingData {
  name: string
  description: string
  trained: boolean
  samples: number
}

export default function GestureRecognition() {
  // Create refs
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // State variables
  const [isLoading, setIsLoading] = useState(true)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [recognizedGesture, setRecognizedGesture] = useState("")
  const [brailleOutput, setBrailleOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [gestureHistory, setGestureHistory] = useState<string[]>([])
  const [isTrainingMode, setIsTrainingMode] = useState(false)
  const [currentTrainingGesture, setCurrentTrainingGesture] = useState<string | null>(null)
  const [trainingCountdown, setTrainingCountdown] = useState(0)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [trainingGestures, setTrainingGestures] = useState<GestureTrainingData[]>([
    { name: "help", description: "Closed fist with thumb out", trained: false, samples: 0 },
    { name: "hello", description: "Open palm waving", trained: false, samples: 0 },
    { name: "thank you", description: "Flat hand with fingers together", trained: false, samples: 0 },
    { name: "yes", description: "Fist with thumb up", trained: false, samples: 0 },
    { name: "no", description: "Fist with thumb to side", trained: false, samples: 0 },
    { name: "ok", description: "Victory sign (index and middle fingers up)", trained: false, samples: 0 },
  ])

  // Refs for models and animation frame
  const handposeModelRef = useRef<any>(null)
  const requestAnimationFrameRef = useRef<number | null>(null)
  const tfRef = useRef<any>(null)
  const handposeRef = useRef<any>(null)
  const gestureDataRef = useRef<Record<string, any[]>>({})

  // Ref to track if component is mounted
  const isMountedRef = useRef(true)

  // Function to dynamically load scripts
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${src}"]`)
      if (existingScript) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = src
      script.crossOrigin = "anonymous"
      script.onload = () => resolve()
      script.onerror = (err) => reject(new Error(`Failed to load script: ${src}`))
      document.head.appendChild(script)
    })
  }

  // Function to ensure video element exists
  const ensureVideoElement = (): HTMLVideoElement => {
    // Check if video element already exists
    if (videoRef.current) {
      return videoRef.current
    }

    // If not, create a new video element
    setDebugInfo("Creating new video element...")
    const videoElement = document.createElement("video")
    videoElement.autoplay = true
    videoElement.playsInline = true
    videoElement.muted = true
    videoElement.className = "h-full w-full object-cover"

    // Store the reference
    videoRef.current = videoElement

    // If container exists, append the video element
    if (containerRef.current) {
      // Clear container first
      const existingVideo = containerRef.current.querySelector("video")
      if (existingVideo) {
        containerRef.current.removeChild(existingVideo)
      }

      containerRef.current.appendChild(videoElement)
      setDebugInfo("Video element added to DOM")
    } else {
      setDebugInfo("Warning: Container not found, video element created but not added to DOM")
    }

    return videoElement
  }

  // Function to ensure canvas element exists
  const ensureCanvasElement = (): HTMLCanvasElement => {
    // Check if canvas element already exists
    if (canvasRef.current) {
      return canvasRef.current
    }

    // If not, create a new canvas element
    setDebugInfo("Creating new canvas element...")
    const canvasElement = document.createElement("canvas")
    canvasElement.className = "absolute top-0 left-0 h-full w-full object-cover"

    // Store the reference
    canvasRef.current = canvasElement

    // If container exists, append the canvas element
    if (containerRef.current) {
      // Clear container first
      const existingCanvas = containerRef.current.querySelector("canvas")
      if (existingCanvas) {
        containerRef.current.removeChild(existingCanvas)
      }

      containerRef.current.appendChild(canvasElement)
      setDebugInfo("Canvas element added to DOM")
    } else {
      setDebugInfo("Warning: Container not found, canvas element created but not added to DOM")
    }

    return canvasElement
  }

  // Function to load TensorFlow.js and handpose model
  const loadModels = async () => {
    try {
      if (!isMountedRef.current) return

      setIsModelLoading(true)
      setLoadingProgress(10)
      setDebugInfo("Loading TensorFlow.js...")

      // Dynamically load TensorFlow.js and handpose scripts
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.20.0/dist/tf.min.js")
      if (!isMountedRef.current) return

      setLoadingProgress(40)
      setDebugInfo("TensorFlow.js loaded. Loading handpose model...")

      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/handpose@0.0.7/dist/handpose.min.js")
      if (!isMountedRef.current) return

      setLoadingProgress(60)
      setDebugInfo("Handpose script loaded. Initializing...")

      // Wait a moment to ensure scripts are fully initialized
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (!isMountedRef.current) return

      // Access TensorFlow.js and handpose from the window object
      if (typeof window !== "undefined") {
        tfRef.current = (window as any).tf
        handposeRef.current = (window as any).handpose

        if (!tfRef.current) {
          throw new Error("TensorFlow.js not loaded. Please refresh the page and try again.")
        }

        if (!handposeRef.current) {
          throw new Error("Handpose model not loaded. Please refresh the page and try again.")
        }

        setLoadingProgress(80)
        setDebugInfo("Initializing handpose model...")

        // Load the handpose model
        const model = await handposeRef.current.load({
          detectionConfidence: 0.8,
          maxContinuousChecks: 5,
          iouThreshold: 0.3,
          scoreThreshold: 0.75,
        })
        if (!isMountedRef.current) return

        handposeModelRef.current = model
        setLoadingProgress(100)
        setIsModelLoading(false)
        setDebugInfo("Models loaded successfully!")

        // If camera is already active, start detection
        if (isCameraActive) {
          startDetection()
        }
      }
    } catch (err: any) {
      if (!isMountedRef.current) return

      console.error("Error loading models:", err)
      setError(`Failed to load models: ${err.message}. Please try refreshing the page.`)
      setIsModelLoading(false)
      setDebugInfo(`Error: ${err.message}`)
    }
  }

  // Start camera with improved error handling
  const startCamera = async () => {
    if (!isMountedRef.current) return

    setIsLoading(true)
    setError(null)
    setDebugInfo("Requesting camera access...")

    try {
      // First check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support camera access. Please try a different browser.")
      }

      const constraints = {
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      }

      setDebugInfo("Getting user media...")
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (!isMountedRef.current) return

      // Ensure video element exists before proceeding
      const videoElement = ensureVideoElement()
      setDebugInfo("Setting up video stream...")

      // Set the stream as the source for the video element
      videoElement.srcObject = stream

      // Wait for video to be ready
      videoElement.onloadedmetadata = () => {
        if (!isMountedRef.current) return

        videoElement
          .play()
          .then(() => {
            if (!isMountedRef.current) return

            setIsCameraActive(true)
            setIsLoading(false)
            setDebugInfo("Camera started successfully!")

            // Ensure canvas element exists and set its dimensions
            const canvasElement = ensureCanvasElement()
            canvasElement.width = videoElement.videoWidth
            canvasElement.height = videoElement.videoHeight

            // Start detection if model is loaded
            if (!isModelLoading && handposeModelRef.current) {
              startDetection()
            }
          })
          .catch((err) => {
            if (!isMountedRef.current) return

            console.error("Error playing video:", err)
            setError(`Failed to play video: ${err.message}`)
            setDebugInfo(`Video play error: ${err.message}`)
            setIsLoading(false)
          })
      }

      videoElement.onerror = () => {
        if (!isMountedRef.current) return

        setError("Error with video playback")
        setDebugInfo("Video element error event triggered")
        setIsLoading(false)
      }
    } catch (err: any) {
      if (!isMountedRef.current) return

      console.error("Camera access error:", err)
      let errorMessage = "Unable to access camera. "

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage += "Please grant camera permissions in your browser settings."
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage += "No camera found on your device."
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage += "Your camera might be in use by another application."
      } else {
        errorMessage += `Error: ${err.message}`
      }

      setError(errorMessage)
      setDebugInfo(`Camera error: ${err.name} - ${err.message}`)
      setIsLoading(false)
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (!isMountedRef.current) return

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()

      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsCameraActive(false)
      setDebugInfo("Camera stopped")
    }

    // Stop detection loop
    if (requestAnimationFrameRef.current) {
      cancelAnimationFrame(requestAnimationFrameRef.current)
      requestAnimationFrameRef.current = null
    }
  }

  // Reset everything and try again
  const resetAndRetry = () => {
    if (!isMountedRef.current) return

    stopCamera()
    setError(null)
    setDebugInfo("Resetting...")
    setIsLoading(true)
    setIsModelLoading(true)
    setLoadingProgress(0)
    setRecognizedGesture("")
    setBrailleOutput("")
    setGestureHistory([])
    setIsTrainingMode(false)
    setCurrentTrainingGesture(null)

    // Reload models and restart camera
    setTimeout(() => {
      if (!isMountedRef.current) return

      loadModels().then(() => {
        if (!isMountedRef.current) return
        startCamera()
      })
    }, 1000)
  }

  // Speak the recognized gesture
  const speakGesture = () => {
    if (!recognizedGesture) return

    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(recognizedGesture)
      window.speechSynthesis.speak(utterance)
    } else {
      setError("Text-to-speech is not supported in your browser")
    }
  }

  // Start training mode
  const startTrainingMode = () => {
    if (!isCameraActive) {
      startCamera().then(() => {
        setIsTrainingMode(true)
      })
    } else {
      setIsTrainingMode(true)
    }
    setDebugInfo("Training mode activated")
  }

  // Start training a specific gesture
  const startTrainingGesture = (gestureName: string) => {
    setCurrentTrainingGesture(gestureName)
    setTrainingCountdown(3)
    setTrainingProgress(0)

    // Initialize training data for this gesture if it doesn't exist
    if (!gestureDataRef.current[gestureName]) {
      gestureDataRef.current[gestureName] = []
    }

    setDebugInfo(`Preparing to train gesture: ${gestureName}`)

    // Start countdown
    const countdownInterval = setInterval(() => {
      setTrainingCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          collectTrainingSamples(gestureName)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Collect training samples for a gesture
  const collectTrainingSamples = async (gestureName: string) => {
    setDebugInfo(`Collecting samples for gesture: ${gestureName}`)

    // Ensure video element exists
    const videoElement = ensureVideoElement()

    // Collect 10 samples
    let sampleCount = 0
    const maxSamples = 10

    const collectSample = async () => {
      if (!handposeModelRef.current || !isMountedRef.current || sampleCount >= maxSamples) {
        // Update training status
        setTrainingGestures((prev) =>
          prev.map((g) => (g.name === gestureName ? { ...g, trained: true, samples: maxSamples } : g)),
        )
        setCurrentTrainingGesture(null)
        setDebugInfo(`Training completed for gesture: ${gestureName}`)
        return
      }

      try {
        // Get hand predictions
        const predictions = await handposeModelRef.current.estimateHands(videoElement)

        if (predictions.length > 0) {
          // Convert the landmarks to a more usable format
          const landmarks = predictions[0].landmarks.map((l: number[]) => ({
            x: l[0],
            y: l[1],
            z: l[2],
          }))

          // Store the landmarks as a training sample
          gestureDataRef.current[gestureName].push(landmarks)

          sampleCount++
          setTrainingProgress((sampleCount / maxSamples) * 100)
          setTrainingGestures((prev) => prev.map((g) => (g.name === gestureName ? { ...g, samples: sampleCount } : g)))

          setDebugInfo(`Collected sample ${sampleCount}/${maxSamples} for ${gestureName}`)

          // Wait a moment before collecting the next sample
          setTimeout(collectSample, 300)
        } else {
          // No hand detected, try again
          setTimeout(collectSample, 100)
        }
      } catch (error: any) {
        setDebugInfo(`Error collecting sample: ${error.message}`)
        setTimeout(collectSample, 500)
      }
    }

    collectSample()
  }

  // Exit training mode
  const exitTrainingMode = () => {
    setIsTrainingMode(false)
    setCurrentTrainingGesture(null)
    setDebugInfo("Exited training mode")
  }

  // Load models on component mount
  useEffect(() => {
    isMountedRef.current = true
    loadModels()

    return () => {
      isMountedRef.current = false
      stopCamera()
    }
  }, [])

  // Detect hand gestures
  const startDetection = () => {
    if (!isMountedRef.current) return

    // Ensure video and canvas elements exist
    const videoElement = ensureVideoElement()
    const canvasElement = ensureCanvasElement()

    if (!handposeModelRef.current) {
      setDebugInfo("Cannot start detection: handpose model not loaded")
      return
    }

    setDebugInfo("Starting hand detection...")

    const detectHands = async () => {
      if (!isMountedRef.current) return
      if (!handposeModelRef.current) return

      try {
        // Get hand predictions
        const predictions = await handposeModelRef.current.estimateHands(videoElement)
        if (!isMountedRef.current) return

        // Draw hand landmarks
        const ctx = canvasElement.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)

          // If we have predictions, draw them and classify the gesture
          if (predictions.length > 0) {
            // Convert the landmarks to a more usable format
            const landmarks = predictions[0].landmarks.map((l: number[]) => ({
              x: l[0],
              y: l[1],
              z: l[2],
            }))

            // Draw landmarks
            drawHandLandmarks(ctx, landmarks)

            // If in training mode and collecting samples, don't classify
            if (isTrainingMode && currentTrainingGesture) {
              // Just draw the landmarks
            } else {
              // Classify gesture using trained data if available
              const gesture = classifyGesture(landmarks)
              if (gesture && gesture !== recognizedGesture) {
                setRecognizedGesture(gesture)

                // Add to history if it's a new gesture
                if (!gestureHistory.includes(gesture)) {
                  setGestureHistory((prev) => [gesture, ...prev].slice(0, 5))
                }

                // Convert to braille
                const brailleString = gesture
                  .toLowerCase()
                  .split("")
                  .map((char) => brailleMap[char] || "⠿")
                  .join("")

                setBrailleOutput(brailleString)
              }
            }
          } else {
            // No hands detected
            if (recognizedGesture && !isTrainingMode) {
              // Keep the last recognized gesture for a moment before clearing
              setTimeout(() => {
                if (!isMountedRef.current) return
                if (!predictions.length && !isTrainingMode) {
                  setRecognizedGesture("")
                  setBrailleOutput("")
                }
              }, 1000)
            }
          }
        }
      } catch (error: any) {
        if (!isMountedRef.current) return

        console.error("Error in hand detection:", error)
        setDebugInfo(`Detection error: ${error.message}`)
      }

      // Continue detection loop
      if (isMountedRef.current) {
        requestAnimationFrameRef.current = requestAnimationFrame(detectHands)
      }
    }

    detectHands()
  }

  // Draw hand landmarks on canvas
  const drawHandLandmarks = (ctx: CanvasRenderingContext2D, landmarks: Landmark[]) => {
    // Draw dots at each landmark
    for (let i = 0; i < landmarks.length; i++) {
      const { x, y } = landmarks[i]

      ctx.beginPath()
      ctx.arc(x, y, 5, 0, 2 * Math.PI)
      ctx.fillStyle = "rgba(0, 255, 0, 0.8)"
      ctx.fill()
    }

    // Draw connections between landmarks to show hand skeleton
    const fingerJoints = [
      // Thumb
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
      ],
      // Index finger
      [
        [0, 5],
        [5, 6],
        [6, 7],
        [7, 8],
      ],
      // Middle finger
      [
        [0, 9],
        [9, 10],
        [10, 11],
        [11, 12],
      ],
      // Ring finger
      [
        [0, 13],
        [13, 14],
        [14, 15],
        [15, 16],
      ],
      // Pinky
      [
        [0, 17],
        [17, 18],
        [18, 19],
        [19, 20],
      ],
    ]

    // Draw paths
    ctx.strokeStyle = "rgba(0, 255, 0, 0.8)"
    ctx.lineWidth = 2

    fingerJoints.forEach((finger) => {
      finger.forEach(([start, end]) => {
        ctx.beginPath()
        ctx.moveTo(landmarks[start].x, landmarks[start].y)
        ctx.lineTo(landmarks[end].x, landmarks[end].y)
        ctx.stroke()
      })
    })
  }

  // Classify gesture based on hand landmarks - updated with more gestures
  const classifyGesture = (landmarks: Landmark[]): string => {
    // Check if we have trained data for gestures
    const trainedGestureNames = Object.keys(gestureDataRef.current)
    if (trainedGestureNames.length > 0) {
      // Use trained data to classify gesture
      return classifyUsingTrainedData(landmarks)
    }

    // Fallback to rule-based classification if no trained data
    return classifyUsingRules(landmarks)
  }

  // Classify gesture using trained data
  const classifyUsingTrainedData = (landmarks: Landmark[]): string => {
    // Simple nearest neighbor classification
    let bestMatch = ""
    let bestScore = Number.POSITIVE_INFINITY

    // Check each trained gesture
    for (const [gestureName, samples] of Object.entries(gestureDataRef.current)) {
      if (samples.length === 0) continue

      // Calculate average distance to all samples of this gesture
      let totalDistance = 0
      for (const sample of samples) {
        const distance = calculateLandmarkDistance(landmarks, sample)
        totalDistance += distance
      }

      const avgDistance = totalDistance / samples.length

      // If this is the best match so far, update
      if (avgDistance < bestScore) {
        bestScore = avgDistance
        bestMatch = gestureName
      }
    }

    // Only return a match if the score is below a threshold
    return bestScore < 2000 ? bestMatch : ""
  }

  // Calculate distance between two sets of landmarks
  const calculateLandmarkDistance = (landmarks1: Landmark[], landmarks2: any[]): number => {
    let totalDistance = 0

    // Ensure both have the same number of landmarks
    const minLength = Math.min(landmarks1.length, landmarks2.length)

    for (let i = 0; i < minLength; i++) {
      const l1 = landmarks1[i]
      const l2 = landmarks2[i]

      // Calculate Euclidean distance
      const dx = l1.x - l2.x
      const dy = l1.y - l2.y
      const dz = l1.z - l2.z

      totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz)
    }

    return totalDistance
  }

  // Rule-based gesture classification (fallback)
  const classifyUsingRules = (landmarks: Landmark[]): string => {
    // Extract key points
    const palmBase = landmarks[0]
    const thumb = landmarks[4]
    const indexFinger = landmarks[8]
    const middleFinger = landmarks[12]
    const ringFinger = landmarks[16]
    const pinky = landmarks[20]

    // Calculate distances and angles for gesture recognition
    const thumbUp = thumb.y < palmBase.y - 50
    const indexUp = indexFinger.y < palmBase.y - 50
    const middleUp = middleFinger.y < palmBase.y - 50
    const ringUp = ringFinger.y < palmBase.y - 50
    const pinkyUp = pinky.y < palmBase.y - 50

    // Calculate finger spread (distance between index and pinky)
    const fingerSpread = Math.abs(indexFinger.x - pinky.x)
    const isHandOpen = fingerSpread > 100

    // Calculate distances between fingertips
    const indexToThumbDist = Math.sqrt(Math.pow(indexFinger.x - thumb.x, 2) + Math.pow(indexFinger.y - thumb.y, 2))
    const middleToThumbDist = Math.sqrt(Math.pow(middleFinger.x - thumb.x, 2) + Math.pow(middleFinger.y - thumb.y, 2))

    // Recognize specific gestures with the new phrases

    // "help" - Closed fist with thumb out
    if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) {
      return "help"
    }

    // "help me" - Open palm with fingers together
    if (indexUp && middleUp && ringUp && pinkyUp && !isHandOpen) {
      return "help me"
    }

    // "ok" - Victory sign (index and middle fingers up)
    if (indexUp && middleUp && !ringUp && !pinkyUp) {
      return "ok"
    }

    // "how are you" - L shape (thumb and index finger extended)
    if (thumbUp && indexUp && !middleUp && !ringUp && !pinkyUp) {
      return "how are you"
    }

    // "bye" - Thumb and pinky extended (hang loose)
    if (thumbUp && !indexUp && !middleUp && !ringUp && pinkyUp) {
      return "bye"
    }

    // "hello" - Open palm waving (all fingers up and spread)
    if (thumbUp && indexUp && middleUp && ringUp && pinkyUp && isHandOpen) {
      return "hello"
    }

    // "thank you" - Flat hand with fingers together touching chest
    if (indexUp && middleUp && ringUp && pinkyUp && !isHandOpen) {
      return "thank you"
    }

    // "yes" - Fist with thumb up
    if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp && thumb.y < palmBase.y - 80) {
      return "yes"
    }

    // "no" - Fist with thumb to side
    if (!thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp && Math.abs(thumb.x - palmBase.x) > 50) {
      return "no"
    }

    // "please" - Hand with palm facing up
    if (indexUp && middleUp && ringUp && pinkyUp && thumb.y > palmBase.y) {
      return "please"
    }

    // "sorry" - Fist over heart
    if (!thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp && palmBase.y > 300) {
      return "sorry"
    }

    // "water" - W shape (index, middle, and ring fingers up)
    if (indexUp && middleUp && ringUp && !pinkyUp) {
      return "water"
    }

    // "food" - Hand to mouth
    if (indexUp && !middleUp && !ringUp && !pinkyUp && indexFinger.y < 150) {
      return "food"
    }

    // Default - no recognized gesture
    return ""
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={resetAndRetry} className="mt-2 ml-2">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isModelLoading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Loading models: {debugInfo}</span>
            <span>{loadingProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${loadingProgress}%` }}></div>
          </div>
        </div>
      )}

      <Tabs defaultValue="recognition" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="recognition">Recognition Mode</TabsTrigger>
          <TabsTrigger value="training">Training Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="recognition">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div ref={containerRef} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <>{/* Video and canvas elements will be dynamically created and added here */}</>
                )}
              </div>

              <div className="flex justify-center">
                {!isCameraActive ? (
                  <Button onClick={startCamera} disabled={isModelLoading}>
                    <Camera className="mr-2 h-4 w-4" />
                    Start Camera
                  </Button>
                ) : (
                  <Button onClick={stopCamera} variant="destructive">
                    Stop Camera
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">Recognized Gesture:</h3>
                        {recognizedGesture && (
                          <Button variant="outline" size="sm" onClick={speakGesture}>
                            <Volume2 className="h-4 w-4 mr-1" />
                            Speak
                          </Button>
                        )}
                      </div>
                      <div className="text-3xl font-bold min-h-16 flex items-center">
                        {isCameraActive ? (
                          isModelLoading ? (
                            <Skeleton className="h-10 w-32" />
                          ) : (
                            recognizedGesture || "Waiting for gesture..."
                          )
                        ) : (
                          "Start camera to begin"
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Braille Representation:</h3>
                      <div className="text-4xl min-h-16 flex items-center">
                        {isCameraActive ? (
                          isModelLoading ? (
                            <Skeleton className="h-10 w-32" />
                          ) : (
                            brailleOutput || "⠿"
                          )
                        ) : (
                          "⠿"
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {gestureHistory.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Recent Gestures:</h3>
                  <div className="flex flex-wrap gap-2">
                    {gestureHistory.map((gesture, index) => (
                      <Badge key={index} variant="secondary">
                        {gesture}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Supported Gestures:</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div>• "help" - Closed fist with thumb out</div>
                  <div>• "help me" - Open palm with fingers together</div>
                  <div>• "ok" - Victory sign (index and middle fingers up)</div>
                  <div>• "how are you" - L shape (thumb and index finger)</div>
                  <div>• "bye" - Thumb and pinky extended</div>
                  <div>• "hello" - Open palm waving</div>
                  <div>• "thank you" - Flat hand with fingers together</div>
                  <div>• "yes" - Fist with thumb up</div>
                  <div>• "no" - Fist with thumb to side</div>
                  <div>• "please" - Hand with palm facing up</div>
                  <div>• "sorry" - Fist over heart</div>
                  <div>• "water" - W shape with fingers</div>
                  <div>• "food" - Hand to mouth</div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="training">
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Gesture Training Mode</h3>
              <p className="text-sm mb-4">
                Train the system to recognize your specific hand gestures. Follow the instructions to create custom
                gesture recognition that works better for your hand movements.
              </p>

              {!isCameraActive && (
                <Button onClick={startCamera} disabled={isModelLoading}>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera for Training
                </Button>
              )}
            </div>

            {isCameraActive && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div ref={containerRef} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    {isLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <>{/* Video and canvas elements will be dynamically created and added here */}</>
                    )}
                  </div>

                  {currentTrainingGesture && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-center">
                        {trainingCountdown > 0
                          ? `Get ready! Starting in ${trainingCountdown}...`
                          : `Make the "${currentTrainingGesture}" gesture`}
                      </h3>
                      <Progress value={trainingProgress} className="w-full" />
                    </div>
                  )}
                </div>

                <div>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-medium mb-4">Available Gestures for Training</h3>
                      <div className="space-y-4">
                        {trainingGestures.map((gesture) => (
                          <div key={gesture.name} className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{gesture.name}</span>
                              <p className="text-sm text-muted-foreground">{gesture.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {gesture.trained ? (
                                <Badge
                                  variant="success"
                                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                >
                                  Trained ({gesture.samples}/10)
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => startTrainingGesture(gesture.name)}
                                  disabled={!!currentTrainingGesture || !isCameraActive}
                                >
                                  <Zap className="mr-1 h-3 w-3" />
                                  Train
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Debug information for troubleshooting */}
      <div className="text-xs text-gray-500 mt-2">Status: {debugInfo}</div>
    </div>
  )
}
