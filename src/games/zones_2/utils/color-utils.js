export function parseColor(color) {
    return color.match(/\d+/g).map(Number);
}

export function lerpColor(color1, color2, t) {
    const r = Math.floor(color1[0] + (color2[0] - color1[0]) * t);
    const g = Math.floor(color1[1] + (color2[1] - color1[1]) * t);
    const b = Math.floor(color1[2] + (color2[2] - color1[2]) * t);
    return `rgb(${r}, ${g}, ${b})`;
}
