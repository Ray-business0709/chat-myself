const getCurrentTimeDeclaration = {
    name: 'getCurrentTime',
    description: '取得目前的日期與時間',
    parameters: {
        type: 'OBJECT',
        properties: {
            timezone: {
                type: 'STRING',
                description: '時區,例如 Asia/Taipei',
            },
        },
        required: ['timezone'],
    },
};

function getTime(args) {
    const { timezone } = args;
    const now = new Date();
    const timeInTimezone = now.toLocaleString("en-US", { timeZone: timezone });
    return timeInTimezone;
}

module.exports = {
    declaration: getCurrentTimeDeclaration,
    handler: getTime,
};