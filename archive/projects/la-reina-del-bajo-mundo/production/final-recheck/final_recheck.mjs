import fs from 'node:fs/promises';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
const target='/Users/apple/Desktop/前夫黑道酵母_分镜_21-33.xlsx';
const groups=await Promise.all(['21-25','26-30','31-33'].map(async id=>JSON.parse(await fs.readFile(`../production-${id}/rows.json`,'utf8'))));
const rows=groups.flat();
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(target));
const s=wb.worksheets.getItem('分镜脚本');
s.getRange('A2:I60').values=rows;
wb.recalculate();
console.log((await wb.inspect({kind:'table',range:'分镜脚本!A19:E21',tableMaxRows:3,tableMaxCols:5,maxChars:1200})).ndjson);
for(const [name,range] of [['actions','A17:I17'],['exit','A24:I25'],['stage','A56:I57']]){
 const blob=await wb.render({sheetName:'分镜脚本',range,scale:1,format:'png'});
 await fs.writeFile(`../production-final-recheck/preview-${name}.png`,new Uint8Array(await blob.arrayBuffer()));
}
await(await SpreadsheetFile.exportXlsx(wb)).save('../production-final-recheck/checked-workbook.xlsx');
