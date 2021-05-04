/* eslint-disable */
/**
  Based on https://github.com/ka-weihe/fastest-levenshtein
 
  MIT License
  Copyright (c) 2020 Kasper Unn Weihe
  Permission is hereby granted, free of charge, to any person obtaining a copy of this software
  and associated documentation files (the "Software"), to deal in the Software without restriction,
  including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
  and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
  ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
  IN THE SOFTWARE.
*/

var peq = new Uint32Array(0x10000)

function myers_32(a, b) {
  var n = a.length
  var m = b.length
  var lst = 1 << (n - 1)
  var pv = -1
  var mv = 0
  var sc = n
  var i = n
  while (i--) {
    peq[a.charCodeAt(i)] |= 1 << i
  }
  for (i = 0; i < m; i++) {
    var eq = peq[b.charCodeAt(i)]
    var xv = eq | mv
    eq |= ((eq & pv) + pv) ^ pv
    mv |= ~(eq | pv)
    pv &= eq
    if (mv & lst) {
      sc++
    }
    if (pv & lst) {
      sc--
    }
    mv = (mv << 1) | 1
    pv = (pv << 1) | ~(xv | mv)
    mv &= xv
  }
  i = n
  while (i--) {
    peq[a.charCodeAt(i)] = 0
  }
  return sc
}

function myers_x(a, b) {
  var n = a.length
  var m = b.length
  var mhc = []
  var phc = []
  var hsize = Math.ceil(n / 32)
  var vsize = Math.ceil(m / 32)
  var score = m
  for (var i = 0; i < hsize; i++) {
    phc[i] = -1
    mhc[i] = 0
  }
  var j = 0
  for (; j < vsize - 1; j++) {
    var mv = 0
    var pv = -1
    var start = j * 32
    var end = Math.min(32, m) + start
    for (var k = start; k < end; k++) {
      peq[b.charCodeAt(k)] |= 1 << k
    }
    score = m
    for (var i = 0; i < n; i++) {
      var eq = peq[a.charCodeAt(i)]
      var pb = (phc[(i / 32) | 0] >>> i) & 1
      var mb = (mhc[(i / 32) | 0] >>> i) & 1
      var xv = eq | mv
      var xh = ((((eq | mb) & pv) + pv) ^ pv) | eq | mb
      var ph = mv | ~(xh | pv)
      var mh = pv & xh
      if ((ph >>> 31) ^ pb) {
        phc[(i / 32) | 0] ^= 1 << i
      }
      if ((mh >>> 31) ^ mb) {
        mhc[(i / 32) | 0] ^= 1 << i
      }
      ph = (ph << 1) | pb
      mh = (mh << 1) | mb
      pv = mh | ~(xv | ph)
      mv = ph & xv
    }
    for (var k = start; k < end; k++) {
      peq[b.charCodeAt(k)] = 0
    }
  }
  var mv = 0
  var pv = -1
  var start = j * 32
  var end = Math.min(32, m - start) + start
  for (var k = start; k < end; k++) {
    peq[b.charCodeAt(k)] |= 1 << k
  }
  score = m
  for (var i = 0; i < n; i++) {
    var eq = peq[a.charCodeAt(i)]
    var pb = (phc[(i / 32) | 0] >>> i) & 1
    var mb = (mhc[(i / 32) | 0] >>> i) & 1
    var xv = eq | mv
    var xh = ((((eq | mb) & pv) + pv) ^ pv) | eq | mb
    var ph = mv | ~(xh | pv)
    var mh = pv & xh
    score += (ph >>> (m - 1)) & 1
    score -= (mh >>> (m - 1)) & 1
    if ((ph >>> 31) ^ pb) {
      phc[(i / 32) | 0] ^= 1 << i
    }
    if ((mh >>> 31) ^ mb) {
      mhc[(i / 32) | 0] ^= 1 << i
    }
    ph = (ph << 1) | pb
    mh = (mh << 1) | mb
    pv = mh | ~(xv | ph)
    mv = ph & xv
  }
  for (var k = start; k < end; k++) {
    peq[b.charCodeAt(k)] = 0
  }
  return score
}

function levenshteinSimilarity(a, b) {
  // Shortcutting identical strings
  if(a === b) return 1

  // If the code reaches here it means the strings are different. 
  // So, if at least one of them has zero length, they are completely different, therefore the result is 0
  if (a.length === 0 || b.length === 0) {
    return 0
  }

  // If a is longer than b, we switch the variables to make sure b is always the longest one
  if (a.length > b.length) {
    var tmp = b
    b = a
    a = tmp
  }


  var steps = a.length <= 32 ? myers_32(a, b) : myers_x(a, b)
  // if a and b are different, b will always be the longest string
  var relative = steps / b.length
  return 1 - relative
}

onmessage = function(event) {
  var chunk = event.data.chunk
  var destination = event.data.destination
  var mappings = []

  for (var chunkIndex in chunk) {
    var source = chunk[chunkIndex]
    
    var found = destination.filter(function(destination) {
      return destination === source
    })[0] || undefined

    if (found) {
      mappings.push({ destination: found, source, similarity: 1 })
    } else {
      for (var destinationIndex in destination) {
        var found = destination[destinationIndex]

        var similarity = levenshteinSimilarity(source, found)

        if (similarity >= 0.5) {
          mappings.push({ destination: found, source, similarity })
          break
        }
      }
    }
  }
  postMessage(mappings)
}