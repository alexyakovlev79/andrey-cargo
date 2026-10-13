const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Открыть меню'); navigation.classList.remove('open'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); navigation.classList.toggle('open', open); });
navigation.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(other => { const active = other === button; other.classList.toggle('active', active); other.setAttribute('aria-pressed', String(active)); });
  document.querySelectorAll('.tariff').forEach(card => { card.hidden = button.dataset.filter !== 'all' && button.dataset.filter !== card.dataset.kind; });
}));
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { document.querySelector('#delivery-mode').value = button.dataset.mode; document.querySelector('#quote').scrollIntoView({ behavior: 'smooth' }); }));
document.querySelectorAll('[data-service]').forEach(a => a.addEventListener('click', () => { document.querySelector('#supplier').value = a.dataset.service; }));
const dialog = document.querySelector('#request-dialog');
const requestText = document.querySelector('#request-text');
const emailLink = document.querySelector('#email-request');
function updateEmail() { emailLink.href = 'mailto:logistic-company.pro@yandex.ru?subject=' + encodeURIComponent('Расчет доставки из Китая') + '&body=' + encodeURIComponent(requestText.value); }
document.querySelector('#quote-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  requestText.value = ['Здравствуйте! Прошу рассчитать доставку из Китая.', '', 'Товар: ' + data.get('category'), 'Город доставки: ' + String(data.get('city')).trim(), 'Вес: ' + (data.get('weight') ? data.get('weight') + ' кг' : 'пока неизвестен'), 'Объем: ' + (data.get('volume') ? data.get('volume') + ' м³' : 'пока неизвестен'), 'Доставка: ' + data.get('mode'), 'Поставщик: ' + data.get('supplier'), 'Дополнительные услуги: ' + (data.getAll('extras').join(', ') || 'по согласованию'), ...(String(data.get('details')).trim() ? ['Детали: ' + String(data.get('details')).trim()] : [])].join('\n');
  updateEmail(); document.querySelector('#copy-status').textContent = ''; dialog.showModal(); document.body.classList.add('dialog-open');
});
requestText.addEventListener('input', updateEmail);
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
document.querySelector('#copy-request').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try { await navigator.clipboard.writeText(requestText.value); status.textContent = 'Запрос скопирован. Вставьте его в сообщение менеджеру.'; }
  catch { requestText.focus(); requestText.select(); status.textContent = 'Текст выделен. Скопируйте его через меню или Ctrl+C.'; }
});
