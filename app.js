// Kotoba Booster - Application Logic

// ==========================================================================
// 1. STATE & CONSTANTS
// ==========================================================================

let vocabList = [];
let historyStack = [];
let historyIndex = -1;
let currentIndex = -1;

// Chapter Filter State
let activeChapterFilter = "all";
let pdfParsedChapters = {}; // Cache for pdf parser wizard

// Configure PDF.js worker
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
}

// Playback variables
let isPlaying = true;
let playSpeed = 1000; // default 1000ms (1 second)
let isRandom = true;
let autoTTS = false;

// Animation timer variables
let progressAnimId = null;
let lastTickTime = 0;
let progressAccumulated = 0;

// Speech Synthesis
const synth = window.speechSynthesis;
let voices = [];
let jpVoice = null;

// Preset Vocabulary List (N5/N4 starters)
const presetVocabulary = [
  { kanji: "先生", hiragana: "せんせい", hanviet: "TIÊN SINH", meaning: "Thầy cô giáo" },
  { kanji: "学生", hiragana: "がくせい", hanviet: "HỌC SINH", meaning: "Học sinh, sinh viên" },
  { kanji: "日本語", hiragana: "にほんご", hanviet: "NHẬT BẢN NGỮ", meaning: "Tiếng Nhật" },
  { kanji: "勉強", hiragana: "べんきょう", hanviet: "MIỄN CƯỠNG", meaning: "Học tập, học hành" },
  { kanji: "食べる", hiragana: "たべる", hanviet: "THỰC", meaning: "Ăn" },
  { kanji: "飲む", hiragana: "のむ", hanviet: "ẨM", meaning: "Uống" },
  { kanji: "読む", hiragana: "よむ", hanviet: "ĐỘC", meaning: "Đọc" },
  { kanji: "書く", hiragana: "かく", hanviet: "THƯ", meaning: "Viết" },
  { kanji: "聞く", hiragana: "きく", hanviet: "VĂN", meaning: "Nghe" },
  { kanji: "行く", hiragana: "いく", hanviet: "HÀNH", meaning: "Đi" },
  { kanji: "来る", hiragana: "くる", hanviet: "LA", meaning: "Đến" },
  { kanji: "友達", hiragana: "ともだち", hanviet: "HỮU ĐẠT", meaning: "Bạn bè" },
  { kanji: "家族", hiragana: "かいしゃ", hanviet: "GIA TỘC", meaning: "Gia đình" },
  { kanji: "会社員", hiragana: "かいしゃいん", hanviet: "HỘI XÃ VIÊN", meaning: "Nhân viên công ty" },
  { kanji: "自動車", hiragana: "じどうしゃ", hanviet: "TỰ ĐỘNG XA", meaning: "Ô tô, xe hơi" },
  { kanji: "電話", hiragana: "でんわ", hanviet: "ĐIỆN THOẠI", meaning: "Điện thoại" },
  { kanji: "教室", hiragana: "きょうしつ", hanviet: "GIÁO THẤT", meaning: "Lớp học" },
  { kanji: "時間", hiragana: "じかん", hanviet: "THỜI GIAN", meaning: "Thời gian" },
  { kanji: "新聞", hiragana: "しんぶん", hanviet: "TÂN VĂN", meaning: "Tờ báo" },
  { kanji: "旅行", hiragana: "りょこう", hanviet: "LỮ HÀNH", meaning: "Du lịch" },
  { kanji: "料理", hiragana: "りょうり", hanviet: "LIỆU LÍ", meaning: "Nấu ăn, món ăn" },
  { kanji: "音楽", hiragana: "おんがく", hanviet: "ÂM NHẠC", meaning: "Âm nhạc" },
  { kanji: "映画", hiragana: "えいが", hanviet: "ẢNH HỌA", meaning: "Phim điện ảnh" },
  { kanji: "自転車", hiragana: "じてんしゃ", hanviet: "TỰ CHUYỂN XA", meaning: "Xe đạp" },
  { kanji: "電車", hiragana: "でんしゃ", hanviet: "ĐIỆN XA", meaning: "Tàu điện" },
  { kanji: "飛行機", hiragana: "ひこうき", hanviet: "PHI HÀNH CƠ", meaning: "Máy bay" },
  { kanji: "水", hiragana: "mizu", hanviet: "THỦY", meaning: "Nước" },
  { kanji: "お茶", hiragana: "おちゃ", hanviet: "TRÀ", meaning: "Trà" },
  { kanji: "桜", hiragana: "さくら", hanviet: "ANH", meaning: "Hoa anh đào" },
  { kanji: "富士山", hiragana: "ふじさん", hanviet: "PHÚ SĨ SƠN", meaning: "Núi Phú Sĩ" },
  { kanji: "今日", hiragana: "きょう", hanviet: "KIM NHẬT", meaning: "Hôm nay" },
  { kanji: "明日", hiragana: "あした", hanviet: "MINH NHẬT", meaning: "Ngày mai" },
  { kanji: "週末", hiragana: "しゅうまつ", hanviet: "CHU MẠT", meaning: "Cuối tuần" },
  { kanji: "買い物", hiragana: "かいもの", hanviet: "MÃI VẬT", meaning: "Mua sắm" },
  { kanji: "楽しい", hiragana: "たのしい", hanviet: "LẠC", meaning: "Vui vẻ, thú vị" },
  { kanji: "美味しい", hiragana: "おいしい", hanviet: "MỸ VỊ", meaning: "Ngon miệng" }
];

// Global Cached DOM Elements Object
const DOM = {
  totalWordsCount: null,
  playerChapterSelect: null,
  cardProgressBar: null,
  vocabCard: null,
  cardSpeakBtn: null,
  cardHiragana: null,
  cardKanji: null,
  cardHanviet: null,
  cardMeaning: null,
  playerModeStatus: null,
  playerProgressRatio: null,
  voiceSelect: null,
  speedRange: null,
  speedValue: null,
  vocabTableBody: null,
  noWordsPlaceholder: null,
  vocabSearchInput: null,
  pdfChaptersListContainer: null,
  pdfWordsPreviewBody: null,
  pdfWordsEmpty: null,
  pdfProgressStatus: null,
  pdfProgressPercent: null,
  pdfProgressBar: null,
  pdfSummaryStats: null,
  pdfStatPages: null,
  pdfStatChapters: null,
  pdfStatWords: null
};

function cacheDOMElements() {
  DOM.totalWordsCount = document.getElementById("total-words-count");
  DOM.playerChapterSelect = document.getElementById("player-chapter-select");
  DOM.cardProgressBar = document.getElementById("card-progress-bar");
  DOM.vocabCard = document.getElementById("vocab-card");
  DOM.cardSpeakBtn = document.getElementById("card-speak-btn");
  DOM.cardHiragana = document.getElementById("card-hiragana");
  DOM.cardKanji = document.getElementById("card-kanji");
  DOM.cardHanviet = document.getElementById("card-hanviet");
  DOM.cardMeaning = document.getElementById("card-meaning");
  DOM.playerModeStatus = document.getElementById("player-mode-status");
  DOM.playerProgressRatio = document.getElementById("player-progress-ratio");
  DOM.voiceSelect = document.getElementById("voice-select");
  DOM.speedRange = document.getElementById("speed-range");
  DOM.speedValue = document.getElementById("speed-value");
  DOM.vocabTableBody = document.getElementById("vocab-table-body");
  DOM.noWordsPlaceholder = document.getElementById("no-words-placeholder");
  DOM.vocabSearchInput = document.getElementById("vocab-search-input");
  DOM.pdfChaptersListContainer = document.getElementById("pdf-chapters-list-container");
  DOM.pdfWordsPreviewBody = document.getElementById("pdf-words-preview-body");
  DOM.pdfWordsEmpty = document.getElementById("pdf-words-empty");
  DOM.pdfProgressStatus = document.getElementById("pdf-progress-status");
  DOM.pdfProgressPercent = document.getElementById("pdf-progress-percent");
  DOM.pdfProgressBar = document.getElementById("pdf-progress-bar");
  DOM.pdfSummaryStats = document.getElementById("pdf-summary-stats");
  DOM.pdfStatPages = document.getElementById("pdf-stat-pages");
  DOM.pdfStatChapters = document.getElementById("pdf-stat-chapters");
  DOM.pdfStatWords = document.getElementById("pdf-stat-words");
}

// ==========================================================================
// 2. ASYNC INDEXEDDB & APP INITIALIZATION
// ==========================================================================

const DB_NAME = "KotobaBoosterDB";
const DB_VERSION = 1;
const STORE_NAME = "vocabulary";

function initDB() {
  return new Promise((resolve) => {
    try {
      if (!window.indexedDB) {
        console.warn("IndexedDB not supported, falling back to localStorage");
        resolve(null);
        return;
      }
      
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (e) => {
        console.warn("IndexedDB failed to open, falling back to localStorage", e);
        resolve(null);
      };
      
      request.onsuccess = (e) => {
        resolve(e.target.result);
      };
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
      };
    } catch (e) {
      console.warn("Error opening IndexedDB, falling back", e);
      resolve(null);
    }
  });
}

async function saveVocabListDB(list) {
  // Sync to localStorage backup (wrapped in protective try...catch)
  try {
    localStorage.setItem("kotoba_vocab_list", JSON.stringify(list));
  } catch (lsError) {
    console.warn("LocalStorage quota exceeded, continuing with IndexedDB only", lsError);
  }
  
  const db = await initDB();
  if (!db) return;
  
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        let addedCount = 0;
        if (list.length === 0) {
          resolve(true);
          return;
        }
        
        list.forEach((item, index) => {
          const addRequest = store.add({ ...item, listIndex: index });
          addRequest.onsuccess = () => {
            addedCount++;
            if (addedCount === list.length) {
              resolve(true);
            }
          };
          addRequest.onerror = () => {
            // resolve anyway to avoid hanging
            addedCount++;
            if (addedCount === list.length) {
              resolve(false);
            }
          };
        });
      };
      
      clearRequest.onerror = () => resolve(false);
    } catch (err) {
      console.error("IndexedDB write transaction failed", err);
      resolve(false);
    }
  });
}

async function loadVocabListDB() {
  const db = await initDB();
  if (!db) {
    try {
      const data = localStorage.getItem("kotoba_vocab_list");
      return data ? JSON.parse(data) : [];
    } catch(e) {
      return [];
    }
  }
  
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = (e) => {
        const items = e.target.result || [];
        // Sort items by listIndex to maintain user sequence
        items.sort((a, b) => a.listIndex - b.listIndex);
        
        const cleanList = items.map(item => {
          const { id, listIndex, ...rest } = item;
          return rest;
        });
        
        if (cleanList.length > 0) {
          resolve(cleanList);
        } else {
          // Fallback to localStorage if store is empty
          try {
            const data = localStorage.getItem("kotoba_vocab_list");
            resolve(data ? JSON.parse(data) : []);
          } catch(e) {
            resolve([]);
          }
        }
      };
      
      request.onerror = () => {
        try {
          const data = localStorage.getItem("kotoba_vocab_list");
          resolve(data ? JSON.parse(data) : []);
        } catch(e) {
          resolve([]);
        }
      };
    } catch (err) {
      console.warn("IndexedDB read failed, trying localStorage", err);
      try {
        const data = localStorage.getItem("kotoba_vocab_list");
        resolve(data ? JSON.parse(data) : []);
      } catch(e) {
        resolve([]);
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // Cache all DOM elements into global registry
  cacheDOMElements();

  // Load database from IndexedDB or localStorage fallback
  await loadVocabList();
  
  // Populate chapter selectors
  populateChapterDropdown();
  
  // Start speech synthesis setup
  setupSpeechSynthesis();

  // Bind all UI interaction listeners
  bindEvents();
  
  // Set initial player view index and start ticking
  const list = getFilteredVocabList();
  if (list.length > 0) {
    selectNextWordIndex(list);
    displayCurrentWord(list);
    if (isPlaying) {
      resumeTimerAnimation();
    }
  } else {
    updatePlayerPlaceholder();
  }
});

// Load vocabulary from IndexedDB or localStorage
async function loadVocabList() {
  let loadedList = [];
  try {
    loadedList = await loadVocabListDB();
  } catch (e) {
    console.error("Lỗi khi load danh sách từ vựng:", e);
  }
  
  // Auto-detect App Data sync on startup
  if (window.KOTOBA_PRESET_DB && window.KOTOBA_PRESET_DB.length > 0) {
    const dbLength = window.KOTOBA_PRESET_DB.length;
    const localLength = loadedList ? loadedList.length : 0;
    
    // If the DB has different number of words than local database, sync!
    if (dbLength !== localLength) {
      if (confirm(`Phát hiện bản cập nhật dữ liệu từ máy tính (${dbLength} từ). Bạn có muốn đồng bộ lên điện thoại không?`)) {
        vocabList = [...window.KOTOBA_PRESET_DB];
        await saveVocabList();
        updateGlobalStats();
        renderVocabTable();
        return;
      }
    }
  }

  if (loadedList && loadedList.length > 0) {
    vocabList = loadedList.map(item => ({
      ...item,
      chapter: item.chapter || "Từ vựng mẫu N5-N4"
    }));
  } else {
    // Fresh launch fallback
    vocabList = presetVocabulary.map(item => ({
      ...item,
      chapter: item.chapter || "Từ vựng mẫu N5-N4"
    }));
    await saveVocabList();
  }
  
  updateGlobalStats();
  renderVocabTable();
}

// Save vocabulary to IndexedDB with robust try...catch
async function saveVocabList() {
  try {
    await saveVocabListDB(vocabList);
  } catch (e) {
    console.error("Lỗi khi ghi dữ liệu từ vựng vào bộ nhớ:", e);
  }
}

// Update the global visual elements (word counter badge, ratio indicators)
function updateGlobalStats() {
  if (DOM.totalWordsCount) {
    DOM.totalWordsCount.textContent = vocabList.length;
  }
  updateRatioIndicator();
}

function updateRatioIndicator(list) {
  const ratioEl = DOM.playerProgressRatio;
  if (!ratioEl) return;
  
  const targetList = list || getFilteredVocabList();
  if (targetList.length === 0) {
    ratioEl.textContent = "0 / 0 từ";
  } else {
    ratioEl.textContent = `${currentIndex + 1} / ${targetList.length} từ`;
  }
}

let cachedFilteredList = [];
let cachedVocabLength = -1;
let cachedActiveFilter = null;

// Filter vocabList based on the selected active chapter
function getFilteredVocabList() {
  // Ultra-fast caching: if filter and list length haven't changed, return cached list immediately
  if (cachedActiveFilter === activeChapterFilter && cachedVocabLength === vocabList.length) {
    return cachedFilteredList;
  }
  
  cachedActiveFilter = activeChapterFilter;
  cachedVocabLength = vocabList.length;
  
  if (activeChapterFilter === "all") {
    cachedFilteredList = vocabList;
  } else {
    cachedFilteredList = vocabList.filter(item => item.chapter === activeChapterFilter);
  }
  
  return cachedFilteredList;
}

// Populate the Player Chapter Filter select dropdown
function populateChapterDropdown() {
  const select = DOM.playerChapterSelect;
  if (!select) return;
  
  const currentVal = select.value || "all";
  select.innerHTML = '<option value="all">Tất cả các chương</option>';
  
  // Extract unique chapters
  const chapters = [...new Set(vocabList.map(item => item.chapter || "Từ vựng mẫu N5-N4"))];
  
  chapters.forEach(chap => {
    const opt = document.createElement("option");
    opt.value = chap;
    opt.textContent = chap;
    if (chap === currentVal) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
  
  // Fallback if previous filter is no longer available
  if (currentVal !== "all" && !chapters.includes(currentVal)) {
    select.value = "all";
    activeChapterFilter = "all";
  }
}

// ==========================================================================
// 3. FLUID TIMER CYCLE ANIMATION
// ==========================================================================

function resumeTimerAnimation() {
  pauseTimerAnimation();
  
  const progressBar = DOM.cardProgressBar;
  
  // Animate progress bar using GPU-bound Web Animations API
  if (progressBar) {
    if (progressBar.activeAnimation) {
      progressBar.activeAnimation.cancel();
    }
    progressBar.activeAnimation = progressBar.animate([
      { transform: "scaleX(0)" },
      { transform: "scaleX(1)" }
    ], {
      duration: playSpeed,
      easing: "linear",
      fill: "forwards"
    });
  }
  
  function tick() {
    const list = getFilteredVocabList();
    if (!isPlaying || list.length === 0) return;
    
    showNextWord(list);
    
    if (progressBar) {
      if (progressBar.activeAnimation) {
        progressBar.activeAnimation.cancel();
      }
      progressBar.activeAnimation = progressBar.animate([
        { transform: "scaleX(0)" },
        { transform: "scaleX(1)" }
      ], {
        duration: playSpeed,
        easing: "linear",
        fill: "forwards"
      });
    }
    
    progressAnimId = setTimeout(tick, playSpeed);
  }
  
  progressAnimId = setTimeout(tick, playSpeed);
}

function pauseTimerAnimation() {
  if (progressAnimId) {
    clearTimeout(progressAnimId);
    progressAnimId = null;
  }
  
  const progressBar = DOM.cardProgressBar;
  if (progressBar && progressBar.activeAnimation) {
    progressBar.activeAnimation.pause(); // Pause smoothly in place
  }
}

// ==========================================================================
// 4. DISPLAY WORD CONTROLLER
// ==========================================================================

function showNextWord(list) {
  const targetList = list || getFilteredVocabList();
  if (targetList.length === 0) return;
  
  selectNextWordIndex(targetList);
  displayCurrentWord(targetList);
}

function showPrevWord(list) {
  const targetList = list || getFilteredVocabList();
  if (targetList.length === 0) return;
  
  if (historyStack.length > 1 && historyIndex > 0) {
    // Step back in current session history
    historyIndex--;
    currentIndex = historyStack[historyIndex];
  } else {
    // Subtract sequence index
    currentIndex = currentIndex - 1;
    if (currentIndex < 0) currentIndex = targetList.length - 1;
  }
  
  displayCurrentWord(targetList);
}

function selectNextWordIndex(list) {
  const targetList = list || getFilteredVocabList();
  if (targetList.length === 0) return;
  
  // If we are navigating the history stack and reached the end
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    currentIndex = historyStack[historyIndex];
    return;
  }
  
  let nextIdx = 0;
  if (isRandom) {
    // Generate a random number different from the current if list length > 1
    if (targetList.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * targetList.length);
      } while (nextIdx === currentIndex);
    } else {
      nextIdx = 0;
    }
  } else {
    nextIdx = currentIndex + 1;
    if (nextIdx >= targetList.length) {
      nextIdx = 0;
    }
  }
  
  currentIndex = nextIdx;
  
  // Add to session history stack (max limit 100 entries to prevent memory grow)
  historyStack.push(currentIndex);
  if (historyStack.length > 100) {
    historyStack.shift();
  }
  historyIndex = historyStack.length - 1;
}

function displayCurrentWord(list) {
  const targetList = list || getFilteredVocabList();
  if (targetList.length === 0) {
    updatePlayerPlaceholder();
    return;
  }
  
  // Safety check if index out of bounds
  if (currentIndex < 0 || currentIndex >= targetList.length) {
    currentIndex = 0;
  }
  
  const word = targetList[currentIndex];
  const cardEl = DOM.vocabCard;
  
  // Trigger card refresh pulse micro-animation using double requestAnimationFrame to avoid synchronous reflows!
  if (cardEl) {
    cardEl.classList.remove("change-word");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cardEl.classList.add("change-word");
      });
    });
  }
  
  // Write contents
  if (DOM.cardHiragana) DOM.cardHiragana.textContent = word.hiragana || "Cách đọc";
  if (DOM.cardKanji) DOM.cardKanji.textContent = word.kanji || "漢字";
  if (DOM.cardMeaning) DOM.cardMeaning.textContent = word.meaning || "Nghĩa tiếng Việt";
  
  const hanvietEl = DOM.cardHanviet;
  if (hanvietEl) {
    if (word.hanviet && word.hanviet.trim()) {
      hanvietEl.textContent = word.hanviet.toUpperCase();
      hanvietEl.style.display = "inline-block";
    } else {
      hanvietEl.style.display = "none";
    }
  }
  
  updateRatioIndicator(targetList);
  
  // Auto speech synthesis read-out if enabled
  if (autoTTS) {
    speakWord(word.kanji || word.hiragana);
  }
}

function updatePlayerPlaceholder() {
  if (DOM.cardHiragana) DOM.cardHiragana.textContent = "Nhấp vào Quản lý";
  if (DOM.cardKanji) DOM.cardKanji.textContent = "Trống";
  if (DOM.cardMeaning) DOM.cardMeaning.textContent = "Hãy thêm danh sách từ vựng từ Excel hoặc nhập thủ công để bắt đầu học nhé!";
  if (DOM.cardHanviet) DOM.cardHanviet.style.display = "none";
  
  const progressBar = DOM.cardProgressBar;
  if (progressBar) {
    if (progressBar.activeAnimation) {
      progressBar.activeAnimation.cancel();
    }
    progressBar.style.transform = "scaleX(0)";
  }
}

// ==========================================================================
// 5. TEXT-TO-SPEECH (SPEECH SYNTHESIS)
// ==========================================================================

function setupSpeechSynthesis() {
  if (!synth) return;
  
  // Load voices dynamically (Google Chrome loads them asynchronously)
  populateVoiceList();
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = populateVoiceList;
  }
}

function populateVoiceList() {
  if (!synth) return;
  
  voices = synth.getVoices();
  const voiceSelect = document.getElementById("voice-select");
  voiceSelect.innerHTML = "";
  
  // Match Japanese voices
  const jaVoices = voices.filter(v => v.lang.toLowerCase().includes("ja") || v.lang === "ja-JP");
  
  if (jaVoices.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "Không tìm thấy giọng Nhật (Sử dụng hệ thống)";
    opt.value = "";
    voiceSelect.appendChild(opt);
    jpVoice = null;
  } else {
    jaVoices.forEach((voice, index) => {
      const opt = document.createElement("option");
      opt.textContent = `${voice.name} (${voice.lang})`;
      opt.value = index;
      
      // Auto select premium voices or defaults
      if (voice.default || voice.name.includes("Google") || voice.name.includes("Natural")) {
        opt.selected = true;
        jpVoice = voice;
      }
      voiceSelect.appendChild(opt);
    });
    
    // If no voice was selected, pick the first Japanese voice
    if (voiceSelect.selectedIndex === -1) {
      voiceSelect.selectedIndex = 0;
      jpVoice = jaVoices[0];
    }
  }
}

function speakWord(text) {
  if (!synth) return;
  
  // Cancel active/queued voice reading to avoid delay lag
  synth.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  
  const voiceSelect = document.getElementById("voice-select");
  const jaVoices = voices.filter(v => v.lang.toLowerCase().includes("ja") || v.lang === "ja-JP");
  
  if (jaVoices.length > 0 && voiceSelect.value !== "") {
    utterance.voice = jaVoices[parseInt(voiceSelect.value)];
  } else if (jpVoice) {
    utterance.voice = jpVoice;
  }
  
  utterance.rate = 0.85; // slower speech rate for absolute clarity
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  synth.speak(utterance);
}

// ==========================================================================
// 6. EXCEL PARSING & GENERATION (SHEETJS)
// ==========================================================================

function handleExcelUpload(file) {
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = e.target.result;
    try {
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (rows.length < 2) {
        showToast("File Excel trống hoặc không có dòng tiêu đề!", "error");
        return;
      }
      
      const headers = rows[0];
      let kanjiIdx = -1, hiraganaIdx = -1, hanvietIdx = -1, meaningIdx = -1;
      
      // Match column index by comparing headers
      for (let i = 0; i < headers.length; i++) {
        if (!headers[i]) continue;
        const h = String(headers[i]).trim().toLowerCase();
        
        if (["kanji", "từ vựng", "tu vung", "word", "chữ hán", "chu han", "hán tự"].some(term => h.includes(term))) {
          if (kanjiIdx === -1) kanjiIdx = i;
        } else if (["hiragana", "cách đọc", "cach doc", "furigana", "reading", "kana"].some(term => h.includes(term))) {
          if (hiraganaIdx === -1) hiraganaIdx = i;
        } else if (["hán việt", "han viet", "hanviet", "âm hán việt", "sino"].some(term => h.includes(term))) {
          if (hanvietIdx === -1) hanvietIdx = i;
        } else if (["nghĩa", "nghia", "nghĩa tiếng việt", "nghia tieng viet", "meaning", "translation"].some(term => h.includes(term))) {
          if (meaningIdx === -1) meaningIdx = i;
        }
      }
      
      // Fallback index orders if columns matching failed
      if (kanjiIdx === -1) kanjiIdx = 0;
      if (hiraganaIdx === -1) hiraganaIdx = 1;
      if (hanvietIdx === -1) hanvietIdx = 2;
      if (meaningIdx === -1) meaningIdx = 3;
      
      const importedWords = [];
      
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;
        
        const kanji = row[kanjiIdx] || '';
        const hiragana = row[hiraganaIdx] || '';
        const hanviet = row[hanvietIdx] || '';
        const meaning = row[meaningIdx] || '';
        
        if (String(kanji).trim() && String(meaning).trim()) {
          importedWords.push({
            kanji: String(kanji).trim(),
            hiragana: String(hiragana).trim(),
            hanviet: String(hanviet).trim().toUpperCase(),
            meaning: String(meaning).trim(),
            chapter: "Nhập từ Excel"
          });
        }
      }
      
      if (importedWords.length > 0) {
        // Concat to existing vocab list
        vocabList = [...vocabList, ...importedWords];
        saveVocabList();
        updateGlobalStats();
        populateChapterDropdown(); // Rebuild chapter list
        renderVocabTable();
        
        // Update display to point to the newly imported lists
        if (currentIndex === -1) {
          currentIndex = 0;
          displayCurrentWord();
        }
        
        showToast(`Đã import thành công ${importedWords.length} từ vựng mới!`, "success");
      } else {
        showToast("Không tìm thấy dòng từ vựng hợp lệ nào trong file!", "error");
      }
      
    } catch (err) {
      console.error(err);
      showToast("Lỗi xử lý file Excel. Vui lòng kiểm tra lại định dạng!", "error");
    }
  };
  
  reader.readAsBinaryString(file);
}

// Generate templates dynamically using sheetJS client side!
function downloadExcelTemplate() {
  const data = [
    ["Kanji", "Hiragana", "Âm Hán Việt", "Nghĩa tiếng Việt"],
    ["学校", "がっこう", "HỌC HIỆU", "Trường học"],
    ["食べる", "たべる", "THỰC", "Ăn"],
    ["楽しい", "たのしい", "LẠC", "Vui vẻ, thú vị"],
    ["桜", "さくら", "ANH", "Hoa anh đào"],
    ["美味しい", "おいしい", "MỸ VỊ", "Ngon miệng"]
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Kotoba Template");
  
  XLSX.writeFile(workbook, "Kotoba_Booster_Template.xlsx");
  showToast("Đã tải tệp Excel mẫu về máy!", "success");
}

// ==========================================================================
// 7. VOCABULARY CRUD MANAGEMENT (MANAGER PANEL)
// ==========================================================================

function renderVocabTable() {
  const tbody = DOM.vocabTableBody;
  const placeholder = DOM.noWordsPlaceholder;
  const searchInput = DOM.vocabSearchInput;
  if (!tbody || !placeholder || !searchInput) return;
  
  const filterText = searchInput.value.trim().toLowerCase();
  tbody.innerHTML = "";
  
  const filteredList = vocabList.filter(item => {
    return (
      (item.kanji && item.kanji.toLowerCase().includes(filterText)) ||
      (item.hiragana && item.hiragana.toLowerCase().includes(filterText)) ||
      (item.hanviet && item.hanviet.toLowerCase().includes(filterText)) ||
      (item.meaning && item.meaning.toLowerCase().includes(filterText))
    );
  });
  
  if (filteredList.length === 0) {
    placeholder.style.display = "flex";
  } else {
    placeholder.style.display = "none";
    
    filteredList.forEach((word) => {
      // Find true index in primary array
      const rawIndex = vocabList.indexOf(word);
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${word.kanji}</td>
        <td>${word.hiragana || '<span style="opacity:0.3">-</span>'}</td>
        <td>${word.hanviet ? `<span class="hanviet-badge" style="font-size: 0.75rem; padding: 2px 8px;">${word.hanviet}</span>` : '<span style="opacity:0.3">-</span>'}</td>
        <td>${word.meaning}</td>
        <td class="text-center">
          <div class="row-actions">
            <button class="btn-row-action btn-row-delete" data-index="${rawIndex}" title="Xóa từ vựng này">
              <i data-lucide="trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    // Refresh row trash icons
    lucide.createIcons();
  }
}

function addWordManually(kanji, hiragana, hanviet, meaning) {
  const newWord = {
    kanji: kanji.trim(),
    hiragana: hiragana.trim(),
    hanviet: hanviet.trim().toUpperCase(),
    meaning: meaning.trim(),
    chapter: "Nhập thủ công"
  };
  
  vocabList.push(newWord);
  saveVocabList();
  updateGlobalStats();
  populateChapterDropdown(); // Rebuild chapter selector
  renderVocabTable();
  
  // If list was empty, point index to 0
  if (currentIndex === -1) {
    currentIndex = 0;
    displayCurrentWord();
  }
  
  showToast(`Đã thêm từ "${kanji}" thành công!`, "success");
}

function deleteWord(index) {
  if (index < 0 || index >= vocabList.length) return;
  
  const removedWord = vocabList[index].kanji;
  vocabList.splice(index, 1);
  
  saveVocabList();
  updateGlobalStats();
  populateChapterDropdown(); // Rebuild chapter selector
  renderVocabTable();
  
  // Safety checks on index out of bounds
  if (vocabList.length === 0) {
    currentIndex = -1;
    displayCurrentWord();
  } else if (currentIndex >= vocabList.length) {
    currentIndex = vocabList.length - 1;
    displayCurrentWord();
  } else if (index === currentIndex) {
    displayCurrentWord(); // reload current display
  }
  
  // Reset session history stack
  historyStack = [];
  historyIndex = -1;
  
  showToast(`Đã xóa từ "${removedWord}" khỏi danh sách`, "info");
}

function clearAllVocab() {
  if (vocabList.length === 0) return;
  
  if (confirm("Bạn có chắc chắn muốn xóa TOÀN BỘ từ vựng hiện có không?")) {
    vocabList = [];
    saveVocabList();
    updateGlobalStats();
    populateChapterDropdown();
    renderVocabTable();
    
    currentIndex = -1;
    historyStack = [];
    historyIndex = -1;
    displayCurrentWord();
    
    showToast("Đã xóa sạch toàn bộ từ vựng danh sách!", "info");
  }
}

function exportDatabase() {
  if (vocabList.length === 0) {
    showToast("Không có dữ liệu để xuất!", "error");
    return;
  }
  
  const dbContent = `// File cơ sở dữ liệu từ vựng Kotoba Booster.
// Được tạo tự động vào lúc ${new Date().toLocaleString('vi-VN')}
window.KOTOBA_PRESET_DB = ${JSON.stringify(vocabList, null, 2)};
`;

  const blob = new Blob([dbContent], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kotoba_database.js";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast("Đã xuất file dữ liệu! Hãy lưu vào thư mục dự án trên máy tính để đồng bộ.", "success");
}

function loadPresetVocabulary() {
  if (window.KOTOBA_PRESET_DB && window.KOTOBA_PRESET_DB.length > 0) {
    if (confirm("Phát hiện dữ liệu đồng bộ (App Data). Bạn có muốn nạp dữ liệu này không? (Dữ liệu hiện tại sẽ bị xóa)")) {
      vocabList = [...window.KOTOBA_PRESET_DB];
      saveVocabList();
      updateGlobalStats();
      populateChapterDropdown();
      renderVocabTable();
      
      currentIndex = 0;
      historyStack = [];
      historyIndex = -1;
      displayCurrentWord();
      
      showToast("Đã tải dữ liệu đồng bộ thành công!", "success");
    }
    return;
  }
  
  if (confirm("Nạp lại bộ từ vựng N5-N4 mẫu của hệ thống?")) {
    vocabList = presetVocabulary.map(item => ({
      ...item,
      chapter: item.chapter || "Từ vựng mẫu N5-N4"
    }));
    saveVocabList();
    updateGlobalStats();
    populateChapterDropdown();
    renderVocabTable();
    
    currentIndex = 0;
    historyStack = [];
    historyIndex = -1;
    displayCurrentWord();
    
    showToast("Đã khôi phục bộ từ vựng mẫu thành công!", "success");
  }
}

// Overseer to inject chapter tags in vocab list table rendering
function renderVocabTable() {
  const tbody = document.getElementById("vocab-table-body");
  const placeholder = document.getElementById("no-words-placeholder");
  const searchInput = document.getElementById("vocab-search-input");
  const filterText = searchInput.value.trim().toLowerCase();
  
  tbody.innerHTML = "";
  
  const filteredList = vocabList.filter(item => {
    return (
      (item.kanji && item.kanji.toLowerCase().includes(filterText)) ||
      (item.hiragana && item.hiragana.toLowerCase().includes(filterText)) ||
      (item.hanviet && item.hanviet.toLowerCase().includes(filterText)) ||
      (item.meaning && item.meaning.toLowerCase().includes(filterText)) ||
      (item.chapter && item.chapter.toLowerCase().includes(filterText))
    );
  });
  
  if (filteredList.length === 0) {
    placeholder.style.display = "flex";
  } else {
    placeholder.style.display = "none";
    
    filteredList.forEach((word, index) => {
      // Find true index in primary array
      const rawIndex = vocabList.indexOf(word);
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div style="font-weight: 600; font-family: var(--font-jp);">${word.kanji}</div>
          <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 2px; font-weight: normal;">${word.chapter || 'Từ vựng mẫu N5-N4'}</div>
        </td>
        <td>${word.hiragana || '<span style="opacity:0.3">-</span>'}</td>
        <td>${word.hanviet ? `<span class="hanviet-badge" style="font-size: 0.75rem; padding: 2px 8px;">${word.hanviet}</span>` : '<span style="opacity:0.3">-</span>'}</td>
        <td>${word.meaning}</td>
        <td class="text-center">
          <div class="row-actions">
            <button class="btn-row-action btn-row-delete" data-index="${rawIndex}" title="Xóa từ vựng này">
              <i data-lucide="trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    // Refresh row trash icons
    lucide.createIcons();
    
    // Bind row delete events
    document.querySelectorAll(".btn-row-delete").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const tr = e.target.closest("button");
        const idx = parseInt(tr.getAttribute("data-index"));
        deleteWord(idx);
      });
    });
  }
}

// ==========================================================================
// 8. TOAST SYSTEM
// ==========================================================================

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let iconName = "info";
  if (type === "success") iconName = "check-circle";
  if (type === "error") iconName = "alert-triangle";
  
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="toast-icon"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Bind lucide to new toast element icon
  lucide.createIcons();
  
  // Automatically dispose toast element after 4s
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// ==========================================================================
// 9. EVENT LISTENERS BINDING
// ==========================================================================

function bindEvents() {
  // Navigation View switcher
  const navPlayer = document.getElementById("nav-player");
  const navManager = document.getElementById("nav-manager");
  const viewPlayer = document.getElementById("player-view");
  const viewManager = document.getElementById("manager-view");
  
  if (navPlayer && navManager && viewPlayer && viewManager) {
    navPlayer.addEventListener("click", () => {
      navPlayer.classList.add("active");
      navManager.classList.remove("active");
      viewPlayer.classList.add("active");
      viewManager.classList.remove("active");
      
      // Resume cycle timer if isPlaying is true
      const list = getFilteredVocabList();
      if (isPlaying && list.length > 0) {
        resumeTimerAnimation();
      }
    });
    
    navManager.addEventListener("click", () => {
      navPlayer.classList.remove("active");
      navManager.classList.add("active");
      viewPlayer.classList.remove("active");
      viewManager.classList.add("active");
      
      // Pause cycle to prevent flashing behind screen
      pauseTimerAnimation();
    });
  }

  // Subnav tab switching inside Manager View
  const tabExcel = document.getElementById("tab-excel");
  const tabPdf = document.getElementById("tab-pdf");
  const tabContentExcel = document.getElementById("manager-tab-content-excel");
  const tabContentPdf = document.getElementById("manager-tab-content-pdf");

  if (tabExcel && tabPdf && tabContentExcel && tabContentPdf) {
    tabExcel.addEventListener("click", () => {
      tabExcel.classList.add("active");
      tabPdf.classList.remove("active");
      tabContentExcel.classList.add("active");
      tabContentPdf.classList.remove("active");
    });

    tabPdf.addEventListener("click", () => {
      tabExcel.classList.remove("active");
      tabPdf.classList.add("active");
      tabContentExcel.classList.remove("active");
      tabContentPdf.classList.add("active");
      
      // Trigger custom lucide refresh for PDF elements
      lucide.createIcons();
    });
  }

  // PDF File Upload Bindings
  const pdfDropZone = document.getElementById("pdf-drop-zone");
  const pdfFileInput = document.getElementById("pdf-file-input");

  if (pdfDropZone && pdfFileInput) {
    pdfDropZone.addEventListener("click", () => pdfFileInput.click());

    pdfFileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        parsePDFFile(e.target.files[0]);
      }
    });

    pdfDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      pdfDropZone.classList.add("dragover");
    });

    pdfDropZone.addEventListener("dragleave", () => {
      pdfDropZone.classList.remove("dragover");
    });

    pdfDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      pdfDropZone.classList.remove("dragover");
      if (e.dataTransfer.files.length > 0) {
        parsePDFFile(e.dataTransfer.files[0]);
      }
    });
  }

  // PDF wizard controls
  const btnPdfSelectAll = document.getElementById("btn-pdf-select-all");
  const btnPdfDeselectAll = document.getElementById("btn-pdf-deselect-all");
  const btnPdfImportAction = document.getElementById("btn-pdf-import-action");

  if (btnPdfSelectAll) {
    btnPdfSelectAll.addEventListener("click", () => {
      document.querySelectorAll('#pdf-chapters-list-container input[type="checkbox"]').forEach(chk => {
        chk.checked = true;
        chk.closest(".chapter-checkbox-row").classList.add("active");
      });
      renderPDFWordsPreview();
    });
  }

  if (btnPdfDeselectAll) {
    btnPdfDeselectAll.addEventListener("click", () => {
      document.querySelectorAll('#pdf-chapters-list-container input[type="checkbox"]').forEach(chk => {
        chk.checked = false;
        chk.closest(".chapter-checkbox-row").classList.remove("active");
      });
      renderPDFWordsPreview();
    });
  }

  if (btnPdfImportAction) {
    btnPdfImportAction.addEventListener("click", importSelectedPDFChapters);
  }
  
  // Play Pause Actions
  const btnPlayPause = document.getElementById("btn-play-pause");
  const playPauseIcon = document.getElementById("play-pause-icon");
  const statusIndicator = DOM.playerModeStatus;
  
  if (btnPlayPause && playPauseIcon && statusIndicator) {
    btnPlayPause.addEventListener("click", () => {
      if (vocabList.length === 0) return;
      
      isPlaying = !isPlaying;
      if (isPlaying) {
        playPauseIcon.setAttribute("data-lucide", "pause");
        statusIndicator.textContent = "Đang tự động chuyển";
        statusIndicator.classList.add("active");
        resumeTimerAnimation();
        showToast("Bắt đầu tự động chuyển từ!", "info");
      } else {
        playPauseIcon.setAttribute("data-lucide", "play");
        statusIndicator.textContent = "Đang tạm dừng";
        statusIndicator.classList.remove("active");
        pauseTimerAnimation();
        showToast("Đã tạm dừng tự động chuyển!", "info");
      }
      lucide.createIcons();
    });
  }
  
  // Skip buttons
  const btnNext = document.getElementById("btn-next");
  const btnPrev = document.getElementById("btn-prev");

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      progressAccumulated = 0;
      showNextWord();
      if (isPlaying) {
        resumeTimerAnimation();
      }
    });
  }
  
  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      showPrevWord();
      if (isPlaying) {
        resumeTimerAnimation();
      }
    });
  }
  
  // Random / Sequence Toggle
  const btnRandom = document.getElementById("btn-random");
  if (btnRandom) {
    btnRandom.addEventListener("click", () => {
      isRandom = !isRandom;
      if (isRandom) {
        btnRandom.classList.add("active");
        showToast("Chế độ: Đọc ngẫu nhiên", "info");
      } else {
        btnRandom.classList.remove("active");
        showToast("Chế độ: Đọc tuần tự", "info");
      }
    });
  }
  
  // Audio Controls
  const btnAutoSpeak = document.getElementById("btn-auto-speak");
  if (btnAutoSpeak) {
    btnAutoSpeak.addEventListener("click", () => {
      autoTTS = !autoTTS;
      if (autoTTS) {
        btnAutoSpeak.classList.add("active");
        showToast("Tự động phát âm khi chuyển từ mới", "success");
        // speak current immediately
        if (currentIndex !== -1) {
          const word = vocabList[currentIndex];
          speakWord(word.kanji || word.hiragana);
        }
      } else {
        btnAutoSpeak.classList.remove("active");
        showToast("Tắt tự động đọc", "info");
      }
    });
  }
  
  // Manual card speak button click
  if (DOM.cardSpeakBtn) {
    DOM.cardSpeakBtn.addEventListener("click", () => {
      if (currentIndex !== -1) {
        const word = vocabList[currentIndex];
        speakWord(word.kanji || word.hiragana);
      }
    });
  }
  
  // Interval speed slider
  const speedRange = DOM.speedRange;
  const speedValue = DOM.speedValue;
  
  if (speedRange && speedValue) {
    speedRange.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      speedValue.textContent = val.toFixed(1);
      playSpeed = val * 1000;
      
      // Scale timer remaining calculations
      progressAccumulated = 0; 
      if (isPlaying) {
        resumeTimerAnimation();
      }
    });
  }
  
  // Excel File drag-and-drop
  const dropZone = document.getElementById("excel-drop-zone");
  const fileInput = document.getElementById("excel-file-input");
  
  if (dropZone && fileInput) {
    dropZone.addEventListener("click", () => fileInput.click());
    
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleExcelUpload(e.target.files[0]);
      }
    });
    
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
    
    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragover");
    });
    
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      if (e.dataTransfer.files.length > 0) {
        handleExcelUpload(e.dataTransfer.files[0]);
      }
    });
  }
  
  // Download excel sample template
  const btnDownloadTemplate = document.getElementById("btn-download-template");
  if (btnDownloadTemplate) {
    btnDownloadTemplate.addEventListener("click", downloadExcelTemplate);
  }
  
  // Manual word adder form submission
  const manualAddForm = document.getElementById("manual-add-form");
  if (manualAddForm) {
    manualAddForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const kanjiVal = document.getElementById("input-kanji").value;
      const hiraganaVal = document.getElementById("input-hiragana").value;
      const hanvietVal = document.getElementById("input-hanviet").value;
      const meaningVal = document.getElementById("input-meaning").value;
      
      addWordManually(kanjiVal, hiraganaVal, hanvietVal, meaningVal);
      
      // reset form
      e.target.reset();
    });
  }
  
  // Table Manager triggers
  const btnClearAll = document.getElementById("btn-clear-all");
  const btnLoadPreset = document.getElementById("btn-load-preset");
  const btnExportDb = document.getElementById("btn-export-db");

  if (btnClearAll) btnClearAll.addEventListener("click", clearAllVocab);
  if (btnLoadPreset) btnLoadPreset.addEventListener("click", loadPresetVocabulary);
  if (btnExportDb) btnExportDb.addEventListener("click", exportDatabase);
  
  // Table dynamic search input
  if (DOM.vocabSearchInput) {
    DOM.vocabSearchInput.addEventListener("input", renderVocabTable);
  }
  
  // Voice select change
  if (DOM.voiceSelect) {
    DOM.voiceSelect.addEventListener("change", () => {
      showToast("Đã thay đổi giọng nói tiếng Nhật!", "info");
    });
  }
  
  // Player chapter filter select change
  const playerChapterSelect = DOM.playerChapterSelect;
  if (playerChapterSelect) {
    playerChapterSelect.addEventListener("change", (e) => {
      activeChapterFilter = e.target.value;
      
      // Reset player sequence and session history for the selected chapter
      currentIndex = 0;
      historyStack = [];
      historyIndex = -1;
      
      displayCurrentWord();
      
      const label = activeChapterFilter === "all" ? "Tất cả các chương" : activeChapterFilter;
      showToast(`Đang học: ${label}`, "success");
    });
  }

  // EVENT DELEGATION: Bind vocabulary row deletion click centrally on the table body
  if (DOM.vocabTableBody) {
    DOM.vocabTableBody.addEventListener("click", (e) => {
      const deleteBtn = e.target.closest(".btn-row-delete");
      if (deleteBtn) {
        const idx = parseInt(deleteBtn.getAttribute("data-index"));
        deleteWord(idx);
      }
    });
  }
}

// ==========================================================================
// 10. PDF PARSING & CHAPTER EXTRACTION (PDF.JS & POSITION CLUSTERING)
// ==========================================================================

async function parsePDFFile(file) {
  if (!file) return;
  
  const progressContainer = document.getElementById("pdf-progress-container");
  const progressStatus = document.getElementById("pdf-progress-status");
  const progressPercent = document.getElementById("pdf-progress-percent");
  const progressBar = document.getElementById("pdf-progress-bar");
  const summaryStats = document.getElementById("pdf-summary-stats");
  const dropZone = document.getElementById("pdf-drop-zone");
  
  progressContainer.style.display = "block";
  summaryStats.style.display = "none";
  progressBar.style.width = "0%";
  progressPercent.textContent = "0%";
  progressStatus.textContent = "Đang đọc tệp PDF...";
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF Document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    
    let currentChapter = "Chương 1 (Mặc định N3)";
    let parsedWords = [];
    let chapterCounts = {}; // Keep track of words in each chapter
    
    // Save word helper to enforce rules and default fields
    const saveParsedWord = (word) => {
      if (!word) return;
      
      let kan = (word.kanji || "").trim();
      let hira = (word.hiragana || "").trim();
      let han = (word.hanviet || "").trim().toUpperCase();
      let mean = (word.meaning || "").trim();
      
      if ((kan || hira) && mean) {
        if (!hira) {
          hira = kan; // fallback
        }
        
        parsedWords.push({
          kanji: kan,
          hiragana: hira,
          hanviet: han,
          meaning: mean,
          chapter: word.chapter
        });
        
        chapterCounts[word.chapter] = (chapterCounts[word.chapter] || 0) + 1;
      }
    };
    
    // Iterate page by page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      progressStatus.textContent = `Đang quét & phân tích trang ${pageNum} / ${numPages}...`;
      const progressVal = Math.round((pageNum / numPages) * 100);
      progressBar.style.transformOrigin = "left";
      progressBar.style.transform = `scaleX(${progressVal / 100})`;
      progressPercent.textContent = `${progressVal}%`;
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items;
      
      if (items.length === 0) continue;
      
      // Step 1: Detect page dimensions and calculate proportional grid split points
      const view = page.view || [0, 0, 595, 842];
      const pageWidth = (view[2] - view[0]) || 595;
      
      // Proportional boundaries based on visual textbook grid columns:
      // - The left vocabulary column occupies exactly 36% of the page width
      const rightColumnThreshold = pageWidth * 0.36;
      // - The horizontal separation point between Kanji (left) and Hán Việt (right) inside the vocabulary column is at 19% of page width
      const innerSplitThreshold = pageWidth * 0.19;
      
      const thresholdY = 8;
      let rows = []; // array of { y, items: [] }
      
      items.forEach(item => {
        const text = item.str;
        if (!text || !text.trim()) return;
        
        const x = item.transform[4];
        const y = item.transform[5];
        
        // Exclude right-column example sentences completely
        if (x > rightColumnThreshold) return;
        
        let foundRow = rows.find(r => Math.abs(r.y - y) <= thresholdY);
        if (foundRow) {
          foundRow.items.push({ x, text });
        } else {
          rows.push({ y, items: [{ x, text }] });
        }
      });
      
      // Step 2: Sort rows descending by Y (top of the page to bottom)
      rows.sort((a, b) => b.y - a.y);
      
      // Step 3: Sort elements inside each row left-to-right (ascending X)
      rows.forEach(row => {
        row.items.sort((a, b) => a.x - b.x);
        
        // Merge segments that are closely spaced horizontally
        let merged = [];
        row.items.forEach(item => {
          if (merged.length === 0) {
            merged.push(item);
          } else {
            const last = merged[merged.length - 1];
            const approxCharWidth = 5;
            const lastRightEdge = last.x + last.text.length * approxCharWidth;
            const horizontalDistance = item.x - lastRightEdge;
            
            if (horizontalDistance < 15) {
              last.text += " " + item.text;
            } else {
              merged.push(item);
            }
          }
        });
        row.items = merged;
      });
      
      // Step 4: Stateful sequential parsing of left-column rows
      let currentWord = null;
      
      rows.forEach(row => {
        // Divide the left column horizontally using our dynamic split threshold
        const leftText = row.items.filter(item => item.x < innerSplitThreshold).map(item => item.text).join(" ").trim();
        const rightText = row.items.filter(item => item.x >= innerSplitThreshold).map(item => item.text).join(" ").trim();
        const fullText = (leftText + " " + rightText).trim();
        
        if (!fullText) return;
        
        // Match Chapter/Lesson headers (Chương X, Bài X, UNIT X, etc.)
        const chapMatch = fullText.match(/(Chương|Bài|Bài học|UNIT|LESSON|Chapter|CHƯƠNG|BÀI)\s*(\d+|[I|V|X]+|[a-zA-Z\s\d]+)/i);
        if (chapMatch) {
          saveParsedWord(currentWord);
          currentWord = null;
          currentChapter = fullText.trim();
          return;
        }
        
        // Check for new vocabulary row (header)
        const hasJapanese = /[\u3040-\u30ff\u4e00-\u9faf]/.test(leftText);
        const hasKanjiOrKatakana = /[\u4e00-\u9faf\u30a0-\u30ff]/.test(leftText);
        
        // Header right has POS like (N), a dash, or Hán Việt letters
        const rightTextWithoutPOS = rightText.replace(/\([A-Za-z\d\s]+\)/g, "").trim();
        const hasHeaderRight = rightText && (/[a-zA-ZÀ-ỹ]/.test(rightText) || rightText.includes("-") || /\(.*\)/.test(rightText));
        
        // A new word starts if we have Japanese on the left AND:
        // - It has Kanji/Katakana characters (since reading rows only have Hiragana)
        // - OR it has header right content
        // - OR the previous word is already completed with a meaning
        const isNewWord = hasJapanese && (
          hasKanjiOrKatakana || 
          hasHeaderRight || 
          (currentWord && currentWord.meaning)
        );
        
        if (isNewWord) {
          saveParsedWord(currentWord);
          currentWord = {
            kanji: leftText,
            hiragana: "",
            hanviet: rightTextWithoutPOS || "-",
            meaning: "",
            chapter: currentChapter
          };
        } else if (currentWord) {
          // If the line contains no Japanese characters, it is 100% a Vietnamese meaning translation line!
          const isMeaningLine = !hasJapanese;
          
          if (isMeaningLine) {
            const cleanMeaning = leftText.replace(/[◇•\s]+/g, " ").trim();
            if (cleanMeaning) {
              currentWord.meaning = currentWord.meaning ? currentWord.meaning + ", " + cleanMeaning : cleanMeaning;
            }
          } else {
            // Check for Hiragana reading continuation
            if (leftText && /[\u3040-\u30ff\u4e00-\u9faf]/.test(leftText)) {
              currentWord.hiragana = currentWord.hiragana ? currentWord.hiragana + " " + leftText : leftText;
            }
            // Check for Sino-Vietnamese reading continuation
            if (rightText) {
              const cleanRight = rightText.replace(/\([A-Za-z\d\s]+\)/g, "").trim();
              if (cleanRight && /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯÝỲỸ\s]+$/.test(cleanRight)) {
                currentWord.hanviet = currentWord.hanviet && currentWord.hanviet !== "-" ? currentWord.hanviet + " " + cleanRight : cleanRight;
              }
            }
          }
        }
      });
      
      // Save last word of the page if exists
      saveParsedWord(currentWord);
    }
    
    // Group words into the temporary workspace state
    pdfParsedChapters = {};
    parsedWords.forEach(word => {
      if (!pdfParsedChapters[word.chapter]) {
        pdfParsedChapters[word.chapter] = [];
      }
      pdfParsedChapters[word.chapter].push(word);
    });
    
    // Bind stats into UI
    document.getElementById("pdf-stat-pages").textContent = numPages;
    document.getElementById("pdf-stat-chapters").textContent = Object.keys(pdfParsedChapters).length;
    document.getElementById("pdf-stat-words").textContent = parsedWords.length;
    
    progressContainer.style.display = "none";
    summaryStats.style.display = "block";
    
    renderPDFChaptersList(chapterCounts);
    renderPDFWordsPreview();
    
    showToast(`Đã phân tích xong PDF! Quét được ${parsedWords.length} từ vựng N3.`, "success");
    
  } catch (err) {
    console.error("Lỗi parse PDF:", err);
    progressContainer.style.display = "none";
    showToast("Không thể đọc tệp PDF. Đảm bảo file không bị lỗi!", "error");
  }
}

function renderPDFChaptersList(chapterCounts) {
  const container = document.getElementById("pdf-chapters-list-container");
  container.innerHTML = "";
  
  const chapters = Object.keys(pdfParsedChapters);
  if (chapters.length === 0) {
    container.innerHTML = '<div class="chapters-empty-placeholder">Không tìm thấy chương học</div>';
    return;
  }
  
  chapters.forEach((chap, idx) => {
    const count = chapterCounts[chap] || 0;
    const row = document.createElement("div");
    row.className = "chapter-checkbox-row active";
    row.innerHTML = `
      <input type="checkbox" id="chk-pdf-chap-${idx}" checked data-chapter="${chap}">
      <div class="chapter-checkbox-label">
        <span>${chap}</span>
        <span class="chapter-word-count-badge">${count} từ vựng</span>
      </div>
    `;
    container.appendChild(row);
    
    // Toggle class and refresh preview table on change
    row.querySelector("input").addEventListener("change", (e) => {
      if (e.target.checked) {
        row.classList.add("active");
      } else {
        row.classList.remove("active");
      }
      renderPDFWordsPreview();
    });
  });
}

function renderPDFWordsPreview() {
  const tbody = document.getElementById("pdf-words-preview-body");
  const emptyPlaceholder = document.getElementById("pdf-words-empty");
  tbody.innerHTML = "";
  
  const checkedChapters = [];
  document.querySelectorAll('#pdf-chapters-list-container input[type="checkbox"]').forEach(chk => {
    if (chk.checked) {
      checkedChapters.push(chk.getAttribute("data-chapter"));
    }
  });
  
  let list = [];
  checkedChapters.forEach(chap => {
    if (pdfParsedChapters[chap]) {
      list = [...list, ...pdfParsedChapters[chap]];
    }
  });
  
  if (list.length === 0) {
    emptyPlaceholder.style.display = "flex";
  } else {
    emptyPlaceholder.style.display = "none";
    
    // Performance optimization: limit visual preview items to first 100
    const limit = Math.min(list.length, 100);
    for (let i = 0; i < limit; i++) {
      const word = list[i];
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-size: 0.75rem; color: var(--text-secondary); max-width: 140px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${word.chapter}</td>
        <td style="font-family: var(--font-jp); font-weight: 600;">${word.kanji}</td>
        <td style="font-family: var(--font-jp); color: var(--text-secondary);">${word.hiragana || '-'}</td>
        <td style="color: #ff80bf; font-weight: 600; font-size: 0.8rem;">${word.hanviet || '-'}</td>
        <td>${word.meaning}</td>
      `;
      tbody.appendChild(tr);
    }
    
    if (list.length > 100) {
      const extraTr = document.createElement("tr");
      extraTr.innerHTML = `
        <td colspan="5" style="text-align: center; color: var(--text-secondary); font-style: italic; padding: 12px; font-size: 0.8rem;">
          ... và ${list.length - 100} từ khác đang chờ để nhập ...
        </td>
      `;
      extraTr.style.background = "transparent";
      tbody.appendChild(extraTr);
    }
  }
}

function importSelectedPDFChapters() {
  const checkedChapters = [];
  document.querySelectorAll('#pdf-chapters-list-container input[type="checkbox"]').forEach(chk => {
    if (chk.checked) {
      checkedChapters.push(chk.getAttribute("data-chapter"));
    }
  });
  
  if (checkedChapters.length === 0) {
    showToast("Vui lòng chọn ít nhất một chương để nhập!", "error");
    return;
  }
  
  let importedWordsCount = 0;
  checkedChapters.forEach(chap => {
    if (pdfParsedChapters[chap]) {
      vocabList = [...vocabList, ...pdfParsedChapters[chap]];
      importedWordsCount += pdfParsedChapters[chap].length;
    }
  });
  
  if (importedWordsCount > 0) {
    saveVocabList();
    updateGlobalStats();
    populateChapterDropdown();
    renderVocabTable();
    
    // Set the filter select focus on the first newly imported chapter
    activeChapterFilter = checkedChapters[0];
    document.getElementById("player-chapter-select").value = activeChapterFilter;
    
    currentIndex = 0;
    historyStack = [];
    historyIndex = -1;
    displayCurrentWord();
    
    showToast(`Đã nhập thành công ${importedWordsCount} từ vựng từ ${checkedChapters.length} chương!`, "success");
    
    // Reset wizard workspace
    document.getElementById("pdf-summary-stats").style.display = "none";
    document.getElementById("pdf-drop-zone").style.display = "block";
    document.getElementById("pdf-chapters-list-container").innerHTML = '<div class="chapters-empty-placeholder">Chưa tải file PDF</div>';
    document.getElementById("pdf-words-preview-body").innerHTML = "";
    document.getElementById("pdf-words-empty").style.display = "flex";
    
    // Automatically redirect back to Player tab
    document.getElementById("nav-player").click();
  }
}

// ==========================================================================
// 11. PROGRESSIVE WEB APP (PWA) SERVICE WORKER REGISTRATION
// ==========================================================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then((reg) => console.log("[PWA] Service Worker registered successfully:", reg.scope))
      .catch((err) => console.error("[PWA] Service Worker registration failed:", err));
  });
}

