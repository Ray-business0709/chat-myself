const getCurrentTime = require('./getCurrentTime');

const tools = [
  getCurrentTime,
  // 以後新增工具,就繼續往這裡塞
];

const handlerMap = tools.reduce((acc, tool) => {
  acc[tool.declaration.name] = tool.handler;
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