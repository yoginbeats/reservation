const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber
} = require('docx');

const mdPath = path.join(__dirname, '..', 'paper.md');
const content = fs.readFileSync(mdPath, 'utf8');

const lines = content.split(/\r?\n/);
const children = [];

let inCodeBlock = false;
let codeLines = [];
let inTable = false;
let tableRows = [];

function flushCodeBlock() {
  if (codeLines.length > 0) {
    const text = codeLines.join('\n');
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            font: 'Courier New',
            size: 18, // 9pt
          })
        ],
        spacing: { before: 120, after: 120 }
      })
    );
    codeLines = [];
  }
}

function flushTable() {
  if (tableRows.length > 0) {
    const rows = [];
    tableRows.forEach((rowCells, rIdx) => {
      const isHeader = rIdx === 0;
      const cells = rowCells.map(cellText => {
        return new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cellText.trim(),
                  bold: isHeader,
                  size: 22,
                  font: 'Arial'
                })
              ],
              alignment: AlignmentType.LEFT,
              spacing: { before: 60, after: 60 }
            })
          ],
          shading: isHeader ? { fill: 'E2E8F0' } : undefined,
          margins: { top: 100, bottom: 100, left: 150, right: 150 }
        });
      });
      rows.push(new TableRow({ children: cells }));
    });

    children.push(
      new Table({
        rows: rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        spacing: { before: 140, after: 140 }
      })
    );
    tableRows = [];
  }
}

function parseFormattedRuns(text) {
  // Support **bold**, *italic*, math $$..$$
  // Split by ** or *
  const runs = [];
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\$\$.*?\$\$)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({
        text: part.slice(2, -2),
        bold: true,
        font: 'Arial',
        size: 24
      }));
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push(new TextRun({
        text: part.slice(1, -1),
        italics: true,
        font: 'Arial',
        size: 24
      }));
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(new TextRun({
        text: part.slice(1, -1),
        font: 'Courier New',
        size: 22
      }));
    } else if (part.startsWith('$$') && part.endsWith('$$')) {
      runs.push(new TextRun({
        text: part.slice(2, -2),
        bold: true,
        font: 'Cambria Math',
        size: 24
      }));
    } else {
      runs.push(new TextRun({
        text: part,
        font: 'Arial',
        size: 24
      }));
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text, font: 'Arial', size: 24 })];
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.startsWith('```')) {
    if (inCodeBlock) {
      flushCodeBlock();
      inCodeBlock = false;
    } else {
      inCodeBlock = true;
    }
    continue;
  }

  if (inCodeBlock) {
    codeLines.push(line);
    continue;
  }

  // Table handling: starts with |
  if (line.trim().startsWith('|')) {
    const rawCells = line.split('|').slice(1, -1);
    const isDivider = rawCells.every(c => c.trim().match(/^[:\-\s]+$/));
    if (!isDivider) {
      tableRows.push(rawCells);
    }
    inTable = true;
    continue;
  } else if (inTable) {
    flushTable();
    inTable = false;
  }

  const trimmed = line.trim();
  if (trimmed === '' || trimmed === '---') {
    if (trimmed === '---') {
      children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
    }
    continue;
  }

  // Headings
  if (line.startsWith('# ')) {
    children.push(
      new Paragraph({
        text: line.replace('# ', '').trim(),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 280, after: 140 },
        run: { font: 'Arial', bold: true, size: 32 }
      })
    );
  } else if (line.startsWith('## ')) {
    children.push(
      new Paragraph({
        text: line.replace('## ', '').trim(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        run: { font: 'Arial', bold: true, size: 28 }
      })
    );
  } else if (line.startsWith('### ')) {
    children.push(
      new Paragraph({
        text: line.replace('### ', '').trim(),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
        run: { font: 'Arial', bold: true, size: 26 }
      })
    );
  } else if (line.startsWith('#### ')) {
    children.push(
      new Paragraph({
        text: line.replace('#### ', '').trim(),
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 160, after: 80 },
        run: { font: 'Arial', bold: true, size: 24 }
      })
    );
  } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    const itemText = trimmed.replace(/^[\-\*]\s+/, '');
    children.push(
      new Paragraph({
        children: parseFormattedRuns(itemText),
        bullet: { level: 0 },
        spacing: { before: 50, after: 50 }
      })
    );
  } else if (/^\d+\.\s+/.test(trimmed)) {
    const itemText = trimmed.replace(/^\d+\.\s+/, '');
    children.push(
      new Paragraph({
        children: parseFormattedRuns(itemText),
        bullet: { level: 0 },
        spacing: { before: 50, after: 50 }
      })
    );
  } else {
    // Normal paragraph
    const isCentered = i < 20 && (trimmed.includes('Presented to') || trimmed.includes('Camarines') || trimmed.includes('College') || trimmed.includes('Degree') || trimmed.includes('Bachelor') || trimmed.includes('2026') || trimmed.startsWith('By:'));
    children.push(
      new Paragraph({
        children: parseFormattedRuns(trimmed),
        alignment: isCentered ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 80, after: 80, line: 360 } // 1.5 line spacing (360)
      })
    );
  }
}

flushCodeBlock();
flushTable();

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: 'Page ',
                  font: 'Arial',
                  size: 20
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: 'Arial',
                  size: 20
                })
              ]
            })
          ]
        })
      },
      children: children
    }
  ]
});

async function main() {
  const buffer = await Packer.toBuffer(doc);
  
  // Destination 1: Project root
  const outRoot = path.join(__dirname, '..', 'Superlines_Capstone_Documentation_2026.docx');
  fs.writeFileSync(outRoot, buffer);
  console.log('Saved to:', outRoot);

  // Destination 2: public/downloads folder (accessible via web)
  const publicDir = path.join(__dirname, '..', 'public', 'downloads');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const outPublic = path.join(publicDir, 'Superlines_Capstone_Documentation_2026.docx');
  fs.writeFileSync(outPublic, buffer);
  console.log('Saved to:', outPublic);

  // Destination 3: d:\JILWC48\
  const jilwcDir = 'd:\\JILWC48';
  if (fs.existsSync(jilwcDir)) {
    const outJilwc = path.join(jilwcDir, 'Superlines_Capstone_Documentation_2026_Updated.docx');
    fs.writeFileSync(outJilwc, buffer);
    console.log('Saved to:', outJilwc);
  }

  console.log('DOCX Generation Complete!');
}

main().catch(err => {
  console.error('Error generating docx:', err);
  process.exit(1);
});
