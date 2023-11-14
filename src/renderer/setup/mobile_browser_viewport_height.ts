// 解决移动端浏览器地址栏占用问题
// https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
function setViewportHeight() {
    let vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
}
setViewportHeight()

window.addEventListener('resize', setViewportHeight)
window.addEventListener('orientationchange', setViewportHeight)
screen.orientation.addEventListener('change', setViewportHeight)
