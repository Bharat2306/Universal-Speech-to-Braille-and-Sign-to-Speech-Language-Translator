# 🧠 Braille & Sign Language Translator

A real-time accessibility application that converts between **Text**, **Speech**, **Braille**, and **Camera Gestures**. This project empowers visually and hearing-impaired individuals by offering seamless multimodal communication tools.

🔗 **Live Demo**: [https://v0-hand-gesture-recognition-one.vercel.app/](https://v0-hand-gesture-recognition-one.vercel.app/)

---

## 📁 Project Structure

📦braille-translator
├── 📁 app
│ ├── developers.tsx # Developer info or credits page
│ ├── globals.css # Global CSS styles
│ ├── layout.tsx # Application layout wrapper
│ ├── page.tsx # Main landing page
├── 📁 components
│ ├── braille-to-text.tsx # Converts Braille input to text
│ ├── gesture-recognition.tsx # Detects hand gestures via webcam
│ ├── speech-to-braille.tsx # Converts spoken input to Braille
│ ├── text-to-braille.tsx # Converts text to Braille output
│ ├── theme-provider.tsx # Theme configuration and context
├── 📁 hooks
│ ├── use-mobile.tsx # Hook for mobile responsiveness
│ ├── use-toast.ts # Toast/notification handler
├── 📁 lib
│ ├── braille-utils.ts # Core logic for Braille encoding/decoding
│ ├── common-words.ts # Frequently used words in Braille
│ ├── utils.ts # General utility functions
├── 📁 public # Static assets
├── 📁 styles # Project-wide CSS and styling
├── .gitignore
├── components.json
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json




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
npm install

# Run the development server
npm run dev

🙌 Contribution Guide
Contributions are welcome! If you'd like to contribute, fork the repository and create a pull request.

👨‍💻 Developed By
Built with ❤️ by developers who care about inclusive technology and accessibility for all.
