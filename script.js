// API Configuration
// DOM Elements
const converterForm = document.getElementById("converterForm");
const convertBtn = document.getElementById("convertBtn");
const loadingSpinner = document.getElementById("loadingSpinner");
const resultSection = document.getElementById("resultSection");
const errorSection = document.getElementById("errorSection");
let convertedScore = document.getElementById("convertedScore");
let bracketIndex = document.getElementById("bracketIndex");
const errorContent = document.getElementById("errorContent");

// Method names mapping for display
const methodNames = {
  thpt: "THPT Quốc gia",
  tai_nang: "Tài năng",
  sat: "SAT",
  act: "ACT",
  hsa: "HSA",
  tsa: "TSA",
  spt: "SPT",
  apt: "APT",
  ket_hop: "Kết hợp",
};

// ====== PTIT Score Converter Local Logic ======
// Logic này đã được cập nhật để khớp hoàn toàn với Python FastAPI backend

// 1. Định nghĩa phương thức (khớp với Python Enum)
const Method = {
  thpt: "thpt",
  tai_nang: "tai_nang",
  sat: "sat",
  act: "act",
  hsa: "hsa",
  tsa: "tsa",
  spt: "spt",
  apt: "apt",
  ket_hop: "ket_hop",
};

// 2. Bảng khoảng điểm (cập nhật để khớp chính xác với Python)
const BRACKETS = [
  {
    thpt: [27.25, 30],
    tai_nang: [85, 100],
    sat: [1450, 1600],
    act: [33, 36],
    hsa: [105, 150],
    tsa: [75.53, 100],
    spt: [25, 30],
    apt: [959, 1200],
    ket_hop: [28.75, 30],
  },
  {
    thpt: [25.25, 27.25],
    tai_nang: [80, 85],
    sat: [1350, 1450],
    act: [30, 33],
    hsa: [97, 105],
    tsa: [69.29, 75.53],
    spt: [22.75, 25],
    apt: [887, 959],
    ket_hop: [27.75, 28.75],
  },
  {
    thpt: [23.5, 25.25],
    tai_nang: [42.5, 80],
    sat: [1250, 1350],
    act: [28, 30],
    hsa: [91, 97],
    tsa: [65.42, 69.29],
    spt: [20.5, 22.75],
    apt: [816, 887],
    ket_hop: [26.5, 27.75],
  },
  {
    thpt: [20.5, 23.5],
    sat: [1130, 1250],
    act: [25, 28],
    hsa: [82, 91],
    tsa: [59.5, 65.42],
    spt: [18.25, 20.5],
    apt: [702, 816],
    ket_hop: [24.5, 26.5],
  },
  {
    thpt: { hanoi: [19, 20.5], tphcm: [16, 20.5] },
    hsa: [75, 82],
    tsa: [50, 59.5],
    spt: [15, 18.25],
    apt: [600, 702],
    ket_hop: [22.5, 24.5],
  },
];

// 3. Logic tìm bracket (cập nhật để khớ với Python logic và xử lý trường hợp đặc biệt)
function findBracket(method, score) {
  for (let i = 0; i < BRACKETS.length; i++) {
    const rng = BRACKETS[i][method];
    if (!rng) continue;
    
    // Xử lý trường hợp đặc biệt: bracket cuối có 2 cơ sở
    if (typeof rng === 'object' && rng.hanoi && rng.tphcm) {
      // Kiểm tra cả 2 khoảng để xem điểm có thuộc không
      const hanoiRange = rng.hanoi;
      const tphcmRange = rng.tphcm;
      if ((hanoiRange[0] <= score && score <= hanoiRange[1]) || 
          (tphcmRange[0] <= score && score <= tphcmRange[1])) {
        return { index: i, range: rng, isSpecial: true };
      }
    } else if (rng[0] <= score && score <= rng[1]) {
      return { index: i, range: rng };
    }
  }
  throw new Error(`Score ${score} vượt ngoài mọi khoảng của '${method}'`);
}

// 4. Logic quy đổi điểm (cập nhật để khớp với Python logic và xử lý trường hợp đặc biệt)
function convertScore(src, tgt, score) {
  const { index, range, isSpecial } = findBracket(src, score);
  const tgtRng = BRACKETS[index][tgt];
  
  if (!tgtRng) {
    throw new Error(`Khoảng ${index + 1} không có dữ liệu cho '${tgt}'`);
  }

  // Xử lý trường hợp đặc biệt: khi source hoặc target có 2 cơ sở
  if (isSpecial && typeof range === 'object' && range.hanoi && range.tphcm) {
    const results = [];
    
    // Tính điểm cho cơ sở Hà Nội
    const [a1, b1] = range.hanoi;
    if (a1 <= score && score <= b1) {
      let targetRange = tgtRng;
      if (typeof tgtRng === 'object' && tgtRng.hanoi) {
        targetRange = tgtRng.hanoi;
      }
      const [c1, d1] = targetRange;
      const y1 = b1 === a1 ? c1 : c1 + ((score - a1) * (d1 - c1)) / (b1 - a1);
      results.push({
        converted_score: Math.round(y1 * 10000) / 10000,
        bracket_index: index + 1,
        campus: 'Hà Nội',
        valid: true
      });
    } else {
      results.push({
        converted_score: null,
        bracket_index: index + 1,
        campus: 'Hà Nội',
        valid: false
      });
    }
    
    // Tính điểm cho cơ sở TPHCM
    const [a2, b2] = range.tphcm;
    if (a2 <= score && score <= b2) {
      let targetRange = tgtRng;
      if (typeof tgtRng === 'object' && tgtRng.tphcm) {
        targetRange = tgtRng.tphcm;
      }
      const [c2, d2] = targetRange;
      const y2 = b2 === a2 ? c2 : c2 + ((score - a2) * (d2 - c2)) / (b2 - a2);
      results.push({
        converted_score: Math.round(y2 * 10000) / 10000,
        bracket_index: index + 1,
        campus: 'TPHCM',
        valid: true
      });
    } else {
      results.push({
        converted_score: null,
        bracket_index: index + 1,
        campus: 'TPHCM',
        valid: false
      });
    }
    
    return { multiple: true, results: results };
  }
  
  // Xử lý trường hợp đặc biệt: khi target có 2 cơ sở nhưng source không
  if (typeof tgtRng === 'object' && tgtRng.hanoi && tgtRng.tphcm) {
    const results = [];
    const [a, b] = range;
    
    // Tính điểm cho cơ sở Hà Nội
    const [c1, d1] = tgtRng.hanoi;
    const y1 = b === a ? c1 : c1 + ((score - a) * (d1 - c1)) / (b - a);
    results.push({
      converted_score: Math.round(y1 * 10000) / 10000,
      bracket_index: index + 1,
      campus: 'Hà Nội',
      valid: true
    });
    
    // Tính điểm cho cơ sở TPHCM
    const [c2, d2] = tgtRng.tphcm;
    const y2 = b === a ? c2 : c2 + ((score - a) * (d2 - c2)) / (b - a);
    results.push({
      converted_score: Math.round(y2 * 10000) / 10000,
      bracket_index: index + 1,
      campus: 'TPHCM',
      valid: true
    });
    
    return { multiple: true, results: results };
  }
  
  // Trường hợp bình thường
  const [a, b] = range;
  const [c, d] = tgtRng;
  const y = b === a ? c : c + ((score - a) * (d - c)) / (b - a);
  return {
    converted_score: Math.round(y * 10000) / 10000,
    bracket_index: index + 1,
  };
}
// ====== END PTIT Score Converter Local Logic ======

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeForm();
  addFormValidation();
});

function initializeForm() {
  // Add form submit event listener
  converterForm.addEventListener("submit", handleFormSubmit);

  // Add input validation
  const scoreInput = document.getElementById("score");
  const sourceSelect = document.getElementById("sourceMethod");
  const targetSelect = document.getElementById("targetMethod");

  // Real-time validation
  scoreInput.addEventListener("input", validateScore);
  sourceSelect.addEventListener("change", validateSelects);
  targetSelect.addEventListener("change", validateSelects);

  // Add enter key support
  document.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !convertBtn.classList.contains("loading")) {
      e.preventDefault();
      converterForm.dispatchEvent(new Event("submit"));
    }
  });
}

function addFormValidation() {
  const inputs = document.querySelectorAll("input, select");
  inputs.forEach((input) => {
    input.addEventListener("blur", function () {
      validateField(this);
    });

    input.addEventListener("focus", function () {
      clearFieldError(this);
    });
  });
}

function validateField(field) {
  const value = field.value.trim();
  const fieldGroup = field.closest(".form-group");

  // Remove existing error states
  fieldGroup.classList.remove("error");
  const existingError = fieldGroup.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  // Validate based on field type
  if (field.hasAttribute("required") && !value) {
    showFieldError(fieldGroup, "Trường này là bắt buộc");
    return false;
  }

  if (field.type === "number") {
    const numValue = parseFloat(value);
    // Validation giống Python: điểm số phải > 0 (condecimal(gt=0))
    if (value && (isNaN(numValue) || numValue <= 0)) {
      showFieldError(fieldGroup, "Điểm số phải lớn hơn 0");
      return false;
    }
  }

  return true;
}

function showFieldError(fieldGroup, message) {
  fieldGroup.classList.add("error");
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  fieldGroup.appendChild(errorDiv);
}

function clearFieldError(field) {
  const fieldGroup = field.closest(".form-group");
  fieldGroup.classList.remove("error");
  const existingError = fieldGroup.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }
}

function validateScore() {
  const scoreInput = document.getElementById("score");
  const value = scoreInput.value;

  // Validation giống Python: điểm số phải > 0 (condecimal(gt=0))
  if (value && (isNaN(value) || parseFloat(value) <= 0)) {
    scoreInput.setCustomValidity("Điểm số phải lớn hơn 0");
  } else {
    scoreInput.setCustomValidity("");
  }
}

function validateSelects() {
  const sourceSelect = document.getElementById("sourceMethod");
  const targetSelect = document.getElementById("targetMethod");

  if (sourceSelect.value === targetSelect.value && sourceSelect.value) {
    targetSelect.setCustomValidity(
      "Phương thức đích phải khác phương thức nguồn"
    );
  } else {
    targetSelect.setCustomValidity("");
  }
}

// Replace handleFormSubmit to use local logic with proper validation
async function handleFormSubmit(e) {
  e.preventDefault();

  // Xóa kết quả cũ và reset về trạng thái ban đầu ngay từ đầu
  hideResults();

  // Validate form
  if (!validateForm()) {
    return;
  }

  // Get form data
  const formData = new FormData(converterForm);
  const requestData = {
    source_method: formData.get("source_method"),
    target_method: formData.get("target_method"),
    score: parseFloat(formData.get("score")),
  };

  // Additional validation: score must be greater than 0 (như Python condecimal(gt=0))
  if (requestData.score <= 0) {
    displayError(new Error("Điểm số phải lớn hơn 0"));
    return;
  }

  setLoadingState(true);

  try {
    // Local conversion logic
    const response = convertScore(
      requestData.source_method,
      requestData.target_method,
      requestData.score
    );
    displayResult(response, requestData);
    resultSection.classList.add("success-pulse");
    setTimeout(() => {
      resultSection.classList.remove("success-pulse");
    }, 600);
  } catch (error) {
    displayError(error);
  } finally {
    setLoadingState(false);
  }
}

function validateForm() {
  const inputs = document.querySelectorAll("input[required], select[required]");
  let isValid = true;

  inputs.forEach((input) => {
    if (!validateField(input)) {
      isValid = false;
    }
  });

  // Additional validation for selects
  validateSelects();
  const targetSelect = document.getElementById("targetMethod");
  if (targetSelect.validationMessage) {
    isValid = false;
    showFieldError(
      targetSelect.closest(".form-group"),
      targetSelect.validationMessage
    );
  }

  return isValid;
}

function displayResult(response, requestData) {
  // Xử lý trường hợp có nhiều kết quả (2 cơ sở)
  if (response.multiple && response.results) {
    displayMultipleResults(response, requestData);
  } else {
    // Trường hợp bình thường - 1 kết quả
    convertedScore.textContent = response.converted_score.toFixed(2);
    bracketIndex.textContent = response.bracket_index;
    updateResultDetails(requestData, response);
  }

  // Show result section
  errorSection.style.display = "none";
  resultSection.style.display = "block";

  // Smooth scroll to result
  resultSection.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}

function displayMultipleResults(response, requestData) {
  // Tạo HTML cho nhiều kết quả
  const resultContent = document.querySelector(".result-content");
  resultContent.innerHTML = "";
  
  // Thêm tiêu đề
  const headerDiv = document.createElement("div");
  headerDiv.className = "multiple-results-header";
  headerDiv.innerHTML = `
    <div class="result-item">
      <span class="result-label">Quy đổi từ:</span>
      <span class="result-value">${methodNames[requestData.source_method]} (${requestData.score})</span>
    </div>
    <div class="result-item">
      <span class="result-label">Sang:</span>
      <span class="result-value">${methodNames[requestData.target_method]}</span>
    </div>
  `;
  resultContent.appendChild(headerDiv);
  
  // Hiển thị kết quả cho từng cơ sở
  response.results.forEach(result => {
    if (result.valid) {
      const campusDiv = document.createElement("div");
      campusDiv.className = "campus-result";
      campusDiv.innerHTML = `
        <div class="campus-header">
          <i class="fas fa-map-marker-alt"></i>
          <h4>Cơ sở ${result.campus}</h4>
        </div>
        <div class="result-item">
          <span class="result-label">Điểm đã quy đổi:</span>
          <span class="result-value">${result.converted_score.toFixed(2)}</span>
        </div>
        <div class="result-item">
          <span class="result-label">Khoảng:</span>
          <span class="result-value">${result.bracket_index}</span>
        </div>
      `;
      resultContent.appendChild(campusDiv);
    }
  });
}

function updateResultDetails(requestData, response) {
  const resultContent = document.querySelector(".result-content");

  // Remove existing additional info
  const existingInfo = resultContent.querySelector(".conversion-info");
  if (existingInfo) {
    existingInfo.remove();
  }

  // Add conversion details
  const conversionInfo = document.createElement("div");
  conversionInfo.className = "conversion-info";
  conversionInfo.innerHTML = `
        <div class="result-item">
            <span class="result-label">Từ:</span>
            <span class="result-value">${
              methodNames[requestData.source_method]
            } (${requestData.score})</span>
        </div>
        <div class="result-item">
            <span class="result-label">Sang:</span>
            <span class="result-value">${
              methodNames[requestData.target_method]
            }</span>
        </div>
    `;

  resultContent.appendChild(conversionInfo);
}

function displayError(error) {
  console.error("API Error:", error);

  let errorMessage = "Có lỗi xảy ra trong quá trình quy đổi điểm.";

  if (error.message.includes("Failed to fetch")) {
    errorMessage =
      "Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet và thử lại.";
  } else if (error.message.includes("HTTP")) {
    errorMessage = `Lỗi server: ${error.message}`;
  } else if (error.message) {
    errorMessage = error.message;
  }

  errorContent.textContent = errorMessage;

  // Show error section
  resultSection.style.display = "none";
  errorSection.style.display = "block";

  // Smooth scroll to error
  errorSection.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}

function setLoadingState(isLoading) {
  if (isLoading) {
    convertBtn.classList.add("loading");
    convertBtn.disabled = true;
  } else {
    convertBtn.classList.remove("loading");
    convertBtn.disabled = false;
  }
}

function hideResults() {
  resultSection.style.display = "none";
  errorSection.style.display = "none";
  
  // Reset về trạng thái ban đầu
  resetResultContent();
}

function resetResultContent() {
  // Reset lại HTML của result content về trạng thái ban đầu
  const resultContent = document.querySelector(".result-content");
  resultContent.innerHTML = `
    <div class="result-item">
      <span class="result-label">Điểm đã quy đổi:</span>
      <span class="result-value" id="convertedScore">--</span>
    </div>
    <div class="result-item">
      <span class="result-label">Khoảng:</span>
      <span class="result-value" id="bracketIndex">--</span>
    </div>
  `;
  
  // Cập nhật lại references đến các elements
  convertedScore = document.getElementById("convertedScore");
  bracketIndex = document.getElementById("bracketIndex");
  
  // Xóa các class effect cũ nếu có
  resultSection.classList.remove("success-pulse");
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Enhanced form interactions
document.addEventListener("DOMContentLoaded", function () {
  // Add smooth transitions for form elements
  const formElements = document.querySelectorAll("input, select");
  formElements.forEach((element) => {
    element.addEventListener("focus", function () {
      this.parentElement.style.transform = "translateY(-2px)";
    });

    element.addEventListener("blur", function () {
      this.parentElement.style.transform = "translateY(0)";
    });
  });

  // Add copy to clipboard functionality for results
  const resultValues = document.querySelectorAll(".result-value");
  resultValues.forEach((value) => {
    value.addEventListener("click", function () {
      if (this.textContent !== "--") {
        navigator.clipboard.writeText(this.textContent).then(() => {
          showToast("Đã sao chép vào clipboard!");
        });
      }
    });
  });
});

function showToast(message) {
  // Create toast element
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  // Add toast styles
  Object.assign(toast.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: "#4ecdc4",
    color: "white",
    padding: "12px 20px",
    borderRadius: "8px",
    zIndex: "1000",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transform: "translateX(300px)",
    transition: "transform 0.3s ease",
    fontSize: "14px",
    fontWeight: "500",
  });

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = "translateX(0)";
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.transform = "translateX(300px)";
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Add keyboard shortcuts
document.addEventListener("keydown", function (e) {
  // Ctrl/Cmd + Enter to submit
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    if (!convertBtn.classList.contains("loading")) {
      converterForm.dispatchEvent(new Event("submit"));
    }
  }

  // Escape to clear results
  if (e.key === "Escape") {
    hideResults();
  }
});

// Add CSS for field errors
const errorStyles = document.createElement("style");
errorStyles.textContent = `
    .form-group.error input,
    .form-group.error select {
        border-color: #ff6b6b !important;
        box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1) !important;
    }
    
    .error-message {
        color: #ff6b6b;
        font-size: 0.85rem;
        margin-top: 5px;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .error-message::before {
        content: "⚠";
        font-size: 0.9rem;
    }
    
    .form-group {
        transition: transform 0.2s ease;
    }
    
    .result-value {
        cursor: pointer;
        transition: color 0.2s ease;
    }
    
    .result-value:hover {
        color: rgba(255, 255, 255, 0.8);
    }
    
    .multiple-results-header {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .campus-result {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        border-left: 4px solid #4ecdc4;
    }
    
    .campus-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        color: #4ecdc4;
        font-weight: 600;
    }
    
    .campus-header h4 {
        margin: 0;
        font-size: 1.1rem;
    }
    
    .campus-header i {
        color: #4ecdc4;
    }
    
    .campus-result .result-item {
        margin-bottom: 8px;
    }
    
    .campus-result:last-child {
        margin-bottom: 0;
    }
`;
document.head.appendChild(errorStyles);
