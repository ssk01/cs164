'use strict';

$(document).ready(function() {
  $('body').prepend('<div id="svgdiv"><svg id="canvas" width="800" height="600"></svg></div>');
});

var runtime = {
  drawBox: function _drawBox(x, y, width, height, fill, opacity, maxOpacity, text) {
    console.log('draw box', x, y, width, height, fill, opacity, maxOpacity);
    var box = $(document.createElementNS('http://www.w3.org/2000/svg', 'rect'))
        .attr({
          x: x,
          y: y,
          width: width,
          height: height,
          fill: fill,
          opacity: opacity/maxOpacity
        });
        var title = document.createElementNS("http://www.w3.org/2000/svg","title");
        title.textContent = text;
        box.append($(title));
    $('#canvas').append(box);
    return 0;
  },
  drawText: function _drawText(x, y, text, font_size) {
    console.log('draw text', x, y, font_size, text);
    var textBox = $(document.createElementNS('http://www.w3.org/2000/svg', 'text'))
        .attr({
          x: x,
          y: y,
          "font-size": font_size
        });
    var data = document.createTextNode(text);
    textBox.append($(data));
    $('#canvas').append(textBox);
    return 0;
  },
  getCanvasWidth: function _getCanvasWidth() {
    console.log('get canvas width');
    return parseInt($('#canvas').attr('width'));
  },
  getCanvasHeight: function _getCanvasHeight() {
    console.log('get canvas height');
    return parseInt($('#canvas').attr('height'));
  },
  reset: function _reset() {
    $('#canvas').children().remove();
  }
};
