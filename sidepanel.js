document.addEventListener('DOMContentLoaded', init);

let geminiApiKey = '';
let pageText = '';
let quizData = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = {}; // Store user's selected answer for each question

// DOM Elements
const apiKeySection = document.getElementById('api-key-section');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyBtn = document.getElementById('save-api-key-btn');
const apiKeyStatus = document.getElementById('api-key-status');

const quizControlsSection = document.getElementById('quiz-controls-section');
const generateQuizBtn = document.getElementById('generate-quiz-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');

const quizDisplaySection = document.getElementById('quiz-display-section');
const questionNumber = document.getElementById('question-number');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const prevQuestionBtn = document.getElementById('prev-question-btn');
const nextQuestionBtn = document.getElementById('next-question-btn');
const scoreDisplay = document.getElementById('score-display');

const quizResultsSection = document.getElementById('quiz-results-section');
const finalScore = document.getElementById('final-score');
const retakeQuizBtn = document.getElementById('retake-quiz-btn');

// Icon paths
const generateIconPath = chrome.runtime.getURL('icons/bulb.png');
const prevIconPath = chrome.runtime.getURL('icons/angle-left.png');
const nextIconPath = chrome.runtime.getURL('icons/angle-right.png');
const refreshIconPath = chrome.runtime.getURL('icons/refresh.png');
const checkIconPath = chrome.runtime.getURL('icons/check.png');
const crossIconPath = chrome.runtime.getURL('icons/cross.png');

function init() {
    // Set icon sources
    document.getElementById('generate-icon').src = generateIconPath;
    document.getElementById('prev-icon').src = prevIconPath;
    document.getElementById('next-icon').src = nextIconPath;
    document.getElementById('refresh-icon').src = refreshIconPath;

    // Event Listeners
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    generateQuizBtn.addEventListener('click', generateQuiz);
    prevQuestionBtn.addEventListener('click', () => navigateQuiz(-1));
    nextQuestionBtn.addEventListener('click', () => navigateQuiz(1));
    retakeQuizBtn.addEventListener('click', resetQuiz);

    // Load API Key and Page Text
    chrome.runtime.sendMessage({ action: 'getApiKey' }, (response) => {
        if (response && response.key) {
            geminiApiKey = response.key;
            apiKeyInput.value = geminiApiKey;
            renderUI();
        }
    });

    chrome.runtime.sendMessage({ action: 'getPageText' }, (response) => {
        if (response && response.text) {
            pageText = response.text;
            renderUI();
        }
    });
}

function renderUI() {
    if (geminiApiKey) {
        apiKeySection.classList.add('hidden');
        quizControlsSection.classList.remove('hidden');
        errorMessage.textContent = '';
        if (!pageText) {
            errorMessage.textContent = 'No page text available. Navigate to a webpage and click the extension button.';
            generateQuizBtn.disabled = true;
        } else {
            generateQuizBtn.disabled = false;
        }
    } else {
        apiKeySection.classList.remove('hidden');
        quizControlsSection.classList.add('hidden');
        quizDisplaySection.classList.add('hidden');
        quizResultsSection.classList.add('hidden');
    }
}

function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (key) {
        chrome.runtime.sendMessage({ action: 'saveApiKey', key: key }, (response) => {
            if (response && response.status) {
                geminiApiKey = key;
                apiKeyStatus.textContent = 'API Key saved successfully!';
                apiKeyStatus.style.color = 'var(--primary-color)';
                setTimeout(() => {
                    apiKeyStatus.textContent = '';
                    renderUI();
                }, 1500);
            }
        });
    } else {
        apiKeyStatus.textContent = 'Please enter a valid API key.';
        apiKeyStatus.style.color = 'var(--error-color)';
    }
}

function generateQuiz() {
    if (!geminiApiKey) {
        errorMessage.textContent = 'Please set your Gemini API key first.';
        return;
    }
    if (!pageText) {
        errorMessage.textContent = 'No page text available. Please navigate to a webpage and click the extension button.';
        return;
    }

    quizControlsSection.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
    errorMessage.textContent = '';
    quizDisplaySection.classList.add('hidden');
    quizResultsSection.classList.add('hidden');

    chrome.runtime.sendMessage({ action: 'generateQuiz' }, (response) => {
        loadingSpinner.classList.add('hidden');
        if (response && response.quiz) {
            quizData = response.quiz;
            currentQuestionIndex = 0;
            score = 0;
            userAnswers = {};
            quizDisplaySection.classList.remove('hidden');
            renderQuestion();
        } else if (response && response.error) {
            errorMessage.textContent = `Error: ${response.error}`;
            quizControlsSection.classList.remove('hidden');
        } else {
            errorMessage.textContent = 'Failed to generate quiz. Please try again.';
            quizControlsSection.classList.remove('hidden');
        }
    });
}

function renderQuestion() {
    if (quizData.length === 0) return;

    const question = quizData[currentQuestionIndex];
    questionNumber.textContent = `Question ${currentQuestionIndex + 1} of ${quizData.length}`;
    questionText.textContent = question.question;
    optionsContainer.innerHTML = '';

    const optionsMap = ['A', 'B', 'C', 'D'];

    question.options.forEach((optionText, index) => {
        const optionLabel = optionsMap[index];
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-item';
        optionDiv.dataset.option = optionLabel;
        optionDiv.innerHTML = `
            <span class="option-label">${optionLabel}.</span>
            <span class="option-text">${optionText}</span>
            <img class="feedback-icon hidden" alt="Feedback">
        `;
        optionDiv.addEventListener('click', () => selectAnswer(optionLabel));
        optionsContainer.appendChild(optionDiv);

        // Restore user's previous selection and feedback if available
        if (userAnswers[currentQuestionIndex] === optionLabel) {
            optionDiv.classList.add('selected');
        }
        if (userAnswers[currentQuestionIndex] !== undefined) {
            applyFeedback(optionDiv, optionLabel, question.correctAnswer);
        }
    });

    updateNavigationButtons();
    updateScoreDisplay();
}

function selectAnswer(selectedOption) {
    const question = quizData[currentQuestionIndex];
    const isCorrect = (selectedOption === question.correctAnswer);

    // If already answered, don't re-evaluate score, just update selection visually
    if (userAnswers[currentQuestionIndex] === undefined) {
        if (isCorrect) {
            score++;
        }
    }
    // If changing answer, adjust score
    else if (userAnswers[currentQuestionIndex] !== selectedOption) {
        if (userAnswers[currentQuestionIndex] === question.correctAnswer) {
            score--; // Previous answer was correct, now it's not
        }
        if (isCorrect) {
            score++; // New answer is correct
        }
    }

    userAnswers[currentQuestionIndex] = selectedOption;

    // Apply visual feedback to all options
    optionsContainer.querySelectorAll('.option-item').forEach(optionDiv => {
        optionDiv.classList.remove('selected', 'correct', 'incorrect');
        optionDiv.querySelector('.feedback-icon').classList.add('hidden');
        const optionLabel = optionDiv.dataset.option;
        if (optionLabel === selectedOption) {
            optionDiv.classList.add('selected');
        }
        applyFeedback(optionDiv, optionLabel, question.correctAnswer);
    });

    updateScoreDisplay();
}

function applyFeedback(optionDiv, optionLabel, correctAnswer) {
    const feedbackIcon = optionDiv.querySelector('.feedback-icon');
    feedbackIcon.classList.remove('hidden');

    if (optionLabel === correctAnswer) {
        optionDiv.classList.add('correct');
        feedbackIcon.src = checkIconPath;
    } else if (optionDiv.classList.contains('selected')) {
        optionDiv.classList.add('incorrect');
        feedbackIcon.src = crossIconPath;
    } else {
        feedbackIcon.classList.add('hidden'); // Hide for unselected incorrect options
    }
}

function updateNavigationButtons() {
    prevQuestionBtn.disabled = currentQuestionIndex === 0;
    nextQuestionBtn.disabled = currentQuestionIndex === quizData.length - 1;

    if (currentQuestionIndex === quizData.length - 1) {
        nextQuestionBtn.textContent = 'Finish Quiz';
        document.getElementById('next-icon').src = checkIconPath; // Change icon to check for finish
    } else {
        nextQuestionBtn.textContent = 'Next';
        document.getElementById('next-icon').src = nextIconPath; // Restore next icon
    }
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score}/${quizData.length}`;
}

function navigateQuiz(direction) {
    if (currentQuestionIndex + direction >= 0 && currentQuestionIndex + direction < quizData.length) {
        currentQuestionIndex += direction;
        renderQuestion();
    } else if (currentQuestionIndex + direction === quizData.length) {
        // User clicked 'Finish Quiz'
        showResults();
    }
}

function showResults() {
    quizDisplaySection.classList.add('hidden');
    quizResultsSection.classList.remove('hidden');
    finalScore.textContent = `${score} / ${quizData.length}`;
}

function resetQuiz() {
    quizData = [];
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = {};
    quizResultsSection.classList.add('hidden');
    quizControlsSection.classList.remove('hidden');
    errorMessage.textContent = '';
    generateQuizBtn.disabled = false;
}