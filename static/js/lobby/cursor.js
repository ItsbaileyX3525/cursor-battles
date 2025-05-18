// Cursor color customization
const insideRedSlider = document.querySelector('.inside-red');
const insideGreenSlider = document.querySelector('.inside-green');
const insideBlueSlider = document.querySelector('.inside-blue');
const outlineRedSlider = document.querySelector('.outline-red');
const outlineGreenSlider = document.querySelector('.outline-green');
const outlineBlueSlider = document.querySelector('.outline-blue');
const cursorPreview = document.getElementById('cursorPreview');
const cursorIcon = document.querySelector('.cursor-icon img');

let isFirstLoad = true

function updateCursorColors() {
  if(isFirstLoad){
    const color_inside = localStorage.getItem('cursorInsideColor') || 'rgb(64, 160, 255)';
    const matches_inside = color_inside.match(/\d+/g);

    const [r1, g1, b1] = matches_inside.map(Number);
  
    const color_outline = localStorage.getItem('cursorOutlineColor') || 'rgb(0, 0, 0)';
    const matches_outline = color_outline.match(/\d+/g);

    const [r2, g2, b2] = matches_outline.map(Number);

    insideRedSlider.value = r1
    insideGreenSlider.value = g1
    insideBlueSlider.value = b1
    outlineRedSlider.value = r2
    outlineGreenSlider.value = g2
    outlineBlueSlider.value = b2
    isFirstLoad = false
  }

  const insideColor = `rgb(${insideRedSlider.value}, ${insideGreenSlider.value}, ${insideBlueSlider.value})`;
  const outlineColor = `rgb(${outlineRedSlider.value}, ${outlineGreenSlider.value}, ${outlineBlueSlider.value})`;
  
  localStorage.setItem('cursorInsideColor', insideColor);
  localStorage.setItem('cursorOutlineColor', outlineColor);

  // Cache the original SVG in base64 in localStorage after first fetch
  function getCachedSvg() {
    return localStorage.getItem('cursorSvgBase64');
  }

  function setCachedSvg(base64) {
    localStorage.setItem('cursorSvgBase64', base64);
  }

  function svgTextFromBase64(base64) {
    return atob(base64);
  }

  function svgToBase64(svgText) {
    return btoa(unescape(encodeURIComponent(svgText)));
  }

  function updateCursorFromSvg(svgText) {
    const updatedSvg = svgText
      .replace(/fill="[^"]*"/, `fill="${insideColor}"`)
      .replace(/stroke="[^"]*"/, `stroke="${outlineColor}"`);
    const blob = new Blob([updatedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    cursorPreview.src = url;
    cursorIcon.src = url;
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  const cachedBase64 = getCachedSvg();
  if (cachedBase64) {
    const svgText = svgTextFromBase64(cachedBase64);
    updateCursorFromSvg(svgText);
  } else {
    fetch('static/cursors/cursor.svg')
      .then(response => response.text())
      .then(svgContent => {
        setCachedSvg(svgToBase64(svgContent));
        updateCursorFromSvg(svgContent);
      });
  }
}

// Add event listeners to all sliders
[insideRedSlider, insideGreenSlider, insideBlueSlider,
 outlineRedSlider, outlineGreenSlider, outlineBlueSlider].forEach(slider => {
  slider.addEventListener('input', updateCursorColors);
});

// Initialize cursor colors
updateCursorColors();