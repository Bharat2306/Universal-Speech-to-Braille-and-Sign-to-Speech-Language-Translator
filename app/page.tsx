"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import GestureRecognition from "@/components/gesture-recognition"
import TextToBraille from "@/components/text-to-braille"
import BrailleToText from "@/components/braille-to-text"
import SpeechToBraille from "@/components/speech-to-braille"
import { HandIcon, Type, Braces, Mic, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-center md:text-left">Hand Gesture to Braille & Text Converter</h1>
        <Link href="/developers">
          <Button variant="outline" className="mt-4 md:mt-0">
            <Users className="mr-2 h-4 w-4" />
            Developers
          </Button>
        </Link>
      </header>

      <Tabs defaultValue="gesture" className="max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="gesture">
            <HandIcon className="mr-2 h-4 w-4" />
            Gesture Recognition
          </TabsTrigger>
          <TabsTrigger value="text-to-braille">
            <Type className="mr-2 h-4 w-4" />
            Text to Braille
          </TabsTrigger>
          <TabsTrigger value="braille-to-text">
            <Braces className="mr-2 h-4 w-4" />
            Braille to Text
          </TabsTrigger>
          <TabsTrigger value="speech-to-braille">
            <Mic className="mr-2 h-4 w-4" />
            Speech to Braille
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gesture">
          <Card>
            <CardHeader>
              <CardTitle>Hand Gesture Recognition</CardTitle>
              <CardDescription>
                Use your webcam to recognize hand gestures and convert them to braille and text
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GestureRecognition />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text-to-braille">
          <Card>
            <CardHeader>
              <CardTitle>Text to Braille Converter</CardTitle>
              <CardDescription>Convert text to braille representation with audio output</CardDescription>
            </CardHeader>
            <CardContent>
              <TextToBraille />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="braille-to-text">
          <Card>
            <CardHeader>
              <CardTitle>Braille to Text Converter</CardTitle>
              <CardDescription>Convert braille to text with audio output</CardDescription>
            </CardHeader>
            <CardContent>
              <BrailleToText />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="speech-to-braille">
          <Card>
            <CardHeader>
              <CardTitle>Speech to Braille Converter</CardTitle>
              <CardDescription>Convert spoken words to braille representation</CardDescription>
            </CardHeader>
            <CardContent>
              <SpeechToBraille />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
