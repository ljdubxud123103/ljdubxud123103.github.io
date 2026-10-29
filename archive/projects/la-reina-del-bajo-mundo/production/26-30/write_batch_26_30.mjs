import fs from 'node:fs/promises';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
const target='/Users/apple/Desktop/前夫黑道酵母_分镜_21-33.xlsx';
const rows=JSON.parse(await fs.readFile('../production-26-30/rows.json','utf8'));
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(target));
const sheet=wb.worksheets.getItem('分镜脚本');
for(let i=0;i<rows.length;i++) sheet.getRange(`A${26+i}:I${26+i}`).copyFrom(sheet.getRange('A2:I2'),'all');
sheet.getRange(`A26:I${25+rows.length}`).values=rows;
wb.recalculate();
console.log((await wb.inspect({kind:'table',range:'分镜脚本!A26:E28',tableMaxRows:3,tableMaxCols:5,maxChars:1500})).ndjson);
for (const [name,range] of [['start','A25:I27'],['middle','A35:I36'],['end','A45:I46']]) {
 const preview=await wb.render({sheetName:'分镜脚本',range,scale:1,format:'png'});
 await fs.writeFile(`../production-26-30/preview-${name}.png`,new Uint8Array(await preview.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(wb)).save('../production-26-30/checked-workbook.xlsx');
