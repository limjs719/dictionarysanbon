
class VocabularyApp {
  constructor() {
    this.vocabularyKey = 'englishVocabulary';
    this.currentQuiz = null;
    this.quizScore = { correct: 0, total: 0 };
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadVocabulary();
  }

  bindEvents() {
    const searchBtn = document.getElementById('searchBtn');
    const wordInput = document.getElementById('wordInput');
    const clearBtn = document.getElementById('clearBtn');
    const vocabularyToggleBtn = document.getElementById('vocabularyToggleBtn');
    const quizBtn = document.getElementById('quizBtn');

    searchBtn.addEventListener('click', () => this.searchWord());
    wordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchWord();
      }
    });
    clearBtn.addEventListener('click', () => this.clearVocabulary());
    vocabularyToggleBtn.addEventListener('click', () => this.toggleVocabulary());
    quizBtn.addEventListener('click', () => this.startQuiz());
  }

  async searchWord() {
    const wordInput = document.getElementById('wordInput');
    const word = wordInput.value.trim().toLowerCase();
    
    if (!word) {
      alert('단어를 입력해주세요!');
      return;
    }

    const resultDiv = document.getElementById('wordResult');
    resultDiv.innerHTML = '<div class="loading">검색 중...</div>';

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      
      if (!response.ok) {
        throw new Error('단어를 찾을 수 없습니다.');
      }

      const data = await response.json();
      this.displayWordResult(data[0]);
      wordInput.value = '';
    } catch (error) {
      resultDiv.innerHTML = `<div class="error">${error.message}</div>`;
    }
  }

  displayWordResult(wordData) {
    const resultDiv = document.getElementById('wordResult');
    const word = wordData.word;
    const phonetics = wordData.phonetics.find(p => p.text) || {};
    const meanings = wordData.meanings;
    
    // Store current word data for saving
    this.currentWordData = wordData;

    let html = `
      <div class="word-item">
        <div class="word-title">${word}</div>
        ${phonetics.text ? `<div class="phonetic">${phonetics.text}</div>` : ''}
    `;

    meanings.forEach(meaning => {
      html += `
        <div class="meaning">
          <div class="part-of-speech">${meaning.partOfSpeech}</div>
      `;
      
      meaning.definitions.slice(0, 3).forEach(def => {
        html += `<div class="definition">• ${def.definition}</div>`;
        if (def.example) {
          html += `<div class="example">예: ${def.example}</div>`;
        }
      });
      
      html += '</div>';
    });

    html += `
        <button class="save-btn" data-word="${word}" ${this.isWordSaved(word) ? 'disabled' : ''}>${this.isWordSaved(word) ? '이미 저장됨' : '단어장에 저장'}</button>
      </div>
    `;

    resultDiv.innerHTML = html;
    
    // Add event listener to save button
    const saveBtn = resultDiv.querySelector('.save-btn');
    if (saveBtn && !saveBtn.disabled) {
      saveBtn.addEventListener('click', () => this.saveWord(word, this.currentWordData));
    }
  }

  saveWord(word, wordData) {
    let vocabulary = this.getVocabulary();
    
    if (vocabulary.some(item => item.word === word)) {
      alert('이미 저장된 단어입니다!');
      return;
    }

    vocabulary.push(wordData);
    localStorage.setItem(this.vocabularyKey, JSON.stringify(vocabulary));
    this.loadVocabulary();
    
    // Update the save button
    const saveBtn = document.querySelector('.save-btn[data-word="' + word + '"]');
    if (saveBtn) {
      saveBtn.textContent = '저장됨!';
      saveBtn.style.background = '#6c757d';
      saveBtn.disabled = true;
    }
    
    alert('단어가 단어장에 저장되었습니다!');
  }

  removeWord(word) {
    if (confirm(`"${word}"를 단어장에서 삭제하시겠습니까?`)) {
      let vocabulary = this.getVocabulary();
      vocabulary = vocabulary.filter(item => item.word !== word);
      localStorage.setItem(this.vocabularyKey, JSON.stringify(vocabulary));
      this.loadVocabulary();
    }
  }

  clearVocabulary() {
    if (confirm('모든 단어를 삭제하시겠습니까?')) {
      localStorage.removeItem(this.vocabularyKey);
      this.loadVocabulary();
    }
  }

  toggleVocabulary() {
    const vocabularySection = document.getElementById('vocabularySection');
    const toggleBtn = document.getElementById('vocabularyToggleBtn');
    
    if (vocabularySection.style.display === 'none') {
      vocabularySection.style.display = 'block';
      toggleBtn.textContent = '단어장 숨기기';
      toggleBtn.classList.add('active');
    } else {
      vocabularySection.style.display = 'none';
      toggleBtn.textContent = '단어장';
      toggleBtn.classList.remove('active');
    }
  }

  getVocabulary() {
    const vocabulary = localStorage.getItem(this.vocabularyKey);
    return vocabulary ? JSON.parse(vocabulary) : [];
  }

  isWordSaved(word) {
    const vocabulary = this.getVocabulary();
    return vocabulary.some(item => item.word === word);
  }

  loadVocabulary() {
    const vocabulary = this.getVocabulary();
    const vocabularyList = document.getElementById('vocabularyList');
    const quizBtn = document.getElementById('quizBtn');

    // 퀴즈 버튼 활성화/비활성화
    if (vocabulary.length < 2) {
      quizBtn.disabled = true;
      quizBtn.textContent = vocabulary.length === 0 ? '퀴즈 (단어를 저장하세요)' : '퀴즈 (2개 이상 필요)';
    } else {
      quizBtn.disabled = false;
      quizBtn.textContent = '퀴즈';
    }

    if (vocabulary.length === 0) {
      vocabularyList.innerHTML = '<p style="text-align: center; color: #666;">저장된 단어가 없습니다.</p>';
      return;
    }

    let html = '';
    vocabulary.forEach(wordData => {
      const word = wordData.word;
      const phonetics = wordData.phonetics.find(p => p.text) || {};
      const firstMeaning = wordData.meanings[0];
      const firstDefinition = firstMeaning.definitions[0];

      html += `
        <div class="word-item">
          <div class="word-title">${word}</div>
          ${phonetics.text ? `<div class="phonetic">${phonetics.text}</div>` : ''}
          <div class="meaning">
            <div class="part-of-speech">${firstMeaning.partOfSpeech}</div>
            <div class="definition">• ${firstDefinition.definition}</div>
            ${firstDefinition.example ? `<div class="example">예: ${firstDefinition.example}</div>` : ''}
          </div>
          <button class="remove-btn" onclick="vocabularyApp.removeWord('${word}')">삭제</button>
        </div>
      `;
    });

    vocabularyList.innerHTML = html;
  }

  startQuiz() {
    const vocabulary = this.getVocabulary();
    if (vocabulary.length < 2) {
      alert('퀴즈를 시작하려면 최소 2개 이상의 단어가 필요합니다.');
      return;
    }

    this.quizScore = { correct: 0, total: 0 };
    this.showQuizSection();
    this.generateQuizQuestion();
  }

  showQuizSection() {
    const quizSection = document.getElementById('quizSection');
    const vocabularySection = document.getElementById('vocabularySection');
    
    // 다른 섹션 숨기기
    vocabularySection.style.display = 'none';
    document.getElementById('vocabularyToggleBtn').textContent = '단어장';
    document.getElementById('vocabularyToggleBtn').classList.remove('active');
    
    // 퀴즈 섹션 보이기
    quizSection.style.display = 'block';
  }

  generateQuizQuestion() {
    const vocabulary = this.getVocabulary();
    const randomIndex = Math.floor(Math.random() * vocabulary.length);
    const selectedWord = vocabulary[randomIndex];
    
    this.currentQuiz = {
      word: selectedWord.word,
      definition: selectedWord.meanings[0].definitions[0].definition,
      partOfSpeech: selectedWord.meanings[0].partOfSpeech
    };

    const quizContent = document.getElementById('quizContent');
    quizContent.innerHTML = `
      <div class="quiz-score">점수: ${this.quizScore.correct}/${this.quizScore.total}</div>
      <div class="quiz-question">
        <strong>${this.currentQuiz.partOfSpeech}</strong><br><br>
        "${this.currentQuiz.definition}"<br><br>
        이 뜻에 해당하는 영어 단어는?
      </div>
      <input type="text" id="quizAnswer" class="quiz-input" placeholder="단어를 입력하세요" />
      <br>
      <button id="quizSubmit" class="quiz-submit">정답 확인</button>
      <button id="quizEnd" class="quiz-next" onclick="vocabularyApp.endQuiz()">퀴즈 종료</button>
      <div id="quizResult" class="quiz-result" style="display: none;"></div>
    `;

    document.getElementById('quizAnswer').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.checkAnswer();
      }
    });

    document.getElementById('quizSubmit').addEventListener('click', () => this.checkAnswer());
    document.getElementById('quizAnswer').focus();
  }

  checkAnswer() {
    const userAnswer = document.getElementById('quizAnswer').value.trim().toLowerCase();
    const correctAnswer = this.currentQuiz.word.toLowerCase();
    const resultDiv = document.getElementById('quizResult');
    
    this.quizScore.total++;
    
    if (userAnswer === correctAnswer) {
      this.quizScore.correct++;
      resultDiv.innerHTML = `
        <div class="correct">
          정답입니다! 🎉<br>
          <strong>"${this.currentQuiz.word}"</strong>
        </div>
      `;
      resultDiv.className = 'quiz-result correct';
    } else {
      resultDiv.innerHTML = `
        <div class="incorrect">
          틀렸습니다. 😢<br>
          정답: <strong>"${this.currentQuiz.word}"</strong><br>
          ${userAnswer ? `입력한 답: "${userAnswer}"` : ''}
        </div>
      `;
      resultDiv.className = 'quiz-result incorrect';
    }
    
    resultDiv.style.display = 'block';
    
    // 버튼 변경
    const quizContent = document.getElementById('quizContent');
    const submitBtn = document.getElementById('quizSubmit');
    submitBtn.outerHTML = '<button id="quizNext" class="quiz-next">다음 문제</button>';
    
    document.getElementById('quizNext').addEventListener('click', () => {
      this.generateQuizQuestion();
    });
  }

  endQuiz() {
    const quizSection = document.getElementById('quizSection');
    const accuracy = this.quizScore.total > 0 ? Math.round((this.quizScore.correct / this.quizScore.total) * 100) : 0;
    
    alert(`퀴즈 종료!\n총 ${this.quizScore.total}문제 중 ${this.quizScore.correct}문제 정답\n정답률: ${accuracy}%`);
    
    quizSection.style.display = 'none';
    this.currentQuiz = null;
    this.quizScore = { correct: 0, total: 0 };
  }
}

// 앱 초기화
const vocabularyApp = new VocabularyApp();
