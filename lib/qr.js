// A small QR code generator, so the app needs no extra packages.
// It makes standard QR codes (byte mode, error correction level M, versions 1 to 10),
// enough for a web address of up to about 210 characters.
//
// Use it like this:
//   const qr = makeQr("https://example.com/assets/123");
//   qr.size       -> number of squares along one side
//   qr.dark(x, y) -> true when the square at column x, row y is dark

// ---- Tables for error correction level M ----
const ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
const MAX_VERSION = 10;

// How many squares in a code of this version can hold data
function rawDataModules(version) {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    result -= (25 * align - 10) * align - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function dataCodewords(version) {
  const total = Math.floor(rawDataModules(version) / 8);
  return total - ECC_PER_BLOCK[version] * BLOCKS[version];
}

// ---- Reed-Solomon error correction (arithmetic in GF(256)) ----
function gfMultiply(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree) {
  const result = new Array(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMultiply(root, 2);
  }
  return result;
}

function rsRemainder(data, divisor) {
  const result = new Array(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ result.shift();
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i] ^= gfMultiply(coef, factor);
    });
  }
  return result;
}

// ---- Turn the text into the final list of codewords ----
function buildCodewords(bytes, version) {
  const bits = [];
  const put = (value, count) => {
    for (let i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  put(0b0100, 4); // byte mode
  put(bytes.length, version <= 9 ? 8 : 16);
  bytes.forEach((b) => put(b, 8));

  const capacityBits = dataCodewords(version) * 8;
  put(0, Math.min(4, capacityBits - bits.length)); // terminator
  while (bits.length % 8 !== 0) bits.push(0);
  for (let pad = 0xec; bits.length < capacityBits; pad ^= 0xec ^ 0x11) {
    put(pad, 8);
  }

  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    data.push(byte);
  }

  // Split into blocks, add error correction to each, then interleave
  const blocks = BLOCKS[version];
  const eccLen = ECC_PER_BLOCK[version];
  const rawCodewords = Math.floor(rawDataModules(version) / 8);
  const shortBlocks = blocks - (rawCodewords % blocks);
  const shortLen = Math.floor(rawCodewords / blocks) - eccLen;
  const divisor = rsDivisor(eccLen);
  const parts = [];
  for (let i = 0, k = 0; i < blocks; i++) {
    const len = shortLen + (i < shortBlocks ? 0 : 1);
    const chunk = data.slice(k, k + len);
    k += len;
    const ecc = rsRemainder(chunk, divisor);
    if (i < shortBlocks) chunk.push(0); // placeholder so all blocks line up
    parts.push(chunk.concat(ecc));
  }
  const result = [];
  for (let i = 0; i < parts[0].length; i++) {
    parts.forEach((block, j) => {
      // skip the placeholder in short blocks
      if (i !== shortLen || j >= shortBlocks) result.push(block[i]);
    });
  }
  return result;
}

// ---- Draw the code ----
function alignmentPositions(version) {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const size = version * 4 + 17;
  const step = Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < count; pos -= step) {
    result.splice(1, 0, pos);
  }
  return result;
}

function layout(version, codewords) {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array(size).fill(false));
  const fixed = Array.from({ length: size }, () => new Array(size).fill(false));

  const setFixed = (x, y, dark) => {
    modules[y][x] = dark;
    fixed[y][x] = true;
  };

  function formatBits(mask) {
    // error correction level M has format code 0
    const data = (0 << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    return ((data << 10) | rem) ^ 0x5412;
  }

  function drawFormat(mask) {
    const bits = formatBits(mask);
    const bit = (i) => ((bits >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) setFixed(8, i, bit(i));
    setFixed(8, 7, bit(6));
    setFixed(8, 8, bit(7));
    setFixed(7, 8, bit(8));
    for (let i = 9; i < 15; i++) setFixed(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) setFixed(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) setFixed(8, size - 15 + i, bit(i));
    setFixed(8, size - 8, true);
  }

  function finder(cx, cy) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) {
          setFixed(x, y, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  function alignment(cx, cy) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        setFixed(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  // Function patterns (the fixed squares)
  for (let i = 0; i < size; i++) {
    setFixed(6, i, i % 2 === 0);
    setFixed(i, 6, i % 2 === 0);
  }
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);
  const pos = alignmentPositions(version);
  pos.forEach((x, i) => {
    pos.forEach((y, j) => {
      const onFinder =
        (i === 0 && j === 0) ||
        (i === 0 && j === pos.length - 1) ||
        (i === pos.length - 1 && j === 0);
      if (!onFinder) alignment(x, y);
    });
  });
  drawFormat(0); // reserve the space; the real value is drawn later
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFixed(a, b, dark);
      setFixed(b, a, dark);
    }
  }

  // Place the data in the zigzag pattern
  let k = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!fixed[y][x] && k < codewords.length * 8) {
          modules[y][x] = ((codewords[k >>> 3] >>> (7 - (k & 7))) & 1) !== 0;
          k++;
        }
      }
    }
  }

  const maskRule = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];

  function applyMask(mask) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!fixed[y][x] && maskRule[mask](x, y)) modules[y][x] = !modules[y][x];
      }
    }
  }

  // A simple penalty score: long runs, 2x2 blocks and unbalanced colours score badly
  function penalty() {
    let score = 0;
    const lines = [];
    for (let i = 0; i < size; i++) {
      lines.push(modules[i]);
      lines.push(modules.map((row) => row[i]));
    }
    lines.forEach((line) => {
      let run = 1;
      for (let i = 1; i < size; i++) {
        if (line[i] === line[i - 1]) {
          run++;
          if (run === 5) score += 3;
          else if (run > 5) score += 1;
        } else {
          run = 1;
        }
      }
    });
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const c = modules[y][x];
        if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) {
          score += 3;
        }
      }
    }
    let dark = 0;
    modules.forEach((row) => row.forEach((c) => (dark += c ? 1 : 0)));
    const percent = (dark * 100) / (size * size);
    score += Math.floor(Math.abs(percent - 50) / 5) * 10;
    return score;
  }

  let best = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(mask);
    drawFormat(mask);
    const score = penalty();
    if (score < bestScore) {
      bestScore = score;
      best = mask;
    }
    applyMask(mask); // undo
  }
  applyMask(best);
  drawFormat(best);
  return { size, modules };
}

// Makes the QR code for a piece of text (throws if the text is too long)
export function makeQr(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  for (let version = 1; version <= MAX_VERSION; version++) {
    const header = 4 + (version <= 9 ? 8 : 16);
    if (header + bytes.length * 8 <= dataCodewords(version) * 8) {
      const { size, modules } = layout(version, buildCodewords(bytes, version));
      return { size, version, dark: (x, y) => modules[y][x] };
    }
  }
  throw new Error("That text is too long for a QR code here.");
}

// The code as an SVG path (one small square per dark module), with a quiet border
export function qrPath(qr, border = 4) {
  let d = "";
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.dark(x, y)) d += "M" + (x + border) + "," + (y + border) + "h1v1h-1z";
    }
  }
  return d;
}