function getPageText() {
    const body = document.body;
    if (!body) return '';

    // Clone the body to avoid modifying the live DOM
    const clone = body.cloneNode(true);

    // For YouTube, try to get the main content area first
    let mainContent = '';
    const isYouTube = window.location.hostname.includes('youtube.com');
    
    if (isYouTube) {
        // Try multiple selectors for video title (YouTube changes these frequently)
        const videoTitleSelectors = [
            'h1.ytd-watch-metadata yt-formatted-string',
            'h1.title.style-scope.ytd-watch-metadata',
            'ytd-watch-metadata h1',
            'h1.ytd-video-primary-info-renderer',
            '#title h1',
            'h1[class*="title"]'
        ];
        for (const selector of videoTitleSelectors) {
            const title = clone.querySelector(selector);
            if (title && title.innerText) {
                mainContent += title.innerText.trim() + ' ';
                break;
            }
        }
        
        // Try multiple selectors for video description
        const descriptionSelectors = [
            '#description-text',
            'ytd-watch-description #description',
            '#watch-description-text',
            'ytd-expander #description',
            '#description-inline-expander',
            '#description-in-content'
        ];
        for (const selector of descriptionSelectors) {
            const desc = clone.querySelector(selector);
            if (desc && desc.innerText) {
                mainContent += desc.innerText.trim() + ' ';
                break;
            }
        }
        
        // Try to get transcript
        const transcript = clone.querySelector('ytd-transcript-renderer, #segments-container');
        if (transcript && transcript.innerText) {
            mainContent += transcript.innerText.trim() + ' ';
        }
        
        // Get metadata like channel name, views, etc.
        const metadata = clone.querySelector('ytd-channel-name, #owner-sub-count, ytd-video-meta-block');
        if (metadata && metadata.innerText) {
            mainContent += metadata.innerText.trim() + ' ';
        }
        
        // Also get comments and other text
        const commentsSection = clone.querySelector('#comments, ytd-comments, #comment-section');
        if (commentsSection) {
            // Get first few comments
            const comments = commentsSection.querySelectorAll('ytd-comment-renderer, ytd-comment-thread-renderer, #comment-content');
            comments.forEach((comment, index) => {
                if (index < 5) { // Limit to first 5 comments
                    const commentText = comment.innerText;
                    if (commentText && commentText.length > 10) {
                        mainContent += commentText.trim() + ' ';
                    }
                }
            });
        }
    }

    // Remove script, style, and other non-content elements that are not relevant for text extraction
    // Less aggressive removal for YouTube to preserve content
    const elementsToRemove = clone.querySelectorAll('script, style, noscript, svg, img, video, audio, iframe, canvas, .quiz-generator-button-container, [role="dialog"]');
    elementsToRemove.forEach(el => el.remove());

    // Get text content, normalize whitespace
    let text = mainContent || clone.innerText || '';
    text = text.replace(/\s+/g, ' ').trim(); // Replace multiple spaces/newlines with single space
    
    // If we got minimal text and it's YouTube, try a more comprehensive extraction
    if (isYouTube && text.length < 100) {
        // Fallback: get all text but remove very short isolated text (likely UI elements)
        const allTextElements = clone.querySelectorAll('*');
        let fallbackText = '';
        allTextElements.forEach(el => {
            const elText = el.innerText;
            // Only include text that's likely to be meaningful content (longer than 20 chars or in specific containers)
            if (elText && elText.length > 20) {
                fallbackText += elText + ' ';
            }
        });
        text = fallbackText.replace(/\s+/g, ' ').trim();
    }
    
    return text;
}

function createFloatingButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'quiz-generator-button-container';
    buttonContainer.className = 'quiz-generator-button-container';
    buttonContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 999px;
        background: linear-gradient(135deg, #818cf8, #6366f1);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.18);
    `;

    const buttonIcon = document.createElement('img');
    buttonIcon.src = chrome.runtime.getURL('icons/bulb.png');
    buttonIcon.alt = 'Generate Quiz';
    buttonIcon.style.cssText = `
        width: 28px;
        height: 28px;
        filter: invert(1);
    `;

    buttonContainer.appendChild(buttonIcon);

    buttonContainer.onmouseover = () => {
        buttonContainer.style.transform = 'translateY(-2px) scale(1.05)';
        buttonContainer.style.boxShadow = '0 12px 20px rgba(0, 0, 0, 0.3), 0 6px 8px rgba(0, 0, 0, 0.15)';
    };
    buttonContainer.onmouseout = () => {
        buttonContainer.style.transform = 'translateY(0) scale(1)';
        buttonContainer.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1)';
    };
    buttonContainer.onmousedown = () => {
        buttonContainer.style.transform = 'scale(0.95)';
    };
    buttonContainer.onmouseup = () => {
        buttonContainer.style.transform = 'translateY(-2px) scale(1.05)';
    };

    buttonContainer.onclick = () => {
        // Open side panel immediately while we have the user gesture
        chrome.runtime.sendMessage({ action: 'openSidePanel' });
        
        // Then extract and send text asynchronously
        (async () => {
            // Wait a bit for dynamic content to load (especially for SPAs like YouTube)
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Try multiple times to get content (for dynamically loaded pages)
            let text = getPageText();
            let attempts = 0;
            while ((!text || text.length < 50) && attempts < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                text = getPageText();
                attempts++;
            }
            
            console.log('Extracted page text length:', text ? text.length : 0);
            
            if (!text || text.length < 50) {
                console.warn('Minimal text extracted from page. Page might still be loading.');
            }
            
            chrome.runtime.sendMessage({ action: 'setPageText', text: text || '' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending page text:", chrome.runtime.lastError);
                } else {
                    console.log('Page text sent:', response?.status || 'success');
                }
            });
        })();
    };

    document.body.appendChild(buttonContainer);
}

// Wait for page to be ready, especially for SPAs like YouTube
function initExtension() {
    if (document.body && !document.getElementById('quiz-generator-button-container')) {
        createFloatingButton();
        
        // For YouTube specifically, also listen for navigation changes (since it's an SPA)
        if (window.location.hostname.includes('youtube.com')) {
            // Listen for YouTube navigation (they use pushState)
            let lastUrl = location.href;
            new MutationObserver(() => {
                const url = location.href;
                if (url !== lastUrl) {
                    lastUrl = url;
                    // Content changed, button should still be there but content extraction will work on next click
                    console.log('YouTube navigation detected');
                }
            }).observe(document, { subtree: true, childList: true });
        }
    } else if (!document.body) {
        // Wait for body to be ready
        setTimeout(initExtension, 100);
    }
}

// Try to initialize immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExtension);
} else {
    initExtension();
}