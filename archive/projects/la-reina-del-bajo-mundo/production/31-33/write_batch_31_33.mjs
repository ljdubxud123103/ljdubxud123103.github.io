import fs from 'node:fs/promises';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
const target='/Users/apple/Desktop/前夫黑道酵母_分镜_21-33.xlsx';
const rows=JSON.parse(await fs.readFile('../production-31-33/rows.json','utf8'));
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(target));
const sheet=wb.worksheets.getItem('分镜脚本');
for(let i=0;i<rows.length;i++) sheet.getRange(`A${47+i}:I${47+i}`).copyFrom(sheet.getRange('A2:I2'),'all');
sheet.getRange(`A47:I${46+rows.length}`).values=rows;
wb.recalculate();
console.log((await wb.inspect({kind:'table',range:'分镜脚本!A47:E50',tableMaxRows:4,tableMaxCols:5,maxChars:1800})).ndjson);
for (const [name,range] of [['start','A46:I48'],['middle','A54:I55'],['end',`A${45+rows.length}:I${46+rows.length}`]]) {
 const preview=await wb.render({sheetName:'分镜脚本',range,scale:1,format:'png'});
 await fs.writeFile(`../production-31-33/preview-${name}.png`,new Uint8Array(await preview.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(wb)).save('../production-31-33/checked-workbook.xlsx');
