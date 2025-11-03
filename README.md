# 📚 Page Quiz Generator

> **Transform any webpage into an interactive learning experience**

A powerful Chrome extension that generates intelligent multiple-choice quizzes from any webpage content using Google Gemini AI. Master the art of **learning by doing** by testing your understanding instantly after reading.

---

## 🎯 Why Learning by Doing?

Traditional learning often follows a **passive consumption** model: you read, watch, or listen, and hope the information sticks. Research shows that **active recall**—the process of actively retrieving information from memory—is one of the most effective learning techniques.

### The Science Behind It

- **70% Better Retention**: Actively recalling information strengthens neural pathways more than passive review
- **Immediate Feedback**: Learn from mistakes in real-time, not days later
- **Identify Knowledge Gaps**: Discover what you don't know while the content is fresh
- **Build Confidence**: Repeated practice builds mastery and reduces test anxiety

### How This Extension Helps

Instead of just reading an article or watching a video, **Page Quiz Generator** helps you:
1. **Read** the content as usual
2. **Test** yourself immediately with AI-generated questions
3. **Learn** from instant feedback on your answers
4. **Retain** information through active practice

---

## ✨ Features

- 🚀 **Instant Quiz Generation**: Convert any webpage into a quiz in seconds
- 🤖 **AI-Powered**: Uses Google Gemini to create contextually relevant questions
- 📱 **Beautiful UI**: Clean, modern interface in a side panel
- 🎯 **Smart Content Extraction**: Automatically extracts meaningful content from complex pages (including YouTube videos!)
- ✅ **Real-Time Feedback**: See correct/incorrect answers immediately
- 📊 **Score Tracking**: Track your progress as you answer questions
- 🔄 **Reusable**: Generate new quizzes anytime you're on a new page

---

## 🚀 Installation

### Option 1: Load as Unpacked Extension (For Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked**
5. Select the extension folder
6. The extension icon should appear in your toolbar

### Option 2: Install from Chrome Web Store
*Coming soon!*

---

## 📖 How to Use

### Initial Setup

1. **Get Your Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key
   - Copy the key

2. **Configure the Extension**
   - Click the extension icon or press the floating button on any webpage
   - The side panel will open
   - Paste your Gemini API key in the input field
   - Click **Save Key**
   - Your key is stored locally and securely on your device

### Generating Quizzes

1. **Navigate to any webpage** you want to learn from:
   - Articles, blog posts, documentation
   - YouTube videos (extracts title, description, and comments!)
   - Educational content
   - Any page with text content

2. **Click the floating quiz button** (bottom-right corner of the page)
   - The button appears as a circular icon with a lightbulb
   - This extracts the page content

3. **Generate your quiz**
   - In the side panel, click **Generate Quiz**
   - Wait a few seconds while AI creates questions
   - Start answering!

4. **Learn from feedback**
   - Click any option to select your answer
   - See instant visual feedback:
     - ✅ Green checkmark for correct answers
     - ❌ Red X for incorrect answers
   - Track your score in real-time

5. **Review and retake**
   - Navigate between questions with Previous/Next buttons
   - Review your final score
   - Generate a new quiz or retake the same one

---

## 🎓 Use Cases

### For Students
- **Study Smarter**: Generate quizzes from lecture notes or study materials
- **Exam Prep**: Practice with questions similar to your actual tests
- **Concept Reinforcement**: Test understanding after reading chapters

### For Professionals
- **Training Materials**: Create quizzes from documentation or training content
- **Knowledge Validation**: Verify you understood that important article
- **Skill Development**: Practice with technical tutorials and guides

### For Lifelong Learners
- **Online Courses**: Test yourself after watching video lessons
- **Research Papers**: Create quizzes to ensure comprehension
- **News & Articles**: Actively engage with current events and analysis

---

## 🛠️ Technical Details

### Architecture
- **Content Script** (`content.js`): Extracts text from web pages and injects the floating button
- **Background Service Worker** (`background.js`): Handles API communication and message passing
- **Side Panel** (`sidepanel.html/js`): User interface for quiz generation and interaction

### Technologies
- **Chrome Extension Manifest V3**
- **Google Gemini AI API** (OpenAI-compatible endpoint)
- **Vanilla JavaScript** (no frameworks required)
- **Modern CSS** for beautiful styling

### Permissions
- `activeTab`: To extract content from the current tab
- `scripting`: To inject the floating button
- `storage`: To securely store your API key locally
- `sidePanel`: To display the quiz interface

---

## 🔒 Privacy & Security

- **Your API Key**: Stored locally in Chrome's secure storage. Never sent to any server except Google's Gemini API.
- **Page Content**: Extracted content is only sent to Google Gemini for quiz generation. No data is stored or logged.
- **No Tracking**: The extension doesn't collect or transmit any personal information.
- **Open Source**: Full source code available for inspection.

---

## 💡 Tips for Effective Learning

1. **Read First, Then Quiz**: Don't generate the quiz immediately. Read the content fully, then test yourself.
2. **Review Mistakes**: Pay special attention to questions you got wrong—these are your learning opportunities.
3. **Retake Quizzes**: Don't be afraid to retake quizzes to reinforce learning.
4. **Use for Active Reading**: Turn passive browsing into active learning sessions.
5. **Combine with Spaced Repetition**: Generate quizzes on the same topics days later to strengthen retention.

---

## 🐛 Troubleshooting

### Quiz Generation Fails
- **Check API Key**: Ensure your Gemini API key is valid and has available quota
- **Check Page Content**: The page must have sufficient text content (>50 characters)
- **Check Internet Connection**: The extension requires internet access to call the Gemini API

### Button Not Appearing
- Refresh the page
- Check if the site blocks content scripts (some sites do)
- Try a different webpage

### Content Not Extracting Properly
- Some dynamic sites (SPAs) may need a moment to load—wait a few seconds after page load
- For YouTube videos, make sure you're on a video page (not the homepage)

---

**Ready to revolutionize how you learn? Install Page Quiz Generator today and start learning by doing! 🚀**

