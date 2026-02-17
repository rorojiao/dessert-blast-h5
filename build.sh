#!/bin/bash
# 构建 dessert-blast H5版 bundle.js
set -e

WX_DIR="/home/msdn/.openclaw/workspace/dessert-blast-wx"
H5_DIR="/home/msdn/dessert-blast-h5"

# 模块列表（依赖顺序）
MODULES=(
  "js/config.js:./js/config"
  "js/save.js:./js/save"
  "js/sound.js:./js/sound"
  "js/renderer.js:./js/renderer"
  "js/particles.js:./js/particles"
  "js/scene-manager.js:./js/scene-manager"
  "js/scenes/home.js:./js/scenes/home"
  "js/scenes/game.js:./js/scenes/game"
  "js/scenes/achievements.js:./js/scenes/achievements"
  "js/scenes/themes.js:./js/scenes/themes"
  "js/scenes/stats.js:./js/scenes/stats"
  "game.js:./game"
)

BUNDLE="$H5_DIR/bundle.js"

# 先写入 wx-adapter
cat "$H5_DIR/wx-adapter.js" > "$BUNDLE"

# 写入模块系统
cat >> "$BUNDLE" << 'MODSYS'

;(function() {
var _modules = {};
var _cache = {};

function define(name, fn) { _modules[name] = fn; }

function require(name) {
  // 路径标准化: 去掉 ./ 前缀，尝试多种变体
  var normalized = name.replace(/^\.\//, '');
  var variants = [name, normalized, './' + normalized];
  for (var i = 0; i < variants.length; i++) {
    var n = variants[i];
    if (_cache[n]) return _cache[n].exports;
    if (_modules[n]) {
      var mod = { exports: {} };
      _cache[n] = mod;
      _modules[n](mod, mod.exports, require);
      // 也缓存其他变体
      for (var j = 0; j < variants.length; j++) _cache[variants[j]] = mod;
      return mod.exports;
    }
  }
  console.error('Module not found: ' + name);
  return {};
}

window.define = define;
window.require = require;
MODSYS

# 包裹每个模块
for entry in "${MODULES[@]}"; do
  FILE="${entry%%:*}"
  MODNAME="${entry##*:}"
  FILEPATH="$WX_DIR/$FILE"

  if [ ! -f "$FILEPATH" ]; then
    echo "WARNING: $FILEPATH not found, skipping"
    continue
  fi

  echo "" >> "$BUNDLE"
  echo "define('$MODNAME', function(module, exports, require) {" >> "$BUNDLE"
  cat "$FILEPATH" >> "$BUNDLE"
  echo "" >> "$BUNDLE"
  echo "});" >> "$BUNDLE"
done

# 启动入口
cat >> "$BUNDLE" << 'ENTRY'

// 启动游戏
require('./game');

})();
ENTRY

echo "Bundle built: $BUNDLE ($(wc -c < "$BUNDLE") bytes)"
