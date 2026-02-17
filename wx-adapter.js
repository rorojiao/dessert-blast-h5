// wx-adapter.js - 模拟微信小游戏API给浏览器用
(function() {
  var _canvas = document.getElementById('gameCanvas');
  _canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
  _canvas.height = window.innerHeight * (window.devicePixelRatio || 1);

  var _touchStartCbs = [];
  var _touchMoveCbs = [];
  var _touchEndCbs = [];

  window.wx = {
    createCanvas: function() {
      // 给 canvas 附加微信小游戏期望的方法
      _canvas.createImage = function() { return new Image(); };
      return _canvas;
    },

    getSystemInfoSync: function() {
      return {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
        screenWidth: screen.width,
        screenHeight: screen.height,
        platform: 'browser'
      };
    },

    onTouchStart: function(cb) { _touchStartCbs.push(cb); },
    onTouchMove: function(cb) { _touchMoveCbs.push(cb); },
    onTouchEnd: function(cb) { _touchEndCbs.push(cb); },

    getStorageSync: function(key) {
      try { return localStorage.getItem(key) || ''; } catch(e) { return ''; }
    },
    setStorageSync: function(key, val) {
      try { localStorage.setItem(key, val); } catch(e) {}
    },

    vibrateShort: function() {
      try { if (navigator.vibrate) navigator.vibrate(15); } catch(e) {}
    },
    vibrateLong: function() {
      try { if (navigator.vibrate) navigator.vibrate(400); } catch(e) {}
    },

    createInnerAudioContext: function() {
      var audio = new Audio();
      return {
        src: '',
        loop: false,
        volume: 1,
        play: function() { try { audio.src = this.src; audio.loop = this.loop; audio.volume = this.volume; audio.play(); } catch(e) {} },
        stop: function() { try { audio.pause(); audio.currentTime = 0; } catch(e) {} },
        destroy: function() { audio = null; }
      };
    }
  };

  // 将触摸/鼠标事件统一转换为微信格式
  function wrapTouchEvent(e) {
    var touches = [];
    var changedTouches = [];
    if (e.touches) {
      for (var i = 0; i < e.touches.length; i++) {
        touches.push({ clientX: e.touches[i].clientX, clientY: e.touches[i].clientY, identifier: e.touches[i].identifier });
      }
      for (var i = 0; i < e.changedTouches.length; i++) {
        changedTouches.push({ clientX: e.changedTouches[i].clientX, clientY: e.changedTouches[i].clientY, identifier: e.changedTouches[i].identifier });
      }
    } else {
      // Mouse event
      var t = { clientX: e.clientX, clientY: e.clientY, identifier: 0 };
      touches.push(t);
      changedTouches.push(t);
    }
    return { touches: touches, changedTouches: changedTouches, timeStamp: e.timeStamp };
  }

  var _mouseDown = false;

  // Touch events
  document.addEventListener('touchstart', function(e) {
    e.preventDefault();
    var we = wrapTouchEvent(e);
    for (var i = 0; i < _touchStartCbs.length; i++) _touchStartCbs[i](we);
  }, { passive: false });

  document.addEventListener('touchmove', function(e) {
    e.preventDefault();
    var we = wrapTouchEvent(e);
    for (var i = 0; i < _touchMoveCbs.length; i++) _touchMoveCbs[i](we);
  }, { passive: false });

  document.addEventListener('touchend', function(e) {
    e.preventDefault();
    var we = wrapTouchEvent(e);
    for (var i = 0; i < _touchEndCbs.length; i++) _touchEndCbs[i](we);
  }, { passive: false });

  // Mouse events (desktop)
  document.addEventListener('mousedown', function(e) {
    _mouseDown = true;
    var we = wrapTouchEvent(e);
    for (var i = 0; i < _touchStartCbs.length; i++) _touchStartCbs[i](we);
  });

  document.addEventListener('mousemove', function(e) {
    if (!_mouseDown) return;
    var we = wrapTouchEvent(e);
    for (var i = 0; i < _touchMoveCbs.length; i++) _touchMoveCbs[i](we);
  });

  document.addEventListener('mouseup', function(e) {
    _mouseDown = false;
    var we = wrapTouchEvent(e);
    for (var i = 0; i < _touchEndCbs.length; i++) _touchEndCbs[i](we);
  });

  // 窗口resize
  window.addEventListener('resize', function() {
    _canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
    _canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
  });
})();
