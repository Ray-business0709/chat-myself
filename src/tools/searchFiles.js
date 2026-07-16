const fs = require('fs');
const path = require('path');

const searchFilesDeclaration = {
    type: 'function',
    function:{
        name: 'searchFiles',
        description: '在指定資料夾中搜尋檔案，可選擇是否遞迴進入子資料夾、並依關鍵字或副檔名過濾。不帶關鍵字/副檔名時等同列出該資料夾內容',
        parameters: {
            type: 'object',
            properties: {
                startPath: {
                    type: 'string',
                    description: '要開始搜尋的資料夾路徑，例如 C:\\Users\\ray\\Documents 或 /Users/ray/Documents',
                },
                keyword: {
                    type: 'string',
                    description: '選填，檔名需包含的關鍵字（不分大小寫）',
                },
                extension: {
                    type: 'string',
                    description: '選填，副檔名過濾，例如 ".pdf" 或 ".txt"',
                },
                recursive: {
                    type: 'boolean',
                    description: '是否遞迴搜尋所有子資料夾，預設 false（只看這一層）',
                },
            },
            required: ['startPath'],
        },
    }
};

const MAX_RESULTS = 100;

function searchFiles(args) {
    const { startPath, keyword, extension, recursive } = args;

    if (!fs.existsSync(startPath)) {
        return `搜尋失敗：路徑不存在 - ${startPath}`;
    }

    const results = [];

    function walk(dir) {
        if (results.length >= MAX_RESULTS) return;

        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (error) {
            return; // 沒有權限或其他讀取錯誤，略過這個資料夾
        }

        for (const entry of entries) {
            if (results.length >= MAX_RESULTS) return;
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (recursive) walk(fullPath);
                continue;
            }

            if (keyword && !entry.name.toLowerCase().includes(keyword.toLowerCase())) continue;
            if (extension && path.extname(entry.name).toLowerCase() !== extension.toLowerCase()) continue;

            let size = null;
            try {
                size = fs.statSync(fullPath).size;
            } catch (error) {
                // 忽略拿不到檔案大小的情況
            }

            results.push({ path: fullPath, sizeBytes: size });
        }
    }

    try {
        walk(startPath);
    } catch (error) {
        return `搜尋失敗：${error.message}`;
    }

    if (results.length === 0) {
        return '沒有找到符合條件的檔案';
    }

    const truncatedNote = results.length >= MAX_RESULTS
        ? `\n（結果已達上限 ${MAX_RESULTS} 筆，可能還有更多未列出，建議加上 keyword 或 extension 縮小範圍）`
        : '';

    return JSON.stringify(results, null, 2) + truncatedNote;
}

module.exports = {
    declaration: searchFilesDeclaration,
    handler: searchFiles,
};