// 将 @ruffle-rs/ruffle 的核心文件复制到 public/ruffle/ 供 script 标签加载
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcDir = join(__dirname, '..', 'node_modules', '@ruffle-rs', 'ruffle')
const destDir = join(__dirname, '..', 'public', 'ruffle')

if (!existsSync(srcDir)) {
  console.warn('⚠️  @ruffle-rs/ruffle 未安装，跳过复制')
  process.exit(0)
}

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true })
}

const files = readdirSync(srcDir).filter(
  f => f.endsWith('.js') || f.endsWith('.wasm')
)

for (const file of files) {
  copyFileSync(join(srcDir, file), join(destDir, file))
  console.log(`  copied: ${file}`)
}

console.log(`✅ Ruffle 文件已复制到 public/ruffle/ (${files.length} 个文件)`)
