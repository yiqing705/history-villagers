const options = [...document.querySelectorAll(".quiz-option")];
const feedback = document.querySelector(".quiz-feedback");
const resetButton = document.querySelector(".reset-quiz");

const replies = {
  a: {
    correct: false,
    text: "這個選項把入仕方式說成世襲了。想想看：科舉的「舉」字，和選拔人才有什麼關係？北宋時，考試怎麼改變讀書人的機會呢？",
  },
  b: {
    correct: true,
    text: "答對了！科舉讓士人能透過考試取得入仕機會。這也讓讀書、應試與士大夫階層的形成緊密相連；像蘇軾一家，就有好幾位文人進入仕途。",
  },
  c: {
    correct: false,
    text: "這個選項提到了地方官的產生方式，但不是科舉的核心。先抓住「考試選拔士人」這條線索，再看看哪個選項最符合。",
  },
};

function answerQuestion(event) {
  const button = event.currentTarget;
  const reply = replies[button.dataset.answer];
  options.forEach((option) => {
    option.classList.remove("correct", "incorrect");
    option.disabled = true;
  });
  button.classList.add(reply.correct ? "correct" : "incorrect");
  feedback.textContent = reply.text;
  feedback.className = `quiz-feedback ${reply.correct ? "is-correct" : "is-incorrect"}`;
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
