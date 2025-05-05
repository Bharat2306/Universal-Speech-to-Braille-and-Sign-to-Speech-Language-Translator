import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Github, Linkedin, Mail } from "lucide-react"

export default function DevelopersPage() {
  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex items-center mb-8">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to App
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Development Team</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/aryanshi.jpg" alt="Bharat" />
                <AvatarFallback>BB</AvatarFallback>
              </Avatar>
              
              <div>
                <CardTitle>Aryanshi Rana</CardTitle>
                <CardDescription>Team Leader</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
            “No one can whistle a symphony. It takes a whole orchestra to play it.” -HE Luccock “Teamwork makes the dream work.” – Bang Gae “It is literally true that you can succeed best and quickest by helping others to succeed.” – Napoleon Hill “A leader must inspire, or his team will expire.”
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon">
                <Github className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/bharat rana.jpg" alt="Bharat" />
                <AvatarFallback>BB</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Bharat Rana</CardTitle>
                <CardDescription>Web Developer</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
            “Web development is the art of turning ideas into digital experiences that shape the world.” – Unknown “In the world of web development, there are no limits to what you can create. The only limit is your imagination.” – Unknown
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon">
                <Github className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/jamuun.jpg" alt="Bharat" />
                <AvatarFallback>BB</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Bhavya</CardTitle>
                <CardDescription>Backend Developer</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
            "We build our computer (systems) the way we build our cities: over time, without a plan, on top of ruins." - Ellen Ullman "Every great developer you know got there by solving problems they were unqualified to solve until they actually did it." - Patrick McKenzie
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon">
                <Github className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/jamun.jpg" alt="Bhavaya" />
                <AvatarFallback>BH</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Awanish</CardTitle>
                <CardDescription>UI/UX Designer & Developer</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
            “People ignore design that ignores people.” — Frank Chimero, Designer Good UX design is all about putting the user first. Any aspect of a website, app or software that doesn’t consider the user’s needs is ultimately doomed to fail.
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon">
                <Github className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>About the Project</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              This application was developed to bridge the gap between different forms of communication, particularly
              focusing on accessibility for individuals with visual or hearing impairments. The project combines
              computer vision, speech recognition, and braille conversion technologies to create a comprehensive
              communication tool.
            </p>
            <p className="mt-4">
              The application features hand gesture recognition, text-to-braille conversion, braille-to-text conversion,
              and speech-to-braille functionality. It aims to make communication more accessible and inclusive for
              everyone.
            </p>
            <p className="mt-4">
              Technologies used: TensorFlow.js, Web Speech API, React, Next.js, and various accessibility standards for
              braille representation.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
