// ptit_converter.js - Quy đổi điểm PTIT 2026 (CLI)
"use strict";
const readline = require("readline");

/** ===== Method names for display ===== */
const methodNames = {
  thpt: "THPT",
  tai_nang: "Tài năng",
  sat: "SAT",
  act: "ACT",
  tsa: "TSA",
  hsa: "HSA",
  v_act: "V-ACT",
  spt: "SPT",
  ket_hop: "Kết hợp",
};

/** ===== Method enum ===== */
const Method = {
  thpt: "thpt",
  tai_nang: "tai_nang",
  sat: "sat",
  act: "act",
  tsa: "tsa",
  hsa: "hsa",
  v_act: "v_act",
  spt: "spt",
  ket_hop: "ket_hop",
};

/** ===== Brackets 2026 - Phía Bắc (BVH) ===== */
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

/** ===== Brackets 2026 - Phía Nam (BVS) =====
 * Khác phía Bắc: Khoảng 4 Tài năng, Khoảng 5 THPT và Kết hợp */
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

const REGIONS = {
  north: { label: "Bắc (BVH)", brackets: BRACKETS_NORTH },
  south: { label: "Nam (BVS)", brackets: BRACKETS_SOUTH },
};

/** ===== Core logic ===== */
function findBracket(brackets, method, score) {
  for (let i = 0; i < brackets.length; i++) {
    const rng = brackets[i][method];
    if (rng && rng[0] <= score && score <= rng[1]) {
      return { index: i, range: rng };
    }
  }
  return null;
}

function convertForRegion(brackets, src, tgt, score) {
  const hit = findBracket(brackets, src, score);
  if (!hit) {
    return { ok: false, error: `Điểm ${score} nằm ngoài khoảng quy đổi của '${src}'` };
  }
  const tgtRng = brackets[hit.index][tgt];
  if (!tgtRng) {
    return { ok: false, error: `Khoảng ${hit.index + 1} không có dữ liệu cho '${tgt}'` };
  }
  const [a, b] = hit.range;
  const [c, d] = tgtRng;
  const y = b === a ? c : c + ((score - a) * (d - c)) / (b - a);
  return { ok: true, value: Math.round(y * 10000) / 10000, bracket: hit.index + 1 };
}

function convertScore(src, tgt, score) {
  return {
    north: convertForRegion(BRACKETS_NORTH, src, tgt, score),
    south: convertForRegion(BRACKETS_SOUTH, src, tgt, score),
  };
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

function printRegion(prefix, tgt, r) {
  if (!r.ok) {
    console.log(`  ${prefix} ${tgt}: ${r.error}`);
  } else {
    console.log(`  ${prefix} ${tgt} ${r.value.toFixed(4)} (khoảng ${r.bracket})`);
  }
}

function printResults(src, targets, arr, results) {
  const srcName = methodNames[src] || src.toUpperCase();
  for (let i = 0; i < arr.length; i++) {
    const score = Number(arr[i]);
    console.log(`${srcName} ${score.toFixed(2)}`);
    for (const tgt of targets) {
      const r = results[i].results[tgt];
      const sameValue =
        r.north.ok && r.south.ok && r.north.value === r.south.value;
      if (sameValue) {
        console.log(`  bắc + nam ${tgt} ${r.north.value.toFixed(4)} (khoảng ${r.north.bracket})`);
      } else {
        printRegion("bắc", tgt, r.north);
        printRegion("nam", tgt, r.south);
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
      perTarget[tgt] = convertScore(src, tgt, Number(score));
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
  console.log("=== PTIT Score Converter 2026 (interactive) ===");
  console.log("Phương thức hợp lệ:", Object.keys(Method).join(", "));
  console.log("Kết quả in riêng 2 cơ sở Bắc (BVH) / Nam (BVS) khi khác nhau");
  console.log("Nhập trống để dùng mặc định trong ngoặc []");
  console.log("");

  let keep = true;
  while (keep) {
    try {
      const src = (await ask(rl, "Nguồn -- src [thpt]: ")).trim().toLowerCase() || "thpt";
      validateMethod(src);

      const tgtRaw = await ask(rl, "Đích -- targets (CSV) [sat,act,spt,v_act]: ");
      const targets = parseTargets(tgtRaw || "sat,act,spt,v_act");
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

module.exports = { convertScore, convertForRegion, BRACKETS_NORTH, BRACKETS_SOUTH, Method };
