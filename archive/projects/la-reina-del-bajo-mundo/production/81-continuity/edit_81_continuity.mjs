import fs from 'node:fs/promises';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
const target='/Users/apple/Desktop/前夫黑道酵母_分镜_81-93.xlsx';
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(target));
const s=wb.worksheets.getItem('分镜脚本');
if(process.argv[2]==='preview'){
 const p=await wb.render({sheetName:'分镜脚本',range:'A4:I6',scale:1,format:'png'});
 await fs.writeFile('../production-81-continuity/preview-before.png',new Uint8Array(await p.arrayBuffer()));
}else{
 const rows=JSON.parse(await fs.readFile('../production-81-continuity/rows.json','utf8'));
 s.getRange(`A2:I${rows.length+1}`).values=rows;
 s.getRange(`A${rows.length+2}:I${rows.length+2}`).values=[Array(9).fill(null)];
 wb.recalculate();
 console.log((await wb.inspect({kind:'table',range:'分镜脚本!A4:E6',tableMaxRows:3,tableMaxCols:5,maxChars:1200})).ndjson);
 const p=await wb.render({sheetName:'分镜脚本',range:'A4:I6',scale:1,format:'png'});
 await fs.writeFile('../production-81-continuity/preview-after.png',new Uint8Array(await p.arrayBuffer()));
 await(await SpreadsheetFile.exportXlsx(wb)).save('../production-81-continuity/checked-workbook.xlsx');
}
