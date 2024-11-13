// imports HTML elements for dynamic use
const _question = document.getElementById('question');
const _options = document.querySelector('.quiz-options');
const _checkBtn = document.getElementById('check-answer');
const _playAgainBtn = document.getElementById('play-again');
const _result = document.getElementById('result');
const _correctScore = document.getElementById('correct-score');
const startButton = document.getElementById("start-button");
const categorySelect = document.getElementById("category-select");

// views for showing and hiding
const startView = document.getElementById("start-view");
const quizView = document.querySelector(".wrapper");
const summaryView = document.getElementById("summary-view");

const finalScoreElement = document.getElementById("finalScore");

// arrays holding correct answers to questions
let correctAnswers = [];
// array holding incorrect answers
let incorrectAnswers = [];
// array of questions asked
let questions = [];
// counters for score, asked questions
let correctScore = 0;
let askedCount = 0;
// total questions should always be 10
const totalQuestion = 10;
// the category number related to the category. is 9 unless changed by user (general)
let categoryId = 9;

/*
event listeners for starting the page, buttons, responses
 */
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


/*
loads categories from the API at the start. useful if OpenTDB decides to add new categories or reorder existing ones
temporarily disables the start button after requesting categories to avoid a 429 error (too many calls)
 */
async function loadCategories() {
  const url = "https://opentdb.com/api_category.php";
  startButton.disabled = true;  // disable the Start Quiz button while loading
  
  try {
    const data = await (await fetch(url)).json();
    categorySelect.innerHTML = "";
    
    const categories = data.trivia_categories.filter(category => category.name !== "Any Category");
    categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
    // after timeout user can start quiz
    setTimeout(() => startButton.disabled = false, 1500);
  } catch (error) {
    console.error("Couldn't fetch categories:", error);
  }
}

/*
 loads question from API after a category is selected
 */
async function loadQuestions(categoryId) {
  const url = `https://opentdb.com/api.php?amount=10&category=${categoryId}`; // changes to accommodate different categories
  try {
    const data = await (await fetch(url)).json();
    
    // makes sure all 10 questions come through
    if (data.results && data.results.length === totalQuestion) {
      questions = data.results; // stores the results of the api call into a local array for referencing
      correctAnswers = questions.map(q => q.correct_answer); // maps correct answers into the correctAnswers array
      showQuestion(0); // displays the first question to get it started
    } else {
    }
  } catch (error) {
    console.error("Couldn't fetch questions:", error);
  }
}

/*
 display question and options
 */
function showQuestion(index) {
  
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

/*
options selection
 */
function selectOption() {
  // remove existing event listeners to prevent duplicates
  _options.querySelectorAll('li').forEach(option => {
    option.replaceWith(option.cloneNode(true));
  });
  
  _options.querySelectorAll('li').forEach(option => {
    option.addEventListener('click', function () {
      _options.querySelectorAll('li').forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      _checkBtn.disabled = false;
    });
  });
}

/*
checks the user's answer

 */
function checkAnswer() {
  
  const selectedElement = _options.querySelector('.selected');
  const selectedAnswer = selectedElement.dataset.option;
  const decodedSelectedAnswer = HTMLDecode(selectedAnswer); // checks
  const decodedCorrectAnswer = HTMLDecode(correctAnswers[askedCount]); //
  
  // checks answer
  if (decodedSelectedAnswer === decodedCorrectAnswer) {
    correctScore++;
    _result.innerHTML = `<p><i class="fas fa-check"></i> Correct Answer!</p>`;
  } else { // if incorrect, adds question info to incorrectAnswers array
    incorrectAnswers.push({
      question: questions[askedCount].question,
      userAnswer: decodedSelectedAnswer,
      correctAnswer: decodedCorrectAnswer,
      difficulty: questions[askedCount].difficulty
    });
    _result.innerHTML = `<p><i class="fas fa-times"></i> Incorrect Answer!</p><small><b>Correct Answer: </b>${decodedCorrectAnswer}</small>`;
  }
  
  // increment askedCount and update the score display
  askedCount++;
  _correctScore.textContent = `${correctScore} / ${askedCount}`;
  
  // if there are more questions, keep displaying. otherwise show summary button
  if (askedCount < totalQuestion) {
    _checkBtn.style.display = "none"; // hide the check button
    setTimeout(() => {
      _result.innerHTML = ""; // clear result area
      showQuestion(askedCount); // display the next question
      _checkBtn.style.display = "block"; // reveal the check button
    }, 2200);
  } else {
    // Change button to "See Summary" at the end of the quiz
    _checkBtn.textContent = "See Summary";
    _checkBtn.onclick = showsummaryView; // set up button to show summary
  }
  
}

// converts html entities into normal text to fairly compare answers
function HTMLDecode(textString) {
  let doc = new DOMParser().parseFromString(textString, "text/html");
  return doc.documentElement.textContent;
}

/*
displays the summary page at the end of the game
 */
function showsummaryView() {
  quizView.style.display = "none"; // hide quiz view
  summaryView.style.display = "flex"; // show summary view
  
  // Display final score
  finalScoreElement.textContent = `Final Score: ${correctScore} / ${totalQuestion}`;
  
  // displays the incorrect answers
  const incorrectList = document.getElementById("incorrectList");
  
  incorrectAnswers.forEach((item) => { // iterates over the incorrect question list and adds each question's info
    const questionItem = document.createElement("div");
    questionItem.classList.add("question-item"); // adds classname for css styling
    
    // adds information to each question item
    questionItem.innerHTML = `
      <p><b>Question:</b> ${item.question}</p>
      <p><b>Your Answer:</b> ${item.userAnswer}</p>
      <p><b>Correct Answer:</b> ${item.correctAnswer}</p>
      <p><b>Difficulty:</b> ${item.difficulty}</p>
    `;
    
    incorrectList.appendChild(questionItem); // adds the item to the results view
  });
  
  // gives the user my personal feedback on their capabilities
  const feedback = document.getElementById("feedback");
  if (correctScore > 7) {
    feedback.textContent = "Great job! You really know your stuff!";
  } else if (correctScore > 4) {
    feedback.textContent = "Pretty good! You're getting there.";
  } else if (correctScore > 2) {
    feedback.textContent = "Good effort. Put in some more work.";
  } else {
    feedback.textContent = "Maybe you should try a different category.";
  }
  
  // creates a "Play Again" button that just reloads the page :)
  const playAgainButton = document.getElementById("playAgainButton");
  playAgainButton.onclick = restartQuiz;
}

// reloads the page to play again
function restartQuiz() {
  window.location.reload();
}
