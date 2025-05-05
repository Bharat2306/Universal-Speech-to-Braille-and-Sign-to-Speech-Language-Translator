# 🧠 Braille & Sign Language Translator

A real-time accessibility application that converts between **Text**, **Speech**, **Braille**, and **Camera Gestures**. This project empowers visually and hearing-impaired individuals by offering seamless multimodal communication tools.

🔗 **Live Demo**: [Brallie](https://v0-hand-gesture-recognition-one.vercel.app/)

---

## 📁 Project Structure

📦braille-translator
📦 braille-translator
├── 📁 app
│ ├── developers.tsx # Developer info page
│ ├── globals.css # Global CSS styles
│ ├── layout.tsx # App layout component
│ └── page.tsx # Landing page
├── 📁 components
│ ├── braille-to-text.tsx # Braille to Text converter
│ ├── gesture-recognition.tsx # Gesture recognition via webcam
│ ├── speech-to-braille.tsx # Speech to Braille converter
│ ├── text-to-braille.tsx # Text to Braille converter
│ └── theme-provider.tsx # Theme context provider
├── 📁 hooks
│ ├── use-mobile.tsx # Hook for mobile responsiveness
│ └── use-toast.ts # Hook for toast notifications
├── 📁 lib
│ ├── braille-utils.ts # Braille encoding/decoding logic
│ ├── common-words.ts # Frequently used Braille words
│ └── utils.ts # Utility functions
├── 📁 public # Static assets (icons, images)
├── 📁 styles # Global and Tailwind styles
├── .gitignore
├── components.json
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json




---

## 🌐 Tech Stack

- **Framework**: Next.js (React)
- **Languages**: TypeScript, CSS
- **Styling**: Tailwind CSS
- **Speech Recognition**: Web Speech API
- **Gesture Recognition**: TensorFlow.js or MediaPipe (in `gesture-recognition.tsx`)
- **Deployment**: Vercel

---

## 💡 Features Overview

| Feature              | Description                                                  |
|---------------------|--------------------------------------------------------------|
| 📝 Text to Braille   | Converts user-typed text into standard Braille format         |
| 🔡 Braille to Text   | Inputs Braille and decodes it into readable text             |
| 🎤 Speech to Braille | Uses speech recognition to generate Braille output           |
| ✋ Gesture to Braille | Recognizes hand signs via webcam and translates to Braille   |

---

## 🚀 Getting Started

To run the app locally:

```bash
# Clone the repository
git clone https://github.com/YourUsername/your-repo-name.git

# Navigate to the project directory
cd braille-translator

# Install dependencies

npm install --legacy-peer-deps

# Run the development server
npm run dev

🙌 Contribution Guide
Contributions are welcome! If you'd like to contribute, fork the repository and create a pull request.

👨‍💻 Developed By
Built with ❤️ by developers who care about inclusive technology and accessibility for all.
