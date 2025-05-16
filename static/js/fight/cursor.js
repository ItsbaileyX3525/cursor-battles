const cursorIcon = document.getElementById('cursor1');
const cursorIcon2 = document.getElementById('cursor2');
const insideColor = localStorage.getItem('cursorInsideColor');
const outlineColor = localStorage.getItem('cursorOutlineColor');
let firstUpdate = true;

function updateCursorColors() {
  fetch('static/cursors/cursor.svg')
    .then(response => response.text())
    .then(svgContent => {
      const updatedSvg = svgContent
        .replace(/fill="[^"]*"/, `fill="${insideColor}"`)
        .replace(/stroke="[^"]*"/, `stroke="${outlineColor}"`);
      
      const blob = new Blob([updatedSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      cursorIcon.src = url;
      
      // Clean up the old URL to prevent memory leaks
      setTimeout(() => URL.revokeObjectURL(url), 100);
    });
}

function updatePlayer2CursorColors(data){
  if (firstUpdate){
    firstUpdate = false
  }else{
      return
  }
  const insideColor2 = data[0]
  const outlineColor2 = data[1]
  fetch('static/cursors/cursor.svg')
    .then(response => response.text())
    .then(svgContent => {
      const updatedSvg = svgContent
        .replace(/fill="[^"]*"/, `fill="${insideColor2}"`)
        .replace(/stroke="[^"]*"/, `stroke="${outlineColor2}"`);
      
      const blob = new Blob([updatedSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      // Update both cursor preview and icon
      cursorIcon2.src = url;
      
      // Clean up the old URL to prevent memory leaks
      setTimeout(() => URL.revokeObjectURL(url), 100);
    });
}

updateCursorColors()