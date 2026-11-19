// 示範題使用資料物件描述；後續題庫可依 knowledge/question-format.md 擴充。
const question = {
  id: "history-song-civil-service-001",
  resident: "蘇軾",
  subject: "歷史",
  source: { type: "自編示範題", reference: null },
  scope: ["中國史", "宋代", "政治制度"],
  keyPoint: "科舉制度以考試選拔士人，提供入仕管道。",
  stem: "北宋時期，哪一項最能說明「科舉制度」對士人生活的影響？",
  options: {
    a: "士人主要依靠世襲取得官職",
    b: "士人可透過考試取得入仕機會",
    c: "地方官由民間投票選出",
  },
  answer: "b",
  distractors: {
    a: "這個選項把入仕方式說成世襲了。先抓住「科舉」是以考試選拔人才，再比較哪個選項符合這個制度。",
    c: "這個選項提到地方官的產生方式，但不是科舉的核心。先抓住「考試選拔士人」這條線索，再看看哪個選項最符合。",
  },
  solution: "北宋的科舉透過考試選拔士人，擴大讀書人取得官職的管道。",
  extension: "科舉也讓讀書、應試與士大夫階層的形成緊密相連。蘇軾一家有多位文人進入仕途，可以從人物經歷觀察讀書與政治之間的關係。",
};

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
