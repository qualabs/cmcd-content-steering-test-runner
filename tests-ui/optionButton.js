export function setupButton(element, url) {
  element.addEventListener('click', () => {
    window.location.href += url;
  });
}
