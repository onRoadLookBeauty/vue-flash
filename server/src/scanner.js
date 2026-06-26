import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { queryAll, queryOne, execute, saveDb } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GAME_DIR = process.env.GAME_DIR || path.resolve(__dirname, '..', '..', 'game')

/**
 * 递归扫描 game/ 目录下的 .swf 文件
 * - 子目录名自动作为主分类标签
 * - 文件名关键词作为附加标签
 * - 支持多标签（逗号分隔存入 tags 字段）
 */
export function scanGames() {
  if (!fs.existsSync(GAME_DIR)) {
    console.warn(`游戏目录不存在: ${GAME_DIR}`)
    fs.mkdirSync(GAME_DIR, { recursive: true })
    return { added: 0, removed: 0, total: 0 }
  }

  // 收集所有 SWF 文件（递归）
  const allFiles = collectSwfFiles(GAME_DIR)
  const dbRecords = queryAll('SELECT id, filepath, filename, tags, active FROM games')
  const dbMap = new Map(dbRecords.map(r => [r.filepath, r]))

  let added = 0

  for (const item of allFiles) {
    const { filePath, filepath, filename, dirCategory } = item
    try {
      const stat = fs.statSync(filePath)
      const size = stat.size
      const name = filename.replace(/\.swf$/i, '')

      // 构建标签：子目录名 + 关键词猜测
      const keywordTags = guessTags(name)
      let tags
      if (dirCategory && !keywordTags.includes(dirCategory)) {
        tags = [dirCategory, ...keywordTags.filter(t => t !== '未分类')]
      } else {
        tags = keywordTags.length ? keywordTags : ['未分类']
      }
      // 去重
      const uniqueTags = [...new Set(tags)]
      const tagsStr = uniqueTags.join(',')
      const primaryCategory = uniqueTags[0]

      const existing = dbMap.get(filepath)

      if (existing) {
        // 更新已有记录
        execute(
          `UPDATE games SET filename=?, name=?, category=?, tags=?, size=?, active=1, updated_at=datetime('now','localtime') WHERE filepath=?`,
          [filename, name, primaryCategory, tagsStr, size, filepath]
        )
      } else {
        // 新增
        execute(
          `INSERT INTO games (filename, filepath, name, category, tags, size, active, created_at, updated_at)
           VALUES (?,?,?,?,?,?,1,datetime('now','localtime'),datetime('now','localtime'))`,
          [filename, filepath, name, primaryCategory, tagsStr, size]
        )
        console.log(`  + 新增: ${name} [${tagsStr}]`)
        added++
      }
    } catch (err) {
      console.error(`  扫描错误 (${filepath}):`, err.message)
    }
  }

  // 标记缺失游戏
  const actualFilepaths = new Set(allFiles.map(f => f.filepath))
  let removed = 0
  for (const [fp, record] of dbMap) {
    if (!actualFilepaths.has(fp) && record.active === 1) {
      execute('UPDATE games SET active=0, updated_at=datetime(\'now\',\'localtime\') WHERE id=?', [record.id])
      console.log(`  - 缺失: ${fp}`)
      removed++
    }
  }

  saveDb()

  const result = queryOne('SELECT COUNT(*) as count FROM games WHERE active = 1')
  const total = result ? result.count : 0

  return { added, removed, total }
}

/**
 * 递归收集所有 .swf 文件
 */
function collectSwfFiles(rootDir, relativePath = '') {
  const results = []
  const entries = fs.readdirSync(path.join(rootDir, relativePath), { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(rootDir, relativePath, entry.name)
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      results.push(...collectSwfFiles(rootDir, relPath))
    } else if (entry.name.toLowerCase().endsWith('.swf')) {
      // 提取子目录名作为主分类
      const dirCategory = relativePath ? relativePath.split('/')[0] : null

      results.push({
        filePath: fullPath,
        filepath: relPath,           // 相对路径，如 "射击类/游戏.swf"
        filename: entry.name,        // 文件名
        dirCategory,                 // 子目录名作为分类
      })
    }
  }

  return results
}

/**
 * 根据文件名关键词猜测标签（可返回多个）
 */
function guessTags(name) {
  const lower = name.toLowerCase()
  const tags = []

  const rules = [
    { keys: ['射击', '枪', '坦克', 'shoot', 'gun', 'sniper', 'zombie', '僵尸', '丧尸'], tag: '射击类' },
    { keys: ['动作', 'action', 'fight', '格斗', '忍者', 'ninja'], tag: '动作类' },
    { keys: ['冒险', 'adventure', 'adventur', '解谜', '逃生', '逃脱'], tag: '冒险类' },
    { keys: ['益智', 'puzzle', '数独', '迷宫', 'maze', 'find', '找茬'], tag: '益智类' },
    { keys: ['策略', 'strategy', '塔防', 'td', 'defense', '战争', 'war'], tag: '策略类' },
    { keys: ['体育', 'sport', '足球', '篮球', '台球', '乒乓球', '网球', '高尔夫'], tag: '体育类' },
    { keys: ['休闲', 'casual', '连连看', '消消', '泡泡', 'bubble', 'match'], tag: '休闲类' },
    { keys: ['竞速', 'racing', '赛车', '跑酷', '摩托', '自行车'], tag: '竞速类' },
    { keys: ['模拟', 'simulation', '经营', '餐厅', '医院', '农场', 'farming'], tag: '模拟类' },
    { keys: ['音乐', 'music', '节奏', '钢琴', '吉他', '鼓', 'drum'], tag: '音乐类' },
    { keys: ['平台', 'platform', '超级玛丽', 'mario', '索尼克', 'sonic'], tag: '平台类' },
    { keys: ['防御', 'defense', '保卫', '守卫', '防御战'], tag: '防御类' },
    { keys: ['角色', 'rpg', 'role', '勇者', '骑士', '法师'], tag: '角色扮演' },
  ]

  for (const rule of rules) {
    if (rule.keys.some(k => lower.includes(k))) {
      tags.push(rule.tag)
    }
  }

  return tags.length > 0 ? tags : ['未分类']
}

/**
 * 计算文件 MD5
 */
function computeMD5(filePath) {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex')
}

/**
 * 启动文件监听
 */
export function startWatcher(callback) {
  const result = scanGames()
  if (callback) callback(result)

  try {
    fs.watch(GAME_DIR, { recursive: true }, (eventType, changedFile) => {
      if (!changedFile) return
      const ext = path.extname(changedFile).toLowerCase()
      if (ext === '.swf') {
        console.log(`检测到文件变更 (${eventType}): ${changedFile}`)
        setTimeout(() => {
          const result = scanGames()
          if (callback) callback(result)
        }, 2000)
      }
    })
    console.log(`文件监听已启动: ${GAME_DIR}`)
  } catch {
    console.log('文件监听未启用，使用 POST /api/admin/scan 手动触发扫描')
  }
}

/**
 * 获取所有分类（含数量）— 基于 tags 拆分统计
 */
export function getCategories() {
  // 从所有游戏的 tags 字段中统计各标签出现次数
  const rows = queryAll(`SELECT tags FROM games WHERE active = 1`)
  const countMap = {}

  for (const row of rows) {
    const tagList = (row.tags || '').split(',').map(s => s.trim()).filter(Boolean)
    for (const tag of tagList) {
      countMap[tag] = (countMap[tag] || 0) + 1
    }
  }

  return Object.entries(countMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}
