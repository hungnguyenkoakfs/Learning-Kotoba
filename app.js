// Kotoba Booster - Application Logic

// ==========================================================================
// 1. STATE & CONSTANTS
// ==========================================================================

let categoriesList = [];
let vocabList = []; // acts as Vocab_Bank cache
let activePlaylist = []; // compiled dynamic study playlist
let historyStack = [];
let historyIndex = -1;
let currentIndex = -1;
let currentSelectedCategoryId = "all"; // selected node in category tree
let activeTickedCategories = []; // category IDs checked in playlist builder
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
let progressAccumulated = 0; // Khai báo ngăn rò rỉ biến toàn cục

// Animation timer variables
let progressAnimId = null;

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
  { kanji: "電話", hiragana: "деんわ", hanviet: "ĐIỆN THOẠI", meaning: "Điện thoại" },
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
  pdfStatWords: null,
  
  // New Relational UI elements
  playerPlaylistTree: null,
  workspaceCategoryTree: null,
  currentCategoryLabel: null,
  currentGridCount: null,
  btnAddWordModal: null,
  btnAddCategory: null,
  btnBulkRemoveRelation: null,
  btnBulkDeletePermanent: null,
  headerSelectAll: null,
  addWordModal: null,
  btnCloseWordModal: null,
  modalAddForm: null,
  modalAddTargetCategory: null,
  modalInputKanji: null,
  modalInputHiragana: null,
  modalInputHanviet: null,
  modalInputMeaning: null,
  modalInputTagTudongtu: null,
  modalInputTagThadongtu: null,
  btnStartLearning: null
};

function cacheDOMElements() {
  DOM.totalWordsCount = document.getElementById("total-words-count");
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
  
  // Cache new Relational UI elements
  DOM.playerPlaylistTree = document.getElementById("player-playlist-tree");
  DOM.workspaceCategoryTree = document.getElementById("workspace-category-tree");
  DOM.currentCategoryLabel = document.getElementById("current-category-label");
  DOM.currentGridCount = document.getElementById("current-grid-count");
  DOM.btnAddWordModal = document.getElementById("btn-add-word-modal");
  DOM.btnAddCategory = document.getElementById("btn-add-category");
  DOM.btnBulkRemoveRelation = document.getElementById("btn-bulk-remove-relation");
  DOM.btnBulkDeletePermanent = document.getElementById("btn-bulk-delete-permanent");
  DOM.headerSelectAll = document.getElementById("header-select-all");
  DOM.addWordModal = document.getElementById("add-word-modal");
  DOM.btnCloseWordModal = document.getElementById("btn-close-word-modal");
  DOM.modalAddForm = document.getElementById("modal-add-form");
  DOM.modalAddTargetCategory = document.getElementById("modal-add-target-category");
  DOM.modalInputKanji = document.getElementById("modal-input-kanji");
  DOM.modalInputHiragana = document.getElementById("modal-input-hiragana");
  DOM.modalInputHanviet = document.getElementById("modal-input-hanviet");
  DOM.modalInputMeaning = document.getElementById("modal-input-meaning");
  DOM.modalInputTagTudongtu = document.getElementById("modal-input-tag-tudongtu");
  DOM.modalInputTagThadongtu = document.getElementById("modal-input-tag-thadongtu");
  DOM.btnStartLearning = document.getElementById("btn-start-learning");
}

// ==========================================================================
// 2. ASYNC INDEXEDDB & APP INITIALIZATION
// ==========================================================================

const DB_NAME = "KotobaBoosterDB";
const DB_VERSION = 3; // Nâng lên phiên bản 3 để tạo chỉ mục
const CAT_STORE = "categories";
const VOCAB_STORE = "vocab_bank";

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
        console.warn("IndexedDB failed to open", e);
        resolve(null);
      };
      
      request.onsuccess = (e) => {
        resolve(e.target.result);
      };
      
      request.onblocked = (e) => {
        console.warn("IndexedDB open blocked! Please close other tabs running Kotoba Booster.", e);
        resolve(null);
      };
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        // Remove legacy store
        if (db.objectStoreNames.contains("vocabulary")) {
          db.deleteObjectStore("vocabulary");
        }
        
        let catStore;
        if (!db.objectStoreNames.contains(CAT_STORE)) {
          catStore = db.createObjectStore(CAT_STORE, { keyPath: "id", autoIncrement: true });
        } else {
          catStore = e.currentTarget.transaction.objectStore(CAT_STORE);
        }
        
        let vocabStore;
        if (!db.objectStoreNames.contains(VOCAB_STORE)) {
          vocabStore = db.createObjectStore(VOCAB_STORE, { keyPath: "id", autoIncrement: true });
        } else {
          vocabStore = e.currentTarget.transaction.objectStore(VOCAB_STORE);
        }
        
        // Tạo chỉ mục cho từ vựng an toàn
        if (!vocabStore.indexNames.contains("categoryIds")) {
          vocabStore.createIndex("categoryIds", "categoryIds", { unique: false, multiEntry: true });
        }
        if (!vocabStore.indexNames.contains("source")) {
          vocabStore.createIndex("source", "source", { unique: false });
        }
      };
    } catch (e) {
      console.warn("Error opening IndexedDB", e);
      resolve(null);
    }
  });
}

async function loadDatabaseFromDB() {
  const db = await initDB();
  if (!db) {
    try {
      const catData = localStorage.getItem("kotoba_categories");
      const vocabData = localStorage.getItem("kotoba_vocab_bank");
      return {
        categories: catData ? JSON.parse(catData) : [],
        vocab: vocabData ? JSON.parse(vocabData) : []
      };
    } catch(e) {
      return { categories: [], vocab: [] };
    }
  }
  
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([CAT_STORE, VOCAB_STORE], "readonly");
      const catStore = transaction.objectStore(CAT_STORE);
      const vocabStore = transaction.objectStore(VOCAB_STORE);
      
      const catRequest = catStore.getAll();
      catRequest.onsuccess = (e) => {
        const categories = e.target.result || [];
        const vocabRequest = vocabStore.getAll();
        vocabRequest.onsuccess = (ev) => {
          const vocab = ev.target.result || [];
          resolve({ categories, vocab });
        };
        vocabRequest.onerror = () => resolve({ categories, vocab: [] });
      };
      catRequest.onerror = () => resolve({ categories: [], vocab: [] });
    } catch (err) {
      console.warn("IndexedDB read transaction failed, trying localStorage fallback", err);
      try {
        const catData = localStorage.getItem("kotoba_categories");
        const vocabData = localStorage.getItem("kotoba_vocab_bank");
        resolve({
          categories: catData ? JSON.parse(catData) : [],
          vocab: vocabData ? JSON.parse(vocabData) : []
        });
      } catch(e) {
        resolve({ categories: [], vocab: [] });
      }
    }
  });
}

async function saveDatabaseToDB(categories, vocab) {
  try {
    localStorage.setItem("kotoba_categories", JSON.stringify(categories));
    localStorage.setItem("kotoba_vocab_bank", JSON.stringify(vocab));
  } catch (lsError) {
    console.warn("LocalStorage backup quota exceeded", lsError);
  }
  
  const db = await initDB();
  if (!db) return false;
  
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([CAT_STORE, VOCAB_STORE], "readwrite");
      const catStore = transaction.objectStore(CAT_STORE);
      const vocabStore = transaction.objectStore(VOCAB_STORE);
      
      const clearCat = catStore.clear();
      clearCat.onsuccess = () => {
        categories.forEach(cat => catStore.add(cat));
      };
      
      const clearVocab = vocabStore.clear();
      clearVocab.onsuccess = () => {
        vocab.forEach(word => vocabStore.add(word));
        resolve(true);
      };
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => resolve(false);
    } catch (err) {
      console.error("IndexedDB write transaction failed", err);
      resolve(false);
    }
  });
}

// ==========================================================================
// HÀM LƯU TRỮ GIA TĂNG HIỆU NĂNG CAO (INCREMENTAL INDEXEDDB HELPERS)
// ==========================================================================

async function saveWordToDB(word, isNew = false) {
  try {
    localStorage.setItem("kotoba_vocab_bank", JSON.stringify(vocabList));
  } catch (lsError) {
    console.warn("LocalStorage backup quota exceeded", lsError);
  }
  
  const db = await initDB();
  if (!db) return false;
  
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([VOCAB_STORE], "readwrite");
      const store = transaction.objectStore(VOCAB_STORE);
      const request = isNew ? store.add(word) : store.put(word);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch (err) {
      console.error("IndexedDB saveWordToDB failed", err);
      resolve(false);
    }
  });
}

async function deleteWordFromDB(wordId) {
  try {
    localStorage.setItem("kotoba_vocab_bank", JSON.stringify(vocabList));
  } catch (lsError) {
    console.warn("LocalStorage backup quota exceeded", lsError);
  }
  
  const db = await initDB();
  if (!db) return false;
  
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([VOCAB_STORE], "readwrite");
      const store = transaction.objectStore(VOCAB_STORE);
      const request = store.delete(wordId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch (err) {
      console.error("IndexedDB deleteWordFromDB failed", err);
      resolve(false);
    }
  });
}

async function bulkDeleteWordsFromDB(wordIds) {
  try {
    localStorage.setItem("kotoba_vocab_bank", JSON.stringify(vocabList));
  } catch (lsError) {
    console.warn("LocalStorage backup quota exceeded", lsError);
  }
  
  const db = await initDB();
  if (!db) return false;
  
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([VOCAB_STORE], "readwrite");
      const store = transaction.objectStore(VOCAB_STORE);
      wordIds.forEach(id => store.delete(id));
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => resolve(false);
    } catch (err) {
      console.error("IndexedDB bulkDeleteWordsFromDB failed", err);
      resolve(false);
    }
  });
}

async function saveCategoryToDB(cat, isNew = false) {
  try {
    localStorage.setItem("kotoba_categories", JSON.stringify(categoriesList));
  } catch (lsError) {
    console.warn("LocalStorage backup quota exceeded", lsError);
  }
  
  const db = await initDB();
  if (!db) return false;
  
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([CAT_STORE], "readwrite");
      const store = transaction.objectStore(CAT_STORE);
      const request = isNew ? store.add(cat) : store.put(cat);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch (err) {
      console.error("IndexedDB saveCategoryToDB failed", err);
      resolve(false);
    }
  });
}

async function deleteCategoryFromDB(catId) {
  try {
    localStorage.setItem("kotoba_categories", JSON.stringify(categoriesList));
  } catch (lsError) {
    console.warn("LocalStorage backup quota exceeded", lsError);
  }
  
  const db = await initDB();
  if (!db) return false;
  
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([CAT_STORE], "readwrite");
      const store = transaction.objectStore(CAT_STORE);
      const request = store.delete(catId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch (err) {
      console.error("IndexedDB deleteCategoryFromDB failed", err);
      resolve(false);
    }
  });
}

// Tree view helper functions
function isLeafCategory(catId) {
  return !categoriesList.some(cat => cat.parentId === catId);
}

function getDescendantCategoryIds(catId) {
  let descendants = [];
  const children = categoriesList.filter(c => c.parentId === catId);
  children.forEach(child => {
    descendants.push(child.id);
    descendants = descendants.concat(getDescendantCategoryIds(child.id));
  });
  return descendants;
}

function getAncestorCategoryIds(catId) {
  let ancestors = [];
  const cat = categoriesList.find(c => c.id === catId);
  if (cat && cat.parentId !== null) {
    ancestors.push(cat.parentId);
    ancestors = ancestors.concat(getAncestorCategoryIds(cat.parentId));
  }
  return ancestors;
}

// Compile dynamic playlist from checked categories and source filters
function compilePlaylist() {
  const filterPreset = document.getElementById("filter-source-preset") ? document.getElementById("filter-source-preset").checked : true;
  const filterPdf = document.getElementById("filter-source-pdf") ? document.getElementById("filter-source-pdf").checked : true;
  const filterExcel = document.getElementById("filter-source-excel") ? document.getElementById("filter-source-excel").checked : true;
  const filterManual = document.getElementById("filter-source-manual") ? document.getElementById("filter-source-manual").checked : true;
  
  const filterTudongtu = document.getElementById("filter-tag-tudongtu") ? document.getElementById("filter-tag-tudongtu").checked : false;
  const filterThadongtu = document.getElementById("filter-tag-thadongtu") ? document.getElementById("filter-tag-thadongtu").checked : false;
  
  let compiled = vocabList.filter(word => {
    // 1. Category Membership
    const matchesCategory = word.categoryIds && word.categoryIds.some(catId => activeTickedCategories.includes(catId));
    if (!matchesCategory) return false;
    
    // 2. Source Filters
    if (word.source === "preset" && !filterPreset) return false;
    if (word.source === "pdf" && !filterPdf) return false;
    if (word.source === "excel" && !filterExcel) return false;
    if (word.source === "manual" && !filterManual) return false;
    
    // 3. Tag Filters
    if (filterTudongtu || filterThadongtu) {
      const isTu = word.tags && word.tags.includes("Tự động từ");
      const isTha = word.tags && word.tags.includes("Tha động từ");
      
      if (filterTudongtu && filterThadongtu) {
        if (!isTu && !isTha) return false;
      } else if (filterTudongtu) {
        if (!isTu) return false;
      } else if (filterThadongtu) {
        if (!isTha) return false;
      }
    }
    
    return true;
  });
  
  activePlaylist = compiled;
  return activePlaylist;
}

function getActivePlaylist() {
  if (activePlaylist.length === 0) {
    compilePlaylist();
  }
  return activePlaylist;
}

document.addEventListener("DOMContentLoaded", async () => {
  // Cache all DOM elements into global registry
  cacheDOMElements();

  // Load database from IndexedDB or localStorage fallback
  await loadVocabList();
  updateGlobalStats();
  
  // Render manager trees and playlists
  renderManagerTree();
  renderPlayerPlaylistTree();
  
  // Start speech synthesis setup
  setupSpeechSynthesis();

  // Bind all UI interaction listeners
  bindEvents();
  
  // Set initial player view index and start ticking
  const list = getActivePlaylist();
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

// Load vocabulary and categories from relational stores with migrations
async function loadVocabList() {
  let dbData = { categories: [], vocab: [] };
  try {
    dbData = await loadDatabaseFromDB();
  } catch (e) {
    console.error("Lỗi khi load danh sách dữ liệu:", e);
  }
  
  categoriesList = dbData.categories || [];
  vocabList = dbData.vocab || [];
  
  // Explicit First-Time Seeding Flag in localStorage (safe deduplication against IndexedDB data)
  const isInitialized = localStorage.getItem("kotoba_database_initialized") || (categoriesList.length > 0 || vocabList.length > 0);
  
  // Seed default N5-N4 preset on very first startup only when DB is completely empty
  if (!isInitialized && categoriesList.length === 0 && vocabList.length === 0) {
    categoriesList = [
      { id: 1, name: "Từ vựng mẫu N5-N4", parentId: null },
      { id: 2, name: "Chương 1: Khởi động", parentId: 1 },
      { id: 3, name: "Chương 2: Tăng tốc", parentId: 1 }
    ];
    
    vocabList = presetVocabulary.map((item, idx) => {
      const targetChapterId = idx < 20 ? 2 : 3;
      return {
        id: idx + 1,
        kanji: item.kanji,
        hiragana: item.hiragana,
        hanviet: item.hanviet || "",
        meaning: item.meaning,
        source: "preset",
        categoryIds: [targetChapterId],
        tags: []
      };
    });
    
    await saveVocabList();
    localStorage.setItem("kotoba_database_initialized", "true");
    console.log("[Kotoba Booster] Seeded default preset vocabulary on very first startup.");
  }
  
  // Backwards compatibility migration check
  let migrationNeeded = false;
  
  categoriesList.forEach((cat, idx) => {
    if (!cat.id) {
      cat.id = idx + 1;
      migrationNeeded = true;
    }
  });
  
  vocabList.forEach((word, idx) => {
    if (!word.id) {
      word.id = idx + 1;
      migrationNeeded = true;
    }
    if (!word.categoryIds || !Array.isArray(word.categoryIds)) {
      word.categoryIds = [2]; // Fallback to Chapter 1
      migrationNeeded = true;
    }
    if (!word.source) {
      word.source = "preset";
      migrationNeeded = true;
    }
    if (!word.tags || !Array.isArray(word.tags)) {
      word.tags = [];
      migrationNeeded = true;
    }
  });
  
  if (migrationNeeded) {
    await saveVocabList();
  }
  
  // Checkboxes initialization (all checked)
  activeTickedCategories = categoriesList
    .filter(cat => isLeafCategory(cat.id))
    .map(cat => cat.id);
  
  compilePlaylist();
}

async function saveVocabList() {
  try {
    await saveDatabaseToDB(categoriesList, vocabList);
  } catch (e) {
    console.error("Lỗi khi ghi dữ liệu từ vựng vào bộ nhớ:", e);
  }
}

// Global visual stats updater
function updateGlobalStats() {
  if (DOM.totalWordsCount) {
    DOM.totalWordsCount.textContent = vocabList.length;
  }
  updateRatioIndicator();
}

function updateRatioIndicator(list) {
  const ratioEl = DOM.playerProgressRatio;
  if (!ratioEl) return;
  
  const targetList = list || getActivePlaylist();
  if (targetList.length === 0) {
    ratioEl.textContent = "0 / 0 từ";
  } else {
    ratioEl.textContent = `${currentIndex + 1} / ${targetList.length} từ`;
  }
}

// Category Trees Renderers
function renderManagerTree() {
  const container = DOM.workspaceCategoryTree;
  if (!container) return;
  
  container.innerHTML = "";
  
  function buildTreeNodeHTML(cat, depth) {
    const children = categoriesList.filter(c => c.parentId === cat.id);
    const hasChildren = children.length > 0;
    const isActive = currentSelectedCategoryId === cat.id;
    
    const nodeDiv = document.createElement("div");
    nodeDiv.className = `tree-node ${depth === 0 ? 'root-node' : ''}`;
    nodeDiv.setAttribute("data-id", cat.id);
    
    const isExpandedKey = `tree_expanded_${cat.id}`;
    const isExpanded = localStorage.getItem(isExpandedKey) !== "false";
    
    const contentDiv = document.createElement("div");
    contentDiv.className = `tree-node-content ${isActive ? 'active' : ''}`;
    
    const arrowSpan = document.createElement("span");
    arrowSpan.className = `tree-node-arrow ${isExpanded ? 'expanded' : ''}`;
    arrowSpan.innerHTML = hasChildren ? "&#9656;" : "";
    contentDiv.appendChild(arrowSpan);
    
    const iconSpan = document.createElement("span");
    iconSpan.className = "tree-node-icon";
    iconSpan.innerHTML = `<i data-lucide="${hasChildren ? 'folder' : 'folder-open'}"></i>`;
    contentDiv.appendChild(iconSpan);
    
    const labelSpan = document.createElement("span");
    labelSpan.className = "tree-node-label";
    labelSpan.textContent = cat.name;
    contentDiv.appendChild(labelSpan);
    
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "tree-node-actions";
    
    const btnAddSub = document.createElement("button");
    btnAddSub.className = "btn-tree-action";
    btnAddSub.title = "Thêm thư mục con";
    btnAddSub.innerHTML = `<i data-lucide="plus"></i>`;
    btnAddSub.addEventListener("click", (e) => {
      e.stopPropagation();
      const name = prompt(`Nhập tên thư mục con cho "${cat.name}":`);
      if (name && name.trim()) {
        addNewCategory(name.trim(), cat.id);
      }
    });
    actionsDiv.appendChild(btnAddSub);
    
    const btnDelete = document.createElement("button");
    btnDelete.className = "btn-tree-action delete";
    btnDelete.title = "Xóa thư mục này";
    btnDelete.innerHTML = `<i data-lucide="trash-2"></i>`;
    btnDelete.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`Bạn có chắc chắn muốn xóa thư mục "${cat.name}" không? (Tất cả thư mục con bên trong cũng sẽ bị xóa. Các từ thuộc thư mục này sẽ vẫn được giữ trong kho từ vựng gốc)`)) {
        deleteCategory(cat.id);
      }
    });
    actionsDiv.appendChild(btnDelete);
    
    contentDiv.appendChild(actionsDiv);
    nodeDiv.appendChild(contentDiv);
    
    if (hasChildren) {
      const childrenDiv = document.createElement("div");
      childrenDiv.className = `tree-children ${isExpanded ? 'expanded' : ''}`;
      
      children.forEach(child => {
        childrenDiv.appendChild(buildTreeNodeHTML(child, depth + 1));
      });
      
      nodeDiv.appendChild(childrenDiv);
      
      arrowSpan.addEventListener("click", (e) => {
        e.stopPropagation();
        const expanded = childrenDiv.classList.toggle("expanded");
        arrowSpan.classList.toggle("expanded", expanded);
        localStorage.setItem(isExpandedKey, expanded ? "true" : "false");
      });
    }
    
    contentDiv.addEventListener("click", (e) => {
      if (e.target.closest(".tree-node-actions")) return;
      
      currentSelectedCategoryId = cat.id;
      document.querySelectorAll(".tree-node-content").forEach(el => el.classList.remove("active"));
      contentDiv.classList.add("active");
      
      if (DOM.currentCategoryLabel) {
        DOM.currentCategoryLabel.textContent = cat.name;
      }
      
      renderVocabTable();
    });
    
    return nodeDiv;
  }
  
  const rootCats = categoriesList.filter(c => c.parentId === null);
  
  const allNode = document.createElement("div");
  allNode.className = "tree-node root-node";
  const allContent = document.createElement("div");
  allContent.className = `tree-node-content ${currentSelectedCategoryId === 'all' ? 'active' : ''}`;
  allContent.innerHTML = `
    <span class="tree-node-arrow"></span>
    <span class="tree-node-icon"><i data-lucide="layers"></i></span>
    <span class="tree-node-label" style="font-weight: 500;">Tất cả từ vựng</span>
  `;
  allContent.addEventListener("click", () => {
    currentSelectedCategoryId = "all";
    document.querySelectorAll(".tree-node-content").forEach(el => el.classList.remove("active"));
    allContent.classList.add("active");
    if (DOM.currentCategoryLabel) DOM.currentCategoryLabel.textContent = "Tất cả từ vựng";
    renderVocabTable();
  });
  allNode.appendChild(allContent);
  container.appendChild(allNode);
  
  rootCats.forEach(cat => {
    container.appendChild(buildTreeNodeHTML(cat, 0));
  });
  
  lucide.createIcons();
}

async function addNewCategory(name, parentId = null) {
  const newCat = {
    id: Date.now(),
    name: name,
    parentId: parentId
  };
  categoriesList.push(newCat);
  await saveCategoryToDB(newCat, true);
  renderManagerTree();
  renderPlayerPlaylistTree();
  showToast(`Đã tạo thư mục "${name}"!`, "success");
}

async function deleteCategory(catId) {
  const toDelete = [catId, ...getDescendantCategoryIds(catId)];
  
  categoriesList = categoriesList.filter(cat => !toDelete.includes(cat.id));
  
  vocabList.forEach(word => {
    if (word.categoryIds) {
      word.categoryIds = word.categoryIds.filter(id => !toDelete.includes(id));
    }
  });
  
  if (toDelete.includes(currentSelectedCategoryId)) {
    currentSelectedCategoryId = "all";
    if (DOM.currentCategoryLabel) DOM.currentCategoryLabel.textContent = "Tất cả từ vựng";
  }
  
  activeTickedCategories = activeTickedCategories.filter(id => !toDelete.includes(id));
  
  await saveVocabList();
  renderManagerTree();
  renderPlayerPlaylistTree();
  compilePlaylist();
  renderVocabTable();
  showToast(`Đã xóa thư mục thành công!`, "info");
}

function renderPlayerPlaylistTree() {
  const container = DOM.playerPlaylistTree;
  if (!container) return;
  
  container.innerHTML = "";
  
  function buildPlaylistCheckboxHTML(cat, depth) {
    const children = categoriesList.filter(c => c.parentId === cat.id);
    const hasChildren = children.length > 0;
    const isChecked = activeTickedCategories.includes(cat.id);
    
    const nodeDiv = document.createElement("div");
    nodeDiv.className = `playlist-tree-node ${depth === 0 ? 'root-node' : ''}`;
    
    const contentDiv = document.createElement("div");
    contentDiv.className = "playlist-tree-content";
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `chk-play-cat-${cat.id}`;
    checkbox.checked = isChecked;
    
    const label = document.createElement("label");
    label.className = "playlist-tree-label";
    label.setAttribute("for", checkbox.id);
    
    const allDescendantIds = [cat.id, ...getDescendantCategoryIds(cat.id)];
    const wordCount = vocabList.filter(word => 
      word.categoryIds && word.categoryIds.some(id => allDescendantIds.includes(id))
    ).length;
    
    label.textContent = `${cat.name} (${wordCount} từ)`;
    
    contentDiv.appendChild(checkbox);
    contentDiv.appendChild(label);
    nodeDiv.appendChild(contentDiv);
    
    checkbox.addEventListener("change", (e) => {
      const checked = e.target.checked;
      const descendants = getDescendantCategoryIds(cat.id);
      
      if (checked) {
        if (!activeTickedCategories.includes(cat.id)) activeTickedCategories.push(cat.id);
        descendants.forEach(id => {
          if (!activeTickedCategories.includes(id)) activeTickedCategories.push(id);
        });
      } else {
        activeTickedCategories = activeTickedCategories.filter(id => id !== cat.id && !descendants.includes(id));
      }
      
      descendants.forEach(id => {
        const chk = document.getElementById(`chk-play-cat-${id}`);
        if (chk) chk.checked = checked;
      });
      
      bubblePlaylistCheckboxChange(cat.id, checked);
      compilePlaylist();
    });
    
    if (hasChildren) {
      const childrenDiv = document.createElement("div");
      childrenDiv.className = "tree-children expanded";
      
      children.forEach(child => {
        childrenDiv.appendChild(buildPlaylistCheckboxHTML(child, depth + 1));
      });
      nodeDiv.appendChild(childrenDiv);
    }
    
    return nodeDiv;
  }
  
  const rootCats = categoriesList.filter(c => c.parentId === null);
  rootCats.forEach(cat => {
    container.appendChild(buildPlaylistCheckboxHTML(cat, 0));
  });
}

function bubblePlaylistCheckboxChange(catId, checked) {
  const cat = categoriesList.find(c => c.id === catId);
  if (!cat || cat.parentId === null) return;
  
  const parentId = cat.parentId;
  const siblings = categoriesList.filter(c => c.parentId === parentId);
  
  const parentChk = document.getElementById(`chk-play-cat-${parentId}`);
  if (!parentChk) return;
  
  if (checked) {
    const allSiblingsChecked = siblings.every(sib => {
      const chk = document.getElementById(`chk-play-cat-${sib.id}`);
      return chk ? chk.checked : false;
    });
    
    if (allSiblingsChecked) {
      parentChk.checked = true;
      if (!activeTickedCategories.includes(parentId)) activeTickedCategories.push(parentId);
      bubblePlaylistCheckboxChange(parentId, true);
    }
  } else {
    parentChk.checked = false;
    activeTickedCategories = activeTickedCategories.filter(id => id !== parentId);
    bubblePlaylistCheckboxChange(parentId, false);
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
    const list = getActivePlaylist();
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
  const targetList = list || getActivePlaylist();
  if (targetList.length === 0) return;
  
  selectNextWordIndex(targetList);
  displayCurrentWord(targetList);
}

function showPrevWord(list) {
  const targetList = list || getActivePlaylist();
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
  const targetList = list || getActivePlaylist();
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
  const targetList = list || getActivePlaylist();
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

// ==========================================================================
// 7. VOCABULARY CRUD MANAGEMENT (MANAGER PANEL)
// ==========================================================================

let vocabTableLimit = 100;

function renderVocabTable(loadMore = false) {
  const tbody = DOM.vocabTableBody;
  const placeholder = DOM.noWordsPlaceholder;
  const searchInput = DOM.vocabSearchInput;
  if (!tbody || !placeholder || !searchInput) return;
  
  if (!loadMore) {
    vocabTableLimit = 100;
  }
  
  const filterText = searchInput.value.trim().toLowerCase();
  
  // Filter by category selection
  let list = vocabList;
  if (currentSelectedCategoryId !== "all") {
    list = vocabList.filter(word => 
      word.categoryIds && word.categoryIds.includes(currentSelectedCategoryId)
    );
  }
  
  // Filter by Search input
  const filteredList = list.filter(item => {
    return (
      (item.kanji && item.kanji.toLowerCase().includes(filterText)) ||
      (item.hiragana && item.hiragana.toLowerCase().includes(filterText)) ||
      (item.hanviet && item.hanviet.toLowerCase().includes(filterText)) ||
      (item.meaning && item.meaning.toLowerCase().includes(filterText))
    );
  });
  
  // Update count badge
  if (DOM.currentGridCount) {
    DOM.currentGridCount.textContent = filteredList.length;
  }
  
  // Reset select-all header checkbox
  if (DOM.headerSelectAll) {
    DOM.headerSelectAll.checked = false;
  }
  
  if (filteredList.length === 0) {
    tbody.innerHTML = "";
    placeholder.style.display = "flex";
  } else {
    placeholder.style.display = "none";
    
    // Slice list to limit
    const itemsToRender = filteredList.slice(0, vocabTableLimit);
    
    let html = "";
    itemsToRender.forEach((word) => {
      html += `
        <tr data-id="${word.id}">
          <td class="checkbox-col">
            <input type="checkbox" class="row-selector" data-id="${word.id}">
          </td>
          <td class="editable-cell" data-field="kanji" style="font-weight: 600; font-family: var(--font-jp);">${word.kanji}</td>
          <td class="editable-cell" data-field="hiragana" style="font-family: var(--font-jp);">${word.hiragana || '<span style="opacity:0.3">-</span>'}</td>
          <td class="editable-cell" data-field="hanviet">${word.hanviet ? `<span class="hanviet-badge" style="font-size: 0.75rem; padding: 2px 8px;">${word.hanviet}</span>` : '<span style="opacity:0.3">-</span>'}</td>
          <td class="editable-cell" data-field="meaning">${word.meaning}</td>
          <td class="text-center">
            <div class="row-actions">
              <button class="btn-row-action btn-row-delete" data-id="${word.id}" title="Xóa vĩnh viễn khỏi toàn hệ thống">
                <i data-lucide="trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    
    // If there are more items, add a Load More row
    if (filteredList.length > vocabTableLimit) {
      html += `
        <tr id="load-more-row" style="background: transparent;">
          <td colspan="6" style="text-align: center; padding: 15px;">
            <button id="btn-load-more" class="btn-load-more" style="background: var(--primary); color: #fff; border: none; padding: 8px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
              Xem thêm (còn ${filteredList.length - vocabTableLimit} từ)...
            </button>
          </td>
        </tr>
      `;
    }
    
    tbody.innerHTML = html;
    
    // Bind click event to load more button
    const btnLoadMore = document.getElementById("btn-load-more");
    if (btnLoadMore) {
      btnLoadMore.addEventListener("click", () => {
        vocabTableLimit += 100;
        renderVocabTable(true);
      });
    }
    
    // Refresh Lucide Icons for table trash icons
    lucide.createIcons();
    
    // Bind Double Click Inline Cell Editing listeners
    bindInlineEditListeners();
  }
}

function bindInlineEditListeners() {
  const tbody = DOM.vocabTableBody;
  if (!tbody) return;
  
  tbody.querySelectorAll(".editable-cell").forEach(cell => {
    cell.addEventListener("dblclick", () => {
      if (cell.querySelector(".inline-edit-input")) return;
      
      const tr = cell.closest("tr");
      const wordId = parseInt(tr.getAttribute("data-id"));
      const field = cell.getAttribute("data-field");
      
      const word = vocabList.find(w => w.id === wordId);
      if (!word) return;
      
      let rawVal = word[field] || "";
      
      const input = document.createElement("input");
      input.type = "text";
      input.className = "inline-edit-input";
      input.value = rawVal;
      
      cell.textContent = "";
      cell.appendChild(input);
      input.focus();
      
      let committed = false;
      async function commitEdit() {
        if (committed) return;
        committed = true;
        
        const newVal = input.value.trim();
        if (newVal === "") {
          cell.innerHTML = field === "hanviet" && rawVal ? `<span class="hanviet-badge" style="font-size: 0.75rem; padding: 2px 8px;">${rawVal}</span>` : (rawVal || '<span style="opacity:0.3">-</span>');
          return;
        }
        
        if (field === "hanviet") {
          word[field] = newVal.toUpperCase();
        } else {
          word[field] = newVal;
        }
        
        await saveWordToDB(word, false);
        
        if (field === "hanviet") {
          cell.innerHTML = `<span class="hanviet-badge" style="font-size: 0.75rem; padding: 2px 8px;">${word[field]}</span>`;
        } else {
          cell.textContent = word[field];
        }
        
        compilePlaylist();
        showToast("Đã cập nhật từ vựng thành công!", "success");
        
        const playlist = getActivePlaylist();
        if (playlist.length > 0 && currentIndex !== -1 && playlist[currentIndex] && playlist[currentIndex].id === wordId) {
          displayCurrentWord(playlist);
        }
      }
      
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          commitEdit();
        } else if (e.key === "Escape") {
          cell.innerHTML = field === "hanviet" && rawVal ? `<span class="hanviet-badge" style="font-size: 0.75rem; padding: 2px 8px;">${rawVal}</span>` : (rawVal || '<span style="opacity:0.3">-</span>');
        }
      });
      
      input.addEventListener("blur", () => {
        commitEdit();
      });
    });
  });
}

async function addWordToCurrentCategory(kanji, hiragana, hanviet, meaning, tags = []) {
  if (currentSelectedCategoryId === "all") {
    showToast("Hãy chọn một thư mục trước khi thêm từ vựng mới!", "error");
    return;
  }
  
  const newWord = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    kanji: kanji.trim(),
    hiragana: hiragana.trim() || kanji.trim(),
    hanviet: hanviet.trim().toUpperCase(),
    meaning: meaning.trim(),
    source: "manual",
    categoryIds: [currentSelectedCategoryId],
    tags: tags
  };
  
  vocabList.push(newWord);
  await saveWordToDB(newWord, true);
  updateGlobalStats();
  compilePlaylist();
  renderVocabTable();
  renderPlayerPlaylistTree();
  
  showToast(`Đã thêm từ "${kanji}" vào danh mục thành công!`, "success");
}

async function deleteWordPermanently(wordId) {
  const word = vocabList.find(w => w.id === wordId);
  if (!word) return;
  
  if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn từ "${word.kanji}" khỏi hệ thống?`)) {
    vocabList = vocabList.filter(w => w.id !== wordId);
    await deleteWordFromDB(wordId);
    updateGlobalStats();
    compilePlaylist();
    renderVocabTable();
    renderPlayerPlaylistTree();
    
    const playlist = getActivePlaylist();
    if (playlist.length === 0) {
      currentIndex = -1;
      displayCurrentWord();
    } else if (currentIndex >= playlist.length) {
      currentIndex = playlist.length - 1;
      displayCurrentWord();
    }
    
    showToast(`Đã xóa vĩnh viễn từ "${word.kanji}" khỏi hệ thống!`, "info");
  }
}

async function removeWordFromActiveCategory(wordId) {
  if (currentSelectedCategoryId === "all") {
    showToast("Không thể gỡ thư mục khi đang đứng ở 'Tất cả từ vựng'! Hãy chọn một thư mục cụ thể.", "error");
    return;
  }
  
  const word = vocabList.find(w => w.id === wordId);
  if (!word) return;
  
  word.categoryIds = word.categoryIds.filter(id => id !== currentSelectedCategoryId);
  await saveWordToDB(word, false);
  
  compilePlaylist();
  renderVocabTable();
  renderPlayerPlaylistTree();
  showToast(`Đã gỡ từ "${word.kanji}" ra khỏi thư mục này`, "info");
}

// Bulk Actions Logic
function getSelectedGridWordIds() {
  const checkedSelectors = DOM.vocabTableBody.querySelectorAll(".row-selector:checked");
  const ids = [];
  checkedSelectors.forEach(chk => {
    ids.push(parseInt(chk.getAttribute("data-id")));
  });
  return ids;
}

async function handleBulkDeletePermanent() {
  const ids = getSelectedGridWordIds();
  if (ids.length === 0) {
    showToast("Vui lòng chọn ít nhất một từ để xóa!", "error");
    return;
  }
  
  if (confirm(`Bạn có chắc chắn muốn xóa VĨNH VIỄN ${ids.length} từ đã chọn khỏi hệ thống không?`)) {
    vocabList = vocabList.filter(w => !ids.includes(w.id));
    await bulkDeleteWordsFromDB(ids);
    updateGlobalStats();
    compilePlaylist();
    renderVocabTable();
    renderPlayerPlaylistTree();
    
    const playlist = getActivePlaylist();
    if (playlist.length === 0) {
      currentIndex = -1;
      displayCurrentWord();
    } else if (currentIndex >= playlist.length) {
      currentIndex = playlist.length - 1;
      displayCurrentWord();
    }
    
    showToast(`Đã xóa vĩnh viễn ${ids.length} từ khỏi hệ thống!`, "success");
  }
}

async function handleBulkRemoveRelation() {
  if (currentSelectedCategoryId === "all") {
    showToast("Không thể gỡ thư mục khi đang đứng ở 'Tất cả từ vựng'! Hãy chọn một thư mục cụ thể.", "error");
    return;
  }
  
  const ids = getSelectedGridWordIds();
  if (ids.length === 0) {
    showToast("Vui lòng chọn ít nhất một từ để gỡ khỏi thư mục!", "error");
    return;
  }
  
  if (confirm(`Gỡ bỏ ${ids.length} từ đã chọn ra khỏi thư mục hiện tại? (Từ vựng vẫn tồn tại trong kho gốc)`)) {
    vocabList.forEach(word => {
      if (ids.includes(word.id) && word.categoryIds) {
        word.categoryIds = word.categoryIds.filter(id => id !== currentSelectedCategoryId);
      }
    });
    
    await saveVocabList();
    compilePlaylist();
    renderVocabTable();
    renderPlayerPlaylistTree();
    
    showToast(`Đã gỡ bỏ ${ids.length} từ khỏi thư mục`, "info");
  }
}

function clearAllVocab() {
  if (vocabList.length === 0) return;
  
  if (confirm("Bạn có chắc chắn muốn xóa TOÀN BỘ từ vựng hiện có không?")) {
    vocabList = [];
    categoriesList = [
      { id: 1, name: "Từ vựng mẫu N5-N4", parentId: null },
      { id: 2, name: "Chương 1: Khởi động", parentId: 1 },
      { id: 3, name: "Chương 2: Tăng tốc", parentId: 1 }
    ];
    
    saveVocabList();
    updateGlobalStats();
    renderVocabTable();
    renderManagerTree();
    renderPlayerPlaylistTree();
    
    currentIndex = -1;
    historyStack = [];
    historyIndex = -1;
    displayCurrentWord();
    
    showToast("Đã xóa sạch toàn bộ từ vựng!", "info");
  }
}

function exportDatabase() {
  if (vocabList.length === 0) {
    showToast("Không có dữ liệu để xuất!", "error");
    return;
  }
  
  const fullBackup = {
    categories: categoriesList,
    vocab: vocabList,
    exportTime: Date.now()
  };
  
  const dbContent = JSON.stringify(fullBackup, null, 2);
  const blob = new Blob([dbContent], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kotoba_backup.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast("Đã xuất file lưu trữ JSON thành công!", "success");
}

function importDatabaseFromJSON(file) {
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      // Validation check
      if (!data || !Array.isArray(data.categories) || !Array.isArray(data.vocab)) {
        showToast("Tệp JSON không hợp lệ! Vui lòng chọn tệp được xuất từ Kotoba Booster.", "error");
        return;
      }
      
      if (confirm(`Bạn có chắc chắn muốn nạp dữ liệu từ file "${file.name}" không? Toàn bộ dữ liệu hiện tại trên trình duyệt sẽ được thay thế bằng ${data.vocab.length} từ vựng từ tệp lưu trữ.`)) {
        categoriesList = [...data.categories];
        vocabList = [...data.vocab];
        
        await saveVocabList();
        localStorage.setItem("kotoba_database_initialized", "true");
        updateGlobalStats();
        
        // Render tree and playlist
        currentSelectedCategoryId = "all";
        if (DOM.currentCategoryLabel) DOM.currentCategoryLabel.textContent = "Tất cả từ vựng";
        
        renderManagerTree();
        renderPlayerPlaylistTree();
        
        // Recompile dynamic playlist
        activeTickedCategories = categoriesList
          .filter(cat => isLeafCategory(cat.id))
          .map(cat => cat.id);
          
        compilePlaylist();
        renderVocabTable();
        
        // Reset player display
        currentIndex = 0;
        historyStack = [];
        historyIndex = -1;
        
        const list = getActivePlaylist();
        if (list.length > 0) {
          displayCurrentWord(list);
        } else {
          updatePlayerPlaceholder();
        }
        
        showToast(`Đã nạp thành công ${data.vocab.length} từ vựng từ tệp JSON!`, "success");
      }
    } catch (err) {
      console.error("Lỗi khi đọc tệp JSON:", err);
      showToast("Không thể đọc hoặc parse tệp JSON! File có thể bị lỗi định dạng.", "error");
    }
  };
  
  reader.readAsText(file);
}

function loadPresetVocabulary() {
  if (confirm("Nạp lại bộ từ vựng N5-N4 mẫu của hệ thống? Toàn bộ dữ liệu hiện tại sẽ bị ghi đè.")) {
    categoriesList = [
      { id: 1, name: "Từ vựng mẫu N5-N4", parentId: null },
      { id: 2, name: "Chương 1: Khởi động", parentId: 1 },
      { id: 3, name: "Chương 2: Tăng tốc", parentId: 1 }
    ];
    
    vocabList = presetVocabulary.map((item, idx) => {
      const targetChapterId = idx < 20 ? 2 : 3;
      return {
        id: idx + 1,
        kanji: item.kanji,
        hiragana: item.hiragana,
        hanviet: item.hanviet || "",
        meaning: item.meaning,
        source: "preset",
        categoryIds: [targetChapterId],
        tags: []
      };
    });
    
    saveVocabList();
    updateGlobalStats();
    renderVocabTable();
    renderManagerTree();
    renderPlayerPlaylistTree();
    compilePlaylist();
    
    currentIndex = 0;
    historyStack = [];
    historyIndex = -1;
    displayCurrentWord();
    
    showToast("Đã khôi phục bộ từ vựng mẫu thành công!", "success");
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
      const list = getActivePlaylist();
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
      const playlist = getActivePlaylist();
      if (playlist.length === 0) {
        showToast("Playlist hiện tại trống! Vui lòng tích chọn thư mục.", "error");
        return;
      }
      
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
        const list = getActivePlaylist();
        if (currentIndex !== -1 && list[currentIndex]) {
          speakWord(list[currentIndex].kanji || list[currentIndex].hiragana);
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
      const list = getActivePlaylist();
      if (currentIndex !== -1 && list[currentIndex]) {
        speakWord(list[currentIndex].kanji || list[currentIndex].hiragana);
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
    manualAddForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const kanjiVal = document.getElementById("input-kanji").value;
      const hiraganaVal = document.getElementById("input-hiragana").value;
      const hanvietVal = document.getElementById("input-hanviet").value;
      const meaningVal = document.getElementById("input-meaning").value;
      
      if (currentSelectedCategoryId === "all") {
        alert("Vui lòng chọn một thư mục bên trái trước khi thêm từ!");
        return;
      }
      
      await addWordToCurrentCategory(kanjiVal, hiraganaVal, hanvietVal, meaningVal, []);
      e.target.reset();
      
      // Close manual adder modal
      const modal = document.getElementById("add-word-modal");
      if (modal) {
        modal.classList.remove("active");
      }
    });
  }
  
  // Table Manager triggers
  const btnClearAll = document.getElementById("btn-clear-all");
  const btnLoadPreset = document.getElementById("btn-load-preset");
  const btnImportDb = document.getElementById("btn-import-db");
  const jsonFileInput = document.getElementById("json-file-input");
  const btnExportDb = document.getElementById("btn-export-db");

  if (btnClearAll) btnClearAll.addEventListener("click", clearAllVocab);
  if (btnLoadPreset) btnLoadPreset.addEventListener("click", loadPresetVocabulary);
  
  if (btnImportDb && jsonFileInput) {
    btnImportDb.addEventListener("click", () => jsonFileInput.click());
    jsonFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        importDatabaseFromJSON(file);
        jsonFileInput.value = "";
      }
    });
  }
  
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

  // Playlist Sidebar Toggles
  const filterPreset = document.getElementById("filter-source-preset");
  const filterPdf = document.getElementById("filter-source-pdf");
  const filterExcel = document.getElementById("filter-source-excel");
  const filterManual = document.getElementById("filter-source-manual");
  const filterTudongtu = document.getElementById("filter-tag-tudongtu");
  const filterThadongtu = document.getElementById("filter-tag-thadongtu");

  [filterPreset, filterPdf, filterExcel, filterManual, filterTudongtu, filterThadongtu].forEach(el => {
    if (el) {
      el.addEventListener("change", () => {
        compilePlaylist();
        updateRatioIndicator();
      });
    }
  });

  // Start learning / Load playlist triggers
  const btnStartLearning = document.getElementById("btn-start-learning");
  if (btnStartLearning) {
    btnStartLearning.addEventListener("click", () => {
      const playlist = compilePlaylist();
      if (playlist.length === 0) {
        showToast("Playlist hiện tại trống! Vui lòng tích chọn thư mục và nguồn từ vựng.", "error");
        return;
      }
      
      currentIndex = 0;
      historyStack = [];
      historyIndex = -1;
      
      displayCurrentWord(playlist);
      updateRatioIndicator(playlist);
      
      if (isPlaying) {
        resumeTimerAnimation();
      }
      
      showToast(`Đã nạp playlist học thành công! (${playlist.length} từ)`, "success");
    });
  }

  // Sidebar show/hide toggle trigger
  const btnTogglePlaylist = document.getElementById("btn-toggle-playlist");
  const playerWorkspace = document.getElementById("player-workspace");
  const textToggle = document.getElementById("text-toggle-playlist");
  
  if (btnTogglePlaylist && playerWorkspace && textToggle) {
    btnTogglePlaylist.addEventListener("click", () => {
      const isCollapsed = playerWorkspace.classList.toggle("playlist-collapsed");
      const icon = btnTogglePlaylist.querySelector("i");
      
      if (isCollapsed) {
        textToggle.textContent = "Hiện Playlist";
        btnTogglePlaylist.style.color = "var(--text-secondary)";
        if (icon) {
          icon.setAttribute("data-lucide", "sidebar-close");
        }
        showToast("Đã thu gọn thanh cài đặt Playlist!", "info");
      } else {
        textToggle.textContent = "Ẩn Playlist";
        btnTogglePlaylist.style.color = "hsl(var(--cyan))";
        if (icon) {
          icon.setAttribute("data-lucide", "sidebar");
        }
        showToast("Đã hiện thanh cài đặt Playlist!", "info");
      }
      lucide.createIcons();
    });
  }

  // Bulk selectors binding
  if (DOM.headerSelectAll) {
    DOM.headerSelectAll.addEventListener("change", (e) => {
      const checked = e.target.checked;
      document.querySelectorAll(".row-selector").forEach(chk => {
        chk.checked = checked;
      });
    });
  }

  const btnBulkDelete = document.getElementById("btn-bulk-delete-permanent");
  const btnBulkRemove = document.getElementById("btn-bulk-remove-relation");

  if (btnBulkDelete) btnBulkDelete.addEventListener("click", handleBulkDeletePermanent);
  if (btnBulkRemove) btnBulkRemove.addEventListener("click", handleBulkRemoveRelation);

  // EVENT DELEGATION: Centralized single-click actions on vocabulary table body
  if (DOM.vocabTableBody) {
    DOM.vocabTableBody.addEventListener("click", (e) => {
      const deleteBtn = e.target.closest(".btn-row-delete");
      if (deleteBtn) {
        const id = parseInt(deleteBtn.getAttribute("data-id"));
        deleteWordPermanently(id);
      }
    });
  }
}

// ==========================================================================
// 6. EXCEL PARSING & GENERATION (SHEETJS)
// ==========================================================================

function handleExcelUpload(file) {
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async function(e) {
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
      
      if (kanjiIdx === -1) kanjiIdx = 0;
      if (hiraganaIdx === -1) hiraganaIdx = 1;
      if (hanvietIdx === -1) hanvietIdx = 2;
      if (meaningIdx === -1) meaningIdx = 3;
      
      // Auto-create or reuse category for uploaded excel file
      const excelCatName = "Excel: " + file.name.replace(/\.[^/.]+$/, "");
      let excelCat = categoriesList.find(c => c.name === excelCatName && c.parentId === null);
      let excelCatId;
      if (excelCat) {
        excelCatId = excelCat.id;
        // Xóa các từ vựng cũ thuộc danh mục này để tránh bị trùng lặp dữ liệu
        vocabList = vocabList.filter(word => !word.categoryIds || !word.categoryIds.includes(excelCatId));
      } else {
        excelCatId = Date.now();
        categoriesList.push({ id: excelCatId, name: excelCatName, parentId: null });
      }
      
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
            id: Date.now() + Math.floor(Math.random() * 100000) + r,
            kanji: String(kanji).trim(),
            hiragana: String(hiragana).trim() || String(kanji).trim(),
            hanviet: String(hanviet).trim().toUpperCase(),
            meaning: String(meaning).trim(),
            source: "excel",
            categoryIds: [excelCatId],
            tags: []
          });
        }
      }
      
      if (importedWords.length > 0) {
        vocabList = [...vocabList, ...importedWords];
        await saveVocabList();
        updateGlobalStats();
        
        currentSelectedCategoryId = excelCatId;
        if (DOM.currentCategoryLabel) DOM.currentCategoryLabel.textContent = excelCatName;
        
        renderManagerTree();
        renderPlayerPlaylistTree();
        compilePlaylist();
        renderVocabTable();
        
        showToast(`Đã nhập thành công ${importedWords.length} từ vào danh mục "${excelCatName}"!`, "success");
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
    let chapterCounts = {};
    
    const saveParsedWord = (word) => {
      if (!word) return;
      
      let kan = (word.kanji || "").trim();
      let hira = (word.hiragana || "").trim();
      let han = (word.hanviet || "").trim().toUpperCase();
      let mean = (word.meaning || "").trim();
      
      if ((kan || hira) && mean) {
        if (!hira) hira = kan;
        
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
      
      const view = page.view || [0, 0, 595, 842];
      const pageWidth = (view[2] - view[0]) || 595;
      
      const rightColumnThreshold = pageWidth * 0.36;
      const innerSplitThreshold = pageWidth * 0.19;
      
      const thresholdY = 8;
      let rows = [];
      
      items.forEach(item => {
        const text = item.str;
        if (!text || !text.trim()) return;
        
        const x = item.transform[4];
        const y = item.transform[5];
        
        if (x > rightColumnThreshold) return;
        
        let foundRow = rows.find(r => Math.abs(r.y - y) <= thresholdY);
        if (foundRow) {
          foundRow.items.push({ x, text });
        } else {
          rows.push({ y, items: [{ x, text }] });
        }
      });
      
      rows.sort((a, b) => b.y - a.y);
      
      rows.forEach(row => {
        row.items.sort((a, b) => a.x - b.x);
        
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
      
      let currentWord = null;
      
      rows.forEach(row => {
        const leftText = row.items.filter(item => item.x < innerSplitThreshold).map(item => item.text).join(" ").trim();
        const rightText = row.items.filter(item => item.x >= innerSplitThreshold).map(item => item.text).join(" ").trim();
        const fullText = (leftText + " " + rightText).trim();
        
        if (!fullText) return;
        
        const chapMatch = fullText.match(/(Chương|Bài|Bài học|UNIT|LESSON|Chapter|CHƯƠNG|BÀI)\s*(\d+|[I|V|X]+|[a-zA-Z\s\d]+)/i);
        if (chapMatch) {
          saveParsedWord(currentWord);
          currentWord = null;
          currentChapter = fullText.trim();
          return;
        }
        
        const hasJapanese = /[\u3040-\u30ff\u4e00-\u9faf]/.test(leftText);
        const hasKanjiOrKatakana = /[\u4e00-\u9faf\u30a0-\u30ff]/.test(leftText);
        
        const rightTextWithoutPOS = rightText.replace(/\([A-Za-z\d\s]+\)/g, "").trim();
        const hasHeaderRight = rightText && (/[a-zA-ZÀ-ỹ]/.test(rightText) || rightText.includes("-") || /\(.*\)/.test(rightText));
        
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
          const isMeaningLine = !hasJapanese;
          
          if (isMeaningLine) {
            const cleanMeaning = leftText.replace(/[◇•\s]+/g, " ").trim();
            if (cleanMeaning) {
              currentWord.meaning = currentWord.meaning ? currentWord.meaning + ", " + cleanMeaning : cleanMeaning;
            }
          } else {
            if (leftText && /[\u3040-\u30ff\u4e00-\u9faf]/.test(leftText)) {
              currentWord.hiragana = currentWord.hiragana ? currentWord.hiragana + " " + leftText : leftText;
            }
            if (rightText) {
              const cleanRight = rightText.replace(/\([A-Za-z\d\s]+\)/g, "").trim();
              if (cleanRight && /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯÝỲỸ\s]+$/.test(cleanRight)) {
                currentWord.hanviet = currentWord.hanviet && currentWord.hanviet !== "-" ? currentWord.hanviet + " " + cleanRight : cleanRight;
              }
            }
          }
        }
      });
      
      saveParsedWord(currentWord);
    }
    
    pdfParsedChapters = {};
    parsedWords.forEach(word => {
      if (!pdfParsedChapters[word.chapter]) {
        pdfParsedChapters[word.chapter] = [];
      }
      pdfParsedChapters[word.chapter].push(word);
    });
    
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
  if (!container) return;
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
  if (!tbody || !emptyPlaceholder) return;
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

async function importSelectedPDFChapters() {
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
  
  // Create or reuse Parent Category for PDF file name
  const pdfInput = document.getElementById("pdf-file-input");
  const parentPdfName = "PDF: " + (pdfInput.files[0]?.name.replace(/\.[^/.]+$/, "") || "Nhập từ PDF");
  
  let parentPdf = categoriesList.find(c => c.name === parentPdfName && c.parentId === null);
  let parentPdfId;
  if (parentPdf) {
    parentPdfId = parentPdf.id;
    // Clean old children subcategories and their words to prevent duplicate/stacked data
    const childrenIds = categoriesList.filter(c => c.parentId === parentPdfId).map(c => c.id);
    vocabList = vocabList.filter(word => !word.categoryIds || !word.categoryIds.some(id => childrenIds.includes(id) || id === parentPdfId));
    categoriesList = categoriesList.filter(c => c.id !== parentPdfId && !childrenIds.includes(c.id));
  } else {
    parentPdfId = Date.now();
  }
  
  categoriesList.push({ id: parentPdfId, name: parentPdfName, parentId: null });
  
  let importedWordsCount = 0;
  checkedChapters.forEach((chap, idx) => {
    if (pdfParsedChapters[chap]) {
      const childCatId = parentPdfId + 100 + idx;
      categoriesList.push({ id: childCatId, name: chap, parentId: parentPdfId });
      
      const words = pdfParsedChapters[chap].map((word, wordIdx) => ({
        id: Date.now() + Math.floor(Math.random() * 100000) + wordIdx,
        kanji: word.kanji,
        hiragana: word.hiragana,
        hanviet: word.hanviet,
        meaning: word.meaning,
        source: "pdf",
        categoryIds: [childCatId],
        tags: []
      }));
      
      vocabList = [...vocabList, ...words];
      importedWordsCount += words.length;
    }
  });
  
  if (importedWordsCount > 0) {
    await saveVocabList();
    updateGlobalStats();
    
    currentSelectedCategoryId = parentPdfId;
    if (DOM.currentCategoryLabel) DOM.currentCategoryLabel.textContent = parentPdfName;
    
    renderManagerTree();
    renderPlayerPlaylistTree();
    compilePlaylist();
    renderVocabTable();
    
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

