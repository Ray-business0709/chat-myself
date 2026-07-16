const fs = require('fs');

const readFileDeclaration = {
    name: 'readFile',
    description: '讀取本機檔案的內容，回傳文字內容',
    parameters: {
        type: 'OBJECT',
        properties: {
            filePath: {
                type: 'STRING',
                description: '要讀取的檔案完整路徑，例如 C:\\Users\\ray\\notes.txt 或 /Users/ray/notes.txt',
            },
        },
        required: ['filePath'],
    },
};

function readFile(args) {
    const { filePath } = args;
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        // 避免內容太大塞爆 context，超過的部分截斷
        const MAX_LENGTH = 20000;
        if (content.length > MAX_LENGTH) {
            return content.slice(0, MAX_LENGTH) + `\n...（內容過長，已截斷，總長度 ${content.length} 字元）`;
        }
        return content;
    } catch (error) {
        return `讀取檔案失敗：${error.message}`;
    }
}

module.exports = {
    declaration: readFileDeclaration,
    handler: readFile,
};