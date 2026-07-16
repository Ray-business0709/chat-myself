const getCurrentTimeDeclaration = {
    type: 'function',
    function : {
        name: 'getCurrentTime',
        description: '取得目前的日期與時間',
        parameters: {
            type: 'object',
            properties: {
                timezone: {
                    type: 'string',
                    description: '時區,例如 Asia/Taipei',
                },
            },
            required: ['timezone'],
        }
    }
};

function getTime(args) {
    const { timezone } = args;
    const now = new Date();
    try{
        const timeInTimezone = now.toLocaleString("en-US", { timeZone: timezone });
        return timeInTimezone;
    }
    catch (error) {
        return `取得時間失敗：${error.message}`;
    }
}

module.exports = {
    declaration: getCurrentTimeDeclaration,
    handler: getTime,
};