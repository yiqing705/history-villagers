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
const questionText = document.querySelector(".quiz-question");

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
    const correctText = question.options[question.answer];
    feedback.textContent = `${question.distractors[selected]} 解題思路：${question.solution} 正確選項是「${correctText}」`;
    feedback.className = "quiz-feedback is-incorrect";
  }
}

function resetQuestion() {
  options.forEach((option) => {
    option.classList.remove("correct", "incorrect");
    option.disabled = false;
  });
  feedback.textContent = "選一個你覺得最合適的答案吧。";
  feedback.className = "quiz-feedback";
}

options.forEach((option) => option.addEventListener("click", answerQuestion));
resetButton.addEventListener("click", resetQuestion);
