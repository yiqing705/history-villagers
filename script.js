// 示範題資料由首頁與 3D 島嶼共用；後續題庫可依 knowledge/question-format.md 擴充。
const question = window.demoQuestion;

const options = [...document.querySelectorAll(".quiz-option")];
const feedback = document.querySelector(".quiz-feedback");
const resetButton = document.querySelector(".reset-quiz");
const solutionButton = document.querySelector(".show-solution");
const questionText = document.querySelector(".quiz-question");
let currentHint = "";

questionText.textContent = question.stem;
options.forEach((button) => {
  const key = button.dataset.answer;
  button.lastChild.textContent = ` ${question.options[key]}`;
});

function answerQuestion(event) {
  const button = event.currentTarget;
  const selected = button.dataset.answer;
  const isCorrect = selected === question.answer;

  options.forEach((option) => {
    option.classList.remove("correct", "incorrect");
    option.disabled = true;
  });
  button.classList.add(isCorrect ? "correct" : "incorrect");

  if (isCorrect) {
    feedback.textContent = `答對了！${question.solution}${question.extension}`;
    feedback.className = "quiz-feedback is-correct";
  } else {
    currentHint = question.distractors[selected];
    feedback.textContent = currentHint;
    feedback.className = "quiz-feedback is-incorrect";
    solutionButton.textContent = "看看完整解題思路 ↗";
    solutionButton.setAttribute("aria-expanded", "false");
    solutionButton.hidden = false;
  }
}

function resetQuestion() {
  options.forEach((option) => {
    option.classList.remove("correct", "incorrect");
    option.disabled = false;
  });
  currentHint = "";
  solutionButton.hidden = true;
  solutionButton.setAttribute("aria-expanded", "false");
  solutionButton.textContent = "看看完整解題思路 ↗";
  feedback.textContent = "選一個你覺得最合適的答案吧。";
  feedback.className = "quiz-feedback";
}

solutionButton.addEventListener("click", () => {
  if (solutionButton.getAttribute("aria-expanded") === "true") {
    feedback.textContent = currentHint;
    solutionButton.setAttribute("aria-expanded", "false");
    solutionButton.textContent = "看看完整解題思路 ↗";
    return;
  }

  const correctText = question.options[question.answer];
  feedback.textContent = `${currentHint} 解題思路：${question.solution} 正確選項是「${correctText}」`;
  solutionButton.setAttribute("aria-expanded", "true");
  solutionButton.textContent = "收起完整解題思路 ↑";
});

options.forEach((option) => option.addEventListener("click", answerQuestion));
resetButton.addEventListener("click", resetQuestion);

// 近況回應只在當次頁面互動中顯示，不寫入儲存空間。
const dailyDialogue = document.querySelector(".daily-dialogue");
const replyButtons = [...document.querySelectorAll(".reply-chips button")];
const dailyReplies = {
  happy: "聽起來今天有值得收藏的小亮光呢。謝謝你願意和我分享！",
  tired: "辛苦了。累的時候就先歇一會兒吧，不用急著做任何事。",
  listen: "那我說個小故事吧：我最近試著用新茶煮了一壺，發現慢慢等水滾也挺有意思。",
  skip: "沒問題，我們就一起散散步，安靜地看看海也很好。",
};

replyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    dailyDialogue.textContent = dailyReplies[button.dataset.response];
  });
});
