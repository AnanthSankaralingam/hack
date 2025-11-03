let pageText = '';
let geminiApiKey = '';

// Load API key from storage on startup
chrome.storage.local.get('geminiApiKey', (data) => {
  geminiApiKey = data.geminiApiKey || '';
  console.log('Loaded API key from storage:', geminiApiKey ? 'Key exists' : 'No key found');
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('geminiApiKey', (data) => {
    if (!data.geminiApiKey) {
      chrome.storage.local.set({ geminiApiKey: '' });
    } else {
      geminiApiKey = data.geminiApiKey;
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'openSidePanel':
      if (sender.tab && sender.tab.id) {
        chrome.sidePanel.open({
          tabId: sender.tab.id
        });
      }
      sendResponse({ status: 'Side panel opened' });
      break;

    case 'setPageText':
      pageText = message.text;
      sendResponse({ status: 'Page text received' });
      break;

    case 'getPageText':
      sendResponse({ text: pageText });
      break;

    case 'saveApiKey':
      geminiApiKey = message.key;
      chrome.storage.local.set({ geminiApiKey: message.key }, () => {
        sendResponse({ status: 'API key saved' });
      });
      return true; // Indicate that sendResponse will be called asynchronously

    case 'getApiKey':
      chrome.storage.local.get('geminiApiKey', (data) => {
        geminiApiKey = data.geminiApiKey || '';
        sendResponse({ key: geminiApiKey });
      });
      return true; // Indicate that sendResponse will be called asynchronously

    case 'generateQuiz':
      // Ensure we have the API key from storage
      chrome.storage.local.get('geminiApiKey', (data) => {
        const apiKey = data.geminiApiKey || geminiApiKey;
        if (!apiKey) {
          sendResponse({ error: 'Gemini API key not set. Please set your API key in the extension settings.' });
          return;
        }
        if (!pageText) {
          sendResponse({ error: 'No page text available to generate quiz.' });
          return;
        }
        
        generateQuizWithKey(apiKey, sendResponse);
      });
      return true; // Indicate that sendResponse will be called asynchronously

    default:
      console.warn('Unknown message action:', message.action);
      break;
  }
});

function generateQuizWithKey(apiKey, sendResponse) {
      if (!apiKey) {
        sendResponse({ error: 'Gemini API key not set.' });
        return;
      }
      if (!pageText) {
        sendResponse({ error: 'No page text available to generate quiz.' });
        return;
      }

      // Limit text to avoid hitting token limits and for better focus
      const textForQuiz = pageText.substring(0, 8000); // ~2000 words

      const prompt = `You are a helpful assistant designed to create multiple-choice quizzes.
Based on the following text, generate 3 multiple-choice questions. Each question should have 4 options (A, B, C, D) and clearly indicate the correct answer. The questions should test understanding of the provided text.

Text:
"""
${textForQuiz}
"""

Format the output as a JSON array of objects, where each object has:
- 'question': The question string.
- 'options': An array of 4 option strings.
- 'correctAnswer': The correct option string (e.g., "A", "B", "C", "D").
Ensure the JSON is valid and can be parsed directly.`;

      console.log('Making API request with key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NO KEY');
      
      // Use a known working model - try gemini-1.5-flash first (stable and fast)
      const model = 'gemini-2.5-flash-lite';
      
      fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: 0.7,
          max_tokens: 2000
        })
      })
      .then(response => {
        console.log('Response status:', response.status, response.statusText);
        if (!response.ok) {
          // Try to get error details from response
          return response.text().then(text => {
            console.error('API error response:', text);
            let errorData;
            try {
              errorData = JSON.parse(text);
            } catch (e) {
              errorData = { error: { message: text || `HTTP ${response.status}: ${response.statusText}` } };
            }
            return Promise.reject(errorData);
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Gemini API response:', JSON.stringify(data, null, 2));
        
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          try {
            let content = data.choices[0].message.content;
            // Sometimes the content might be wrapped in code blocks
            if (content.includes('```json')) {
              content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            } else if (content.includes('```')) {
              content = content.replace(/```\n?/g, '').trim();
            }
            const quiz = JSON.parse(content);
            sendResponse({ quiz: quiz });
          } catch (e) {
            console.error('Failed to parse quiz JSON:', e);
            console.error('Raw content:', data.choices[0].message.content);
            sendResponse({ error: 'Failed to parse quiz data from Gemini. Please try again.' });
          }
        } else if (data.error) {
          console.error('Gemini API error:', data.error);
          sendResponse({ error: `Gemini API Error: ${data.error.message || data.error.type || JSON.stringify(data.error)}` });
        } else {
          console.error('Unexpected response structure:', data);
          sendResponse({ error: `Unexpected response from Gemini API: ${JSON.stringify(data)}` });
        }
      })
      .catch(error => {
        console.error('Fetch error:', error);
        console.error('Error type:', typeof error);
        console.error('Error keys:', Object.keys(error || {}));
        console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        
        let errorMessage = 'Unknown error occurred.';
        
        if (error && error.error) {
          // API returned an error object
          const apiError = error.error;
          errorMessage = apiError.message || apiError.reason || apiError.error?.message || JSON.stringify(apiError);
          sendResponse({ error: `Gemini API Error: ${errorMessage}` });
        } else if (error && error.message) {
          // Standard Error object with message
          errorMessage = error.message;
          sendResponse({ error: `Network error: ${errorMessage}` });
        } else if (error) {
          // Try to extract meaningful information from the error
          try {
            const errorStr = JSON.stringify(error, (key, value) => {
              if (value instanceof Error) {
                return value.message;
              }
              return value;
            });
            errorMessage = errorStr.length > 200 ? errorStr.substring(0, 200) + '...' : errorStr;
          } catch (e) {
            // If stringification fails, try to get common error properties
            errorMessage = error.toString && error.toString() !== '[object Object]' 
              ? error.toString() 
              : (error.statusText || error.status || 'Unknown network error');
          }
          sendResponse({ error: `Network error: ${errorMessage}` });
        } else {
          sendResponse({ error: 'Network error: Unknown error occurred. Please check your API key and internet connection.' });
        }
      });
}