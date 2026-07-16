const fs = require('fs');
const path = require('path');

const writeFileDeclaration = {
    name: 'writeFile',
    description: '將內容寫入本機檔案。若檔案所在資料夾不存在會自動建立，若檔案已存在則依 mode 決定覆寫或附加',
    parameters: {
        type: 'OBJECT',
        properties: {
            filePath: {
                type: 'STRING',
                description: '要寫入的檔案完整路徑，例如 C:\\Users\\ray\\notes.txt 或 /Users/ray/notes.txt',
            },
            content: {
                type: 'STRING',
                description: '要寫入的文字內容',
            },
            mode: {
                type: 'STRING',
                description: '寫入模式："overwrite"（覆寫，預設）或 "append"（附加在檔案最後）',
            },
        },
        required: ['filePath', 'content'],
    },
};

function writeFile(args) {
    const { filePath, content, mode } = args;
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (mode === 'append') {
            fs.appendFileSync(filePath, content, 'utf-8');
        } else {
            fs.writeFileSync(filePath, content, 'utf-8');
        }

        return `已成功寫入檔案：${filePath}`;
    } catch (error) {
        return `寫入檔案失敗：${error.message}`;
    }
}

module.exports = {
    declaration: writeFileDeclaration,
    handler: writeFile,
};