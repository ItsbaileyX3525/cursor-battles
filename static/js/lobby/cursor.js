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
    console.log("Outline: ", r2, g2, b2);
    console.log("Inside: ", r1, g1, b1);

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

  fetch('static/cursors/cursor.svg')
    .then(response => response.text())
    .then(svgContent => {
      const updatedSvg = svgContent
        .replace(/fill="[^"]*"/, `fill="${insideColor}"`)
        .replace(/stroke="[^"]*"/, `stroke="${outlineColor}"`);
      
      const blob = new Blob([updatedSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      // Update both cursor preview and icon
      cursorPreview.src = url;
      cursorIcon.src = url;
      
      // Clean up the old URL to prevent memory leaks
      setTimeout(() => URL.revokeObjectURL(url), 100);
    });
}

// Add event listeners to all sliders
[insideRedSlider, insideGreenSlider, insideBlueSlider,
 outlineRedSlider, outlineGreenSlider, outlineBlueSlider].forEach(slider => {
  slider.addEventListener('input', updateCursorColors);
});

// Initialize cursor colors
updateCursorColors();