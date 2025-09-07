// ptit_converter.js
"use strict";
const readline = require("readline");

/** ===== Method names for display ===== */
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

/** ===== Method enum ===== */
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

/** ===== Brackets ===== */
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
    thpt: [19, 20.5],
    hsa: [75, 82],
    tsa: [50, 59.5],
    spt: [15, 18.25],
    apt: [600, 702],
    ket_hop: [22.5, 24.5],
  },
];

/** ===== Core logic (giữ nguyên như bạn) ===== */
function findBracket(method, score) {
  for (let i = 0; i < BRACKETS.length; i++) {
    const rng = BRACKETS[i][method];
    if (rng) {
      let [a, b] = rng;
      // Nếu THPT và đang ở bracket 5, chấp nhận cận dưới 16 (miền Nam)
      if (method === "thpt" && i === 4) a = 16;
      if (a <= score && score <= b) return { index: i, range: [a, b] };
    }
  }
  throw new Error(`Score ${score} vượt ngoài mọi khoảng của '${method}'`);
}

function convertScore(src, tgt, score) {
  const { index, range } = findBracket(src, score);
  const tgtRng = BRACKETS[index][tgt];
  if (!tgtRng) throw new Error(`Khoảng ${index + 1} không có dữ liệu cho '${tgt}'`);

  const [a, b] = range;
  const [c, d] = tgtRng;

  const isThptSpecial = index === 4 && (src === "thpt" || tgt === "thpt");
  if (isThptSpecial) {
    const aNorth = 19;
    const aSouth = 16;
    let yNorth = null, ySouth = null;

    if (src === "thpt") {
      if (score >= aNorth && score <= b) {
        yNorth = b === aNorth ? c : c + ((score - aNorth) * (d - c)) / (b - aNorth);
        yNorth = Math.round(yNorth * 10000) / 10000;
      }
      if (score >= aSouth && score <= b) {
        ySouth = b === aSouth ? c : c + ((score - aSouth) * (d - c)) / (b - aSouth);
        ySouth = Math.round(ySouth * 10000) / 10000;
      }
    } else if (tgt === "thpt") {
      if (score >= a && score <= b) {
        yNorth = 19 + ((score - a) * (20.5 - 19)) / (b - a);
        yNorth = Math.round(yNorth * 10000) / 10000;

        ySouth = 16 + ((score - a) * (20.5 - 16)) / (b - a);
        ySouth = Math.round(ySouth * 10000) / 10000;
      }
    }

    return { converted_north: yNorth, converted_south: ySouth, bracket_index: index + 1, special_case: true };
  }

  const y = b === a ? c : c + ((score - a) * (d - c)) / (b - a);
  return { converted_score: Math.round(y * 10000) / 10000, bracket_index: index + 1, special_case: false };
}

/** ===== Helpers ===== */
function validateMethod(m) {
  if (!Object.prototype.hasOwnProperty.call(Method, m)) {
    const allowed = Object.keys(Method).join(", ");
    throw new Error(`Phương thức '${m}' không hợp lệ. Hợp lệ: ${allowed}`);
  }
}

function parseTargets(input) {
  return String(input || "")
    .split(/[, ]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseNumbers(input) {
  // chấp nhận CSV hoặc bất kỳ chuỗi chứa số; tách theo dấu phẩy, khoảng trắng, xuống dòng
  return String(input || "")
    .split(/[^0-9.+-]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((v) => Number.isFinite(v));
}

function printResults(src, targets, arr, results) {
  const srcName = methodNames[src] || src.toUpperCase();
  for (let i = 0; i < arr.length; i++) {
    const score = Number(arr[i]);
    console.log(`${srcName} ${score.toFixed(2)}`);
    for (const tgt of targets) {
      const r = results[i].results[tgt];
      if (r?.error) {
        console.log(`  ${tgt}: ERROR -> ${r.error}`);
        continue;
      }
      if (r.special_case) {
        const north = r.converted_north != null ? r.converted_north.toFixed(4) : "N/A";
        const south = r.converted_south != null ? r.converted_south.toFixed(4) : "N/A";
        console.log(`  bắc ${tgt} ${north}`);
        console.log(`  nam ${tgt} ${south}`);
      } else {
        console.log(`  bắc + nam ${tgt} ${r.converted_score.toFixed(4)}`);
      }
    }
  }
}

function convertArray(src, targets, arr) {
  validateMethod(src);
  targets.forEach(validateMethod);
  return arr.map((score) => {
    const perTarget = {};
    for (const tgt of targets) {
      try {
        perTarget[tgt] = convertScore(src, tgt, Number(score));
      } catch (e) {
        perTarget[tgt] = { error: String(e.message || e) };
      }
    }
    return { score: Number(score), results: perTarget };
  });
}

/** ===== Interactive CLI ===== */
function createRL() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, q) {
  return new Promise((res) => rl.question(q, (ans) => res(ans)));
}

async function mainInteractive() {
  const rl = createRL();
  console.log("=== PTIT Score Converter (interactive) ===");
  console.log("Phương thức hợp lệ:", Object.keys(Method).join(", "));
  console.log("Nhập trống để dùng mặc định trong ngoặc []");
  console.log("");

  let keep = true;
  while (keep) {
    try {
      const src = (await ask(rl, "Nguồn -- src [thpt]: ")).trim().toLowerCase() || "thpt";
      validateMethod(src);

      const tgtRaw = await ask(rl, "Đích -- targets (CSV) [sat,act,spt,apt]: ");
      const targets = parseTargets(tgtRaw || "sat,act,spt,apt");
      if (!targets.length) throw new Error("Bạn chưa nhập targets hợp lệ.");

      const arrRaw = await ask(
        rl,
        "Mảng điểm nguồn -- arr (CSV hoặc dán trực tiếp nhiều số, ngăn cách bằng dấu phẩy/khoảng trắng/dòng)\n" +
          "VD: 25.10, 24.87, 26.19, 24.61\n> "
      );
      const arr = parseNumbers(arrRaw);
      if (!arr.length) throw new Error("Bạn chưa nhập mảng điểm hợp lệ.");

      const results = convertArray(src, targets, arr);
      console.log("\n--- Kết quả ---");
      printResults(src, targets, arr, results);
      console.log("---------------\n");
    } catch (e) {
      console.error("Lỗi:", String(e.message || e));
    }

    const again = (await ask(rl, "Tiếp tục? (y/N): ")).trim().toLowerCase();
    keep = again === "y" || again === "yes";
    console.log("");
  }

  rl.close();
}

if (require.main === module) {
  mainInteractive();
}
