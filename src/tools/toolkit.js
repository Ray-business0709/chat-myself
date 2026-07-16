const getCurrentTime = require('./getCurrentTime');
const readFile = require('./readFile');
const writeFile = require('./writeFile');
const searchFiles = require('./searchFiles');
const tools = [
    getCurrentTime,
    readFile,
    writeFile,
    searchFiles,
];

const handlerMap = tools.reduce((acc, tool) => {
  acc[tool.declaration.function.name] = tool.handler;
  return acc;
}, {});

function listTools() {
    return tools.map(tool => tool.declaration);
}

function useTool(toolName, args) {
    const handler = handlerMap[toolName];
    if (!handler) {
        throw new Error(`Tool ${toolName} not found`);
    }
    return handler(args);
}

module.exports = {
    listTools,
    useTool,
};