// API Configuration
const API_BASE_URL = "https://tooltypchuyendoidiem-production.up.railway.app";

// DOM Elements
const converterForm = document.getElementById("converterForm");
const convertBtn = document.getElementById("convertBtn");
const loadingSpinner = document.getElementById("loadingSpinner");
const resultSection = document.getElementById("resultSection");
const errorSection = document.getElementById("errorSection");
const convertedScore = document.getElementById("convertedScore");
const bracketIndex = document.getElementById("bracketIndex");
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
    if (value && (isNaN(numValue) || numValue <= 0)) {
      showFieldError(fieldGroup, "Điểm số phải là số dương");
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

  if (value && (isNaN(value) || parseFloat(value) <= 0)) {
    scoreInput.setCustomValidity("Điểm số phải là số dương");
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

async function handleFormSubmit(e) {
  e.preventDefault();

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

  // Show loading state
  setLoadingState(true);
  hideResults();

  try {
    const response = await callConvertAPI(requestData);
    displayResult(response, requestData);

    // Add success animation
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

async function callConvertAPI(requestData) {
  const response = await fetch(`${API_BASE_URL}/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail
      ? formatValidationError(errorData.detail)
      : `Lỗi HTTP: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return await response.json();
}

function formatValidationError(details) {
  if (Array.isArray(details)) {
    return details
      .map((detail) => {
        const field = detail.loc ? detail.loc.join(".") : "Không xác định";
        return `${field}: ${detail.msg}`;
      })
      .join("\n");
  }
  return "Dữ liệu đầu vào không hợp lệ";
}

function displayResult(response, requestData) {
  // Update result values
  convertedScore.textContent = response.converted_score.toFixed(2);
  bracketIndex.textContent = response.bracket_index;

  // Create additional info
  updateResultDetails(requestData, response);

  // Show result section
  errorSection.style.display = "none";
  resultSection.style.display = "block";

  // Smooth scroll to result
  resultSection.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
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
`;
document.head.appendChild(errorStyles);
