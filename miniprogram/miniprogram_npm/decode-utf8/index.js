module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1587014841285, function(require, module, exports) {


function toUint8Array (input) {
  if (input instanceof Uint8Array) return input
  if (input instanceof ArrayBuffer) return new Uint8Array(input)

  throw new TypeError('Expected "input" to be an ArrayBuffer or Uint8Array')
}

module.exports = function decodeUtf8 (input) {
  const data = toUint8Array(input)
  const size = data.length

  let result = ''

  for (let index = 0; index < size; index++) {
    let byte1 = data[index]

    // US-ASCII
    if (byte1 < 0x80) {
      result += String.fromCodePoint(byte1)
      continue
    }

    // 2-byte UTF-8
    if ((byte1 & 0xE0) === 0xC0) {
      let byte2 = (data[++index] & 0x3F)
      result += String.fromCodePoint(((byte1 & 0x1F) << 6) | byte2)
      continue
    }

    if ((byte1 & 0xF0) === 0xE0) {
      let byte2 = (data[++index] & 0x3F)
      let byte3 = (data[++index] & 0x3F)
      result += String.fromCodePoint(((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3)
      continue
    }

    if ((byte1 & 0xF8) === 0xF0) {
      let byte2 = (data[++index] & 0x3F)
      let byte3 = (data[++index] & 0x3F)
      let byte4 = (data[++index] & 0x3F)
      result += String.fromCodePoint(((byte1 & 0x07) << 0x12) | (byte2 << 0x0C) | (byte3 << 0x06) | byte4)
      continue
    }
  }

  return result
}

}, function(modId) {var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1587014841285);
})()
//# sourceMappingURL=index.js.map