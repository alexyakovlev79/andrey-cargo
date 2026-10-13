'use strict';

document.getElementById('year').textContent = new Date().getFullYear();

const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
function setMenu(open) {
  mobileMenu.classList.toggle('open', open);
  mobileMenu.inert = !open;
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
}
burger.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobileMenu.classList.contains('open')) {
    setMenu(false);
    burger.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('header')) setMenu(false);
});
window.matchMedia('(min-width:1161px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});

const dialog = document.getElementById('request-dialog');
const requestText = document.getElementById('request-text');
const copyStatus = document.getElementById('copy-status');
function updateRequestLinks() {
  const text = encodeURIComponent(requestText.value);
  document.getElementById('telegram-request').href = 'https://t.me/CargoChina765?text=' + text;
  document.getElementById('email-request').href = 'mailto:logistic-company.pro@yandex.ru?subject=' + encodeURIComponent('Заявка на доставку из Китая') + '&body=' + text;
}
requestText.addEventListener('input', updateRequestLinks);
document.getElementById('leadForm').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const value = key => String(data.get(key) || '').trim();
  requestText.value = [
    'Здравствуйте! Хочу рассчитать доставку из Китая.',
    'Имя: ' + value('name'),
    'Телефон: ' + value('phone'),
    'Товар: ' + (value('product') || 'Уточню у менеджера'),
    'Ссылка: ' + (value('link') || 'Не указана'),
    'Вес: ' + (value('weight') ? value('weight') + ' кг' : 'Пока неизвестен'),
    'Объём: ' + (value('volume') ? value('volume') + ' м³' : 'Пока неизвестен'),
    'Доставка: ' + value('method'),
    'Как связаться: ' + value('contact')
  ].join('\n');
  copyStatus.textContent = '';
  updateRequestLinks();
  dialog.showModal();
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
document.getElementById('copy-request').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(requestText.value);
    copyStatus.textContent = 'Текст скопирован. Вставьте его в чат с менеджером.';
  } catch {
    requestText.focus();
    requestText.select();
    copyStatus.textContent = 'Скопируйте выделенный текст вручную и вставьте в чат с менеджером.';
  }
});
