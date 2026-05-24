/**
 * Extrai cabeçalho + amostra do Excel Ford (vin_share) para JSON no app.
 * Uso: node scripts/extract-vin-data.js [caminho.xlsx] [maxRows]
 */
const fs = require('fs');
const path = require('path');
const sax = require('sax');

const XLSX_PATH =
  process.argv[2] ||
  'c:/Users/phj20/Downloads/Ford/vin_share_Desafio_02.xlsx';
const MAX_ROWS = parseInt(process.argv[3] || '800', 10);
const OUT_DIR = path.join(__dirname, '..', 'src', 'data');
const OUT_FILE = path.join(OUT_DIR, 'vin_database.json');

function unzipXlsx(xlsxPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const zipPath = path.join(destDir, 'workbook.zip');
  fs.copyFileSync(xlsxPath, zipPath);
  const { execSync } = require('child_process');
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`,
    { stdio: 'inherit' }
  );
}

function parseSharedStrings(xmlPath) {
  return new Promise((resolve, reject) => {
    const strings = [];
    let current = '';
    let inT = false;
    const parser = sax.createStream(true, { trim: true });
    parser.on('opentag', (node) => {
      if (node.name === 't') inT = true;
      if (node.name === 'si') current = '';
    });
    parser.on('text', (text) => {
      if (inT) current += text;
    });
    parser.on('closetag', (name) => {
      if (name === 't') inT = false;
      if (name === 'si') strings.push(current);
    });
    parser.on('end', () => resolve(strings));
    parser.on('error', reject);
    fs.createReadStream(xmlPath).pipe(parser);
  });
}

function streamSheetRows(sheetPath, sharedStrings, maxDataRows) {
  return new Promise((resolve, reject) => {
    const rows = [];
    let currentRow = null;
    let currentCell = null;
    let cellValue = '';
    let inV = false;
    let inIs = false;
    let inlineText = '';
    let inT = false;
    let done = false;

    const parser = sax.createStream(true, { trim: true });
    const stream = fs.createReadStream(sheetPath, { highWaterMark: 64 * 1024 });

    const stopEarly = () => {
      if (done) return;
      done = true;
      stream.destroy();
      resolve(rows);
    };

    const finishRow = () => {
      if (!currentRow) return;
      rows.push(currentRow.cells);
      currentRow = null;
      if (rows.length >= maxDataRows) stopEarly();
    };

    parser.on('opentag', (node) => {
      if (node.name === 'row') {
        currentRow = { cells: [] };
      }
      if (node.name === 'c' && currentRow) {
        currentCell = {
          ref: node.attributes.r || '',
          type: node.attributes.t || '',
          value: '',
        };
        cellValue = '';
        inlineText = '';
      }
      if (node.name === 'v') inV = true;
      if (node.name === 'is') inIs = true;
      if (node.name === 't' && inIs) inT = true;
    });

    parser.on('text', (text) => {
      if (inV) cellValue += text;
      if (inT) inlineText += text;
    });

    parser.on('closetag', (name) => {
      if (name === 't' && inIs) inT = false;
      if (name === 'v') inV = false;
      if (name === 'is') inIs = false;
      if (name === 'c' && currentRow && currentCell) {
        let val = cellValue;
        if (currentCell.type === 's') {
          const idx = parseInt(cellValue, 10);
          val = sharedStrings[idx] ?? '';
        } else if (inlineText) {
          val = inlineText;
        }
        currentCell.value = val;
        currentRow.cells.push(currentCell.value);
        currentCell = null;
      }
      if (name === 'row') {
        finishRow();
      }
    });

    parser.on('end', () => {
      if (!done) resolve(rows);
    });
    parser.on('error', (err) => {
      if (done) return;
      reject(err);
    });

    stream.pipe(parser);
    stream.on('error', (err) => {
      if (done) return;
      reject(err);
    });
  });
}

async function main() {
  const tempDir = path.join(__dirname, '..', '.tmp-xlsx');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  console.log('Extraindo xlsx...');
  unzipXlsx(XLSX_PATH, tempDir);

  const sharedPath = path.join(tempDir, 'xl', 'sharedStrings.xml');
  const sheetPath = path.join(tempDir, 'xl', 'worksheets', 'sheet1.xml');

  console.log('Lendo shared strings...');
  const sharedStrings = await parseSharedStrings(sharedPath);
  console.log('Shared strings:', sharedStrings.length);

  console.log('Lendo linhas da planilha (max', MAX_ROWS + 1, 'incl. header)...');
  const rawRows = await streamSheetRows(sheetPath, sharedStrings, MAX_ROWS + 1);
  console.log('Linhas lidas:', rawRows.length);

  if (rawRows.length < 2) {
    throw new Error('Não foi possível ler dados da planilha vin_share');
  }

  const headers = rawRows[0].map((h, i) => {
    const s = String(h || '').trim();
    return s || `col_${i}`;
  });

  const records = rawRows.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((key, i) => {
      obj[key] = cells[i] != null ? String(cells[i]) : '';
    });
    return obj;
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const output = {
    meta: {
      source: 'vin_share_Desafio_02.xlsx',
      extractedAt: new Date().toISOString(),
      totalInFile: 602788,
      sampleSize: records.length,
      columns: headers,
    },
    records,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output));
  console.log('Salvo:', OUT_FILE, `(${records.length} registros)`);
  console.log('Colunas:', headers.join(' | '));

  fs.rmSync(tempDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
