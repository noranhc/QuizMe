const _question = document.getElementById('question');
const _options = document.querySelector('.quiz-options');
const _checkBtn = document.getElementById('check-answer');
const _playAgainBtn = document.getElementById('play-again');
const _result = document.getElementById('result');
const _correctScore = document.getElementById('correct-score');
const startButton = document.getElementById("start-button");
const categorySelect = document.getElementById("category-select");
const startView = document.getElementById("start-view");
const quizView = document.querySelector(".wrapper");

let correctAnswers = [], userAnswers = [], questions = [], correctScore = 0, askedCount = 0, totalQuestion = 10;
let incorrectAnswers = [];
let categoryId = 9;  // default category (general)

// event listeners

//
document.addEventListener('DOMContentLoaded', function () {
  loadCategories();
  
  // start button listener
  startButton.addEventListener("click", () => {
    categoryId = categorySelect.value;
    loadQuestions(categoryId);
    
    // transitions from start to quiz view
    startView.style.display = "none";
    quizView.style.display = "block";
    _correctScore.textContent = `${correctScore} / ${askedCount}`;
  });
  
  // event listener for the "Check Answer" button
  _checkBtn.addEventListener('click', checkAnswer);
  
  // event listener for the "Play Again" button
  _playAgainBtn.addEventListener('click', restartQuiz);
});

// loads categories from the API
async function loadCategories() {
  const url = "https://opentdb.com/api_category.php";
  startButton.disabled = true;  // Disable the Start Quiz button while loading
  
  try {
    const result = await fetch(url);
    const data = await result.json();
    categorySelect.innerHTML = "";
    
    const categories = data.trivia_categories.filter(category => category.name !== "Any Category");
    categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
    
    setTimeout(() => startButton.disabled = false, 1500); // Enable after loading
    
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
}


// load question from API
async function loadQuestions(categoryId) {
  const url = `https://opentdb.com/api.php?amount=10&category=${categoryId}`;
  try {
    const result = await fetch(url);
    const data = await result.json();
    
    // Reset arrays and validate data fetching
    if (data.results && data.results.length === totalQuestion) {
      questions = data.results;
      correctAnswers = questions.map(q => q.correct_answer);
      userAnswers = Array(totalQuestion).fill(null); // Initialize answers array with null
      
      _result.innerHTML = ""; // Clear any previous result messages
      showQuestion(0); // Start displaying the first question
    } else {
      _result.innerHTML = "<p>Error loading questions. Please try again later.</p>";
    }
  } catch (error) {
    console.error("Error fetching questions:", error);
    _result.innerHTML = "<p>Unable to load questions. Please check your connection.</p>";
  }
}

// display question and options
function showQuestion(index) {
  
  if (index >= totalQuestion || !questions[index]) {
    displayResults();
    return;
  }
  
  const data = questions[index];
  _question.innerHTML = `${data.question} <br> <span class="category">${data.category}</span>`;
  
  let optionsList = [...data.incorrect_answers];
  optionsList.splice(Math.floor(Math.random() * (optionsList.length + 1)), 0, data.correct_answer);
  _options.innerHTML = optionsList.map((option, idx) => `
    <li data-index="${index}" data-option="${option}">${idx + 1}. <span>${option}</span></li>
  `).join('');
  
  selectOption();
  _checkBtn.disabled = true;
}

// options selection
function selectOption() {
  // Remove any existing event listeners to prevent duplicates
  _options.querySelectorAll('li').forEach(option => {
    option.replaceWith(option.cloneNode(true)); // Clear listeners
  });
  
  _options.querySelectorAll('li').forEach(option => {
    option.addEventListener('click', function () {
      _options.querySelectorAll('li').forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      _checkBtn.disabled = false;
    });
  });
}

// checks answer
function checkAnswer() {
  if (askedCount >= totalQuestion) {
    showSummaryPage();
    return;
  }
  
  const selectedElement = _options.querySelector('.selected');
  
  if (selectedElement) {
    const selectedAnswer = selectedElement.dataset.option;
    const decodedSelectedAnswer = HTMLDecode(selectedAnswer);
    const decodedCorrectAnswer = HTMLDecode(correctAnswers[askedCount]);
    
    if (decodedSelectedAnswer === decodedCorrectAnswer) {
      correctScore++;
      _result.innerHTML = `<p><i class="fas fa-check"></i> Correct Answer!</p>`;
    } else {
      incorrectAnswers.push({
        question: questions[askedCount].question,
        userAnswer: decodedSelectedAnswer,
        correctAnswer: decodedCorrectAnswer,
        difficulty: questions[askedCount].difficulty
      });
      _result.innerHTML = `<p><i class="fas fa-times"></i> Incorrect Answer!</p><small><b>Correct Answer: </b>${decodedCorrectAnswer}</small>`;
    }
    
    _checkBtn.disabled = true; // Disable button after answer check
    
    // Increment askedCount and update the score display
    askedCount++;
    _correctScore.textContent = `${correctScore} / ${askedCount}`;
    
    if (askedCount < totalQuestion) {
      setTimeout(() => {
        _result.innerHTML = ""; // Clear result for next question
        showQuestion(askedCount); // Display the next question
      }, 2000);
    } else {
      // Change button to "See Summary" at the end of the quiz
      _checkBtn.textContent = "See Summary";
      _checkBtn.onclick = showSummaryPage; // Set up button to show summary
      _checkBtn.disabled = false; // Enable button for the summary
    }
  } else {
    _result.innerHTML = `<p><i class="fas fa-question"></i> Please select an option!</p>`;
  }
}


// displays the results of
function displayResults() {
  _result.innerHTML = `<p>Your score is ${correctScore} out of ${totalQuestion}.</p>`;
  _playAgainBtn.style.display = "block";
  _checkBtn.style.display = "none";  // Hide check answer button after the quiz ends
}


// to convert html entities into normal text of correct answer if there is any
function HTMLDecode(textString) {
  let doc = new DOMParser().parseFromString(textString, "text/html");
  return doc.documentElement.textContent;
}


// displays the summary page at the end of the game
function showSummaryPage() {
  // Hide quiz view and show summary page
  quizView.style.display = "none";
  const summaryPage = document.getElementById("summaryPage");
  summaryPage.style.display = "flex"; // Show summary page
  
  // Display final score
  const finalScoreElement = document.getElementById("finalScore");
  finalScoreElement.textContent = `Final Score: ${correctScore} / ${totalQuestion}`;
  
  // Populate incorrect answers
  const incorrectList = document.getElementById("incorrectList");
  incorrectList.innerHTML = ""; // Clear previous content if any
  
  incorrectAnswers.forEach((item) => {
    const questionItem = document.createElement("div");
    questionItem.classList.add("question-item");
    
    questionItem.innerHTML = `
      <p><b>Question:</b> ${item.question}</p>
      <p><b>Your Answer:</b> ${item.userAnswer}</p>
      <p><b>Correct Answer:</b> ${item.correctAnswer}</p>
      <p><b>Difficulty:</b> ${item.difficulty}</p>
    `;
    
    incorrectList.appendChild(questionItem);
  });
  
  // Setup "Play Again" button
  const playAgainButton = document.getElementById("playAgainButton");
  playAgainButton.onclick = restartQuiz;
}

// resets values to their starting amounts
function restartQuiz() {
  // Reset all game data to initial state
  window.location.reload();
}
