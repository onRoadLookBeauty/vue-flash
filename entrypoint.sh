#!/bin/sh
set -e

echo "--- Flash Games 容器启动 ---"

# 如果用户挂载的 game 目录为空，自动复制内置游戏
if [ -z "$(ls -A /app/game 2>/dev/null)" ]; then
  echo "📦 检测到 game 目录为空，正在复制内置游戏..."
  cp /app/game_default/*.swf /app/game/ 2>/dev/null || true
  count=$(ls /app/game/*.swf 2>/dev/null | wc -l)
  echo "✅ 内置游戏复制完成（共 ${count} 款）"
fi

echo "🚀 启动 Node.js 服务..."
exec node server/src/index.js
