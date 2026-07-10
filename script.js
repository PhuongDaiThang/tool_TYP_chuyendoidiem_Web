// ====== PTIT Score Converter 2026 ======
// Nguồn: Thông báo Bảng quy đổi tương đương giữa các Phương thức xét tuyển
// đại học hệ chính quy năm 2026 (10/07/2026) - Học viện CN Bưu chính Viễn thông

// DOM Elements
const converterForm = document.getElementById("converterForm");
const convertBtn = document.getElementById("convertBtn");
const resultSection = document.getElementById("resultSection");
const errorSection = document.getElementById("errorSection");
const resultContent = document.getElementById("resultContent");
const errorContent = document.getElementById("errorContent");
const scoreHint = document.getElementById("scoreHint");
const swapBtn = document.getElementById("swapBtn");

// Method names mapping for display
const methodNames = {
  thpt: "Thi tốt nghiệp THPT",
  tai_nang: "Xét tuyển Tài năng",
  sat: "SAT",
  act: "ACT",
  tsa: "TSA",
  hsa: "HSA",
  v_act: "V-ACT",
  spt: "SPT",
  ket_hop: "Xét tuyển Kết hợp",
};

// Bảng khoảng điểm 2026 - Cơ sở đào tạo Phía Bắc (BVH)
const BRACKETS_NORTH = [
  {
    thpt: [26.85, 30],
    tai_nang: [92.33, 100],
    sat: [1450, 1600],
    act: [33, 36],
    tsa: [64.4, 100],
    hsa: [105, 150],
    v_act: [968, 1200],
    spt: [24.5, 30],
    ket_hop: [29.5, 30],
  },
  {
    thpt: [25.75, 26.85],
    tai_nang: [84.67, 92.33],
    sat: [1350, 1450],
    act: [30, 33],
    tsa: [60.84, 64.4],
    hsa: [99, 105],
    v_act: [919, 968],
    spt: [23.5, 24.5],
    ket_hop: [28.8, 29.5],
  },
  {
    thpt: [24.0, 25.75],
    tai_nang: [80.5, 84.67],
    sat: [1250, 1350],
    act: [28, 30],
    tsa: [54.95, 60.84],
    hsa: [87, 99],
    v_act: [817, 919],
    spt: [21.5, 23.5],
    ket_hop: [27.8, 28.8],
  },
  {
    thpt: [22.5, 24.0],
    tai_nang: [56.8, 80.5],
    sat: [1130, 1250],
    act: [25, 28],
    tsa: [51.25, 54.95],
    hsa: [79, 87],
    v_act: [736, 817],
    spt: [16.0, 21.5],
    ket_hop: [26.8, 27.8],
  },
  {
    thpt: [20.0, 22.5],
    tsa: [50.0, 51.25],
    hsa: [75, 79],
    v_act: [600, 736],
    spt: [15.0, 16.0],
    ket_hop: [20.23, 26.8],
  },
];

// Bảng khoảng điểm 2026 - Cơ sở đào tạo Phía Nam (BVS)
// Khác phía Bắc: Khoảng 4 Tài năng, Khoảng 5 THPT và Kết hợp
const BRACKETS_SOUTH = [
  {
    thpt: [26.85, 30],
    tai_nang: [92.33, 100],
    sat: [1450, 1600],
    act: [33, 36],
    tsa: [64.4, 100],
    hsa: [105, 150],
    v_act: [968, 1200],
    spt: [24.5, 30],
    ket_hop: [29.5, 30],
  },
  {
    thpt: [25.75, 26.85],
    tai_nang: [84.67, 92.33],
    sat: [1350, 1450],
    act: [30, 33],
    tsa: [60.84, 64.4],
    hsa: [99, 105],
    v_act: [919, 968],
    spt: [23.5, 24.5],
    ket_hop: [28.8, 29.5],
  },
  {
    thpt: [24.0, 25.75],
    tai_nang: [80.5, 84.67],
    sat: [1250, 1350],
    act: [28, 30],
    tsa: [54.95, 60.84],
    hsa: [87, 99],
    v_act: [817, 919],
    spt: [21.5, 23.5],
    ket_hop: [27.8, 28.8],
  },
  {
    thpt: [22.5, 24.0],
    tai_nang: [59.53, 80.5],
    sat: [1130, 1250],
    act: [25, 28],
    tsa: [51.25, 54.95],
    hsa: [79, 87],
    v_act: [736, 817],
    spt: [16.0, 21.5],
    ket_hop: [26.8, 27.8],
  },
  {
    thpt: [16.5, 22.5],
    tsa: [50.0, 51.25],
    hsa: [75, 79],
    v_act: [600, 736],
    spt: [15.0, 16.0],
    ket_hop: [19.03, 26.8],
  },
];

const REGIONS = [
  { key: "north", label: "Phía Bắc (BVH)", brackets: BRACKETS_NORTH },
  { key: "south", label: "Phía Nam (BVS)", brackets: BRACKETS_SOUTH },
];

// Tìm khoảng chứa điểm theo phương thức (duyệt từ khoảng 1 xuống,
// điểm trùng biên thuộc về khoảng cao hơn: a <= x < b)
function findBracket(brackets, method, score) {
  for (let i = 0; i < brackets.length; i++) {
    const rng = brackets[i][method];
    if (rng && rng[0] <= score && score <= rng[1]) {
      return { index: i, range: rng };
    }
  }
  return null;
}

// Quy đổi tuyến tính trong khoảng theo công thức của Bộ GD&ĐT:
// y = c + (x - a) * (d - c) / (b - a)
function convertForRegion(brackets, src, tgt, score) {
  const hit = findBracket(brackets, src, score);
  if (!hit) {
    return { ok: false, reason: "out_of_range" };
  }
  const tgtRng = brackets[hit.index][tgt];
  if (!tgtRng) {
    return { ok: false, reason: "no_target", bracket: hit.index + 1 };
  }
  const [a, b] = hit.range;
  const [c, d] = tgtRng;
  const y = b === a ? c : c + ((score - a) * (d - c)) / (b - a);
  return {
    ok: true,
    value: Math.round(y * 10000) / 10000,
    bracket: hit.index + 1,
  };
}

function convertScore(src, tgt, score) {
  const north = convertForRegion(BRACKETS_NORTH, src, tgt, score);
  const south = convertForRegion(BRACKETS_SOUTH, src, tgt, score);
  const same =
    north.ok &&
    south.ok &&
    north.value === south.value &&
    north.bracket === south.bracket;
  return { north, south, same };
}

// Khoảng điểm hợp lệ của một phương thức (gộp cả 2 cơ sở) để gợi ý nhập liệu
function getMethodRange(method) {
  let min = Infinity;
  let max = -Infinity;
  for (const region of REGIONS) {
    for (const bracket of region.brackets) {
      const rng = bracket[method];
      if (rng) {
        min = Math.min(min, rng[0]);
        max = Math.max(max, rng[1]);
      }
    }
  }
  return min === Infinity ? null : [min, max];
}

function formatNumber(v) {
  // Hiển thị tối đa 2 chữ số thập phân, bỏ số 0 thừa
  return parseFloat(v.toFixed(2)).toString();
}

// ====== UI logic ======

document.addEventListener("DOMContentLoaded", function () {
  initializeForm();
  addFormValidation();
});

function initializeForm() {
  converterForm.addEventListener("submit", handleFormSubmit);

  const scoreInput = document.getElementById("score");
  const sourceSelect = document.getElementById("sourceMethod");
  const targetSelect = document.getElementById("targetMethod");

  scoreInput.addEventListener("input", validateScore);
  sourceSelect.addEventListener("change", function () {
    validateSelects();
    updateScoreHint();
  });
  targetSelect.addEventListener("change", validateSelects);

  swapBtn.addEventListener("click", function () {
    const tmp = sourceSelect.value;
    sourceSelect.value = targetSelect.value;
    targetSelect.value = tmp;
    validateSelects();
    updateScoreHint();
    hideResults();
  });

  // Enter để quy đổi
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !convertBtn.classList.contains("loading")) {
      const activeEl = document.activeElement;
      if (
        converterForm.contains(activeEl) &&
        (activeEl.tagName === "INPUT" || activeEl.tagName === "SELECT")
      ) {
        e.preventDefault();
        converterForm.dispatchEvent(new Event("submit"));
      }
    }
  });

  // Sao chép điểm khi nhấn vào (event delegation vì kết quả render động)
  resultContent.addEventListener("click", function (e) {
    const valueEl = e.target.closest(".result-value[data-copy]");
    if (valueEl && navigator.clipboard) {
      navigator.clipboard.writeText(valueEl.dataset.copy).then(() => {
        showToast("Đã sao chép " + valueEl.dataset.copy + " vào clipboard!");
      });
    }
  });
}

function updateScoreHint() {
  const method = document.getElementById("sourceMethod").value;
  if (!method) {
    scoreHint.textContent = "";
    return;
  }
  const range = getMethodRange(method);
  if (range) {
    scoreHint.innerHTML =
      '<i class="fas fa-circle-info"></i> Khoảng quy đổi hợp lệ: <strong>' +
      formatNumber(range[0]) +
      " – " +
      formatNumber(range[1]) +
      "</strong>";
  }
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

  fieldGroup.classList.remove("error");
  const existingError = fieldGroup.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

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

function validateForm() {
  const inputs = document.querySelectorAll("input[required], select[required]");
  let isValid = true;

  inputs.forEach((input) => {
    if (!validateField(input)) {
      isValid = false;
    }
  });

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

function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  const formData = new FormData(converterForm);
  const src = formData.get("source_method");
  const tgt = formData.get("target_method");
  const score = parseFloat(formData.get("score"));

  setLoadingState(true);
  hideResults();

  try {
    const result = convertScore(src, tgt, score);
    if (!result.north.ok && !result.south.ok) {
      displayError(buildErrorMessage(result.north, src, tgt, score));
    } else {
      displayResult(result, src, tgt, score);
      resultSection.classList.add("success-pulse");
      setTimeout(() => {
        resultSection.classList.remove("success-pulse");
      }, 600);
    }
  } catch (error) {
    displayError(error.message || "Có lỗi xảy ra trong quá trình quy đổi điểm.");
  } finally {
    setLoadingState(false);
  }
}

function buildErrorMessage(regionResult, src, tgt, score) {
  if (regionResult.reason === "no_target") {
    return (
      "Khoảng " +
      regionResult.bracket +
      " không có dữ liệu quy đổi sang " +
      methodNames[tgt] +
      ". Vui lòng thử phương thức đích khác."
    );
  }
  const range = getMethodRange(src);
  let msg =
    "Điểm " + formatNumber(score) + " nằm ngoài khoảng quy đổi của phương thức " +
    methodNames[src] + ".";
  if (range) {
    msg +=
      " Khoảng hợp lệ: " +
      formatNumber(range[0]) +
      " – " +
      formatNumber(range[1]) +
      ".";
  }
  return msg;
}

function regionResultHTML(label, regionResult, tgt) {
  if (!regionResult.ok) {
    const reasonText =
      regionResult.reason === "no_target"
        ? "Khoảng " + regionResult.bracket + " không có dữ liệu cho " + methodNames[tgt]
        : "Ngoài khoảng quy đổi";
    return (
      '<div class="result-item">' +
      '<span class="result-label"><i class="fas fa-location-dot"></i> ' + label + "</span>" +
      '<span class="result-value result-value-muted">' + reasonText + "</span>" +
      "</div>"
    );
  }
  const display = formatNumber(regionResult.value);
  return (
    '<div class="result-item">' +
    '<span class="result-label"><i class="fas fa-location-dot"></i> ' + label +
    ' <span class="bracket-chip">Khoảng ' + regionResult.bracket + "</span></span>" +
    '<span class="result-value" data-copy="' + display + '" title="Nhấn để sao chép">' +
    display + "</span>" +
    "</div>"
  );
}

function displayResult(result, src, tgt, score) {
  let html =
    '<div class="result-summary">' +
    '<span class="method-chip">' + methodNames[src] + ": " + formatNumber(score) + "</span>" +
    '<i class="fas fa-arrow-right-long"></i>' +
    '<span class="method-chip">' + methodNames[tgt] + "</span>" +
    "</div>";

  if (result.same) {
    const display = formatNumber(result.north.value);
    html +=
      '<div class="result-main">' +
      '<span class="result-main-value result-value" data-copy="' + display +
      '" title="Nhấn để sao chép">' + display + "</span>" +
      '<span class="result-main-caption">Cả hai cơ sở BVH &amp; BVS · Khoảng ' +
      result.north.bracket + "</span>" +
      "</div>";
  } else {
    html += regionResultHTML("Phía Bắc (BVH)", result.north, tgt);
    html += regionResultHTML("Phía Nam (BVS)", result.south, tgt);
  }

  resultContent.innerHTML = html;
  errorSection.style.display = "none";
  resultSection.style.display = "block";

  resultSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function displayError(message) {
  errorContent.textContent = message;
  resultSection.style.display = "none";
  errorSection.style.display = "block";
  errorSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Phím tắt: Ctrl/Cmd + Enter để quy đổi, Escape để ẩn kết quả
document.addEventListener("keydown", function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    if (!convertBtn.classList.contains("loading")) {
      converterForm.dispatchEvent(new Event("submit"));
    }
  }

  if (e.key === "Escape") {
    hideResults();
  }
});
