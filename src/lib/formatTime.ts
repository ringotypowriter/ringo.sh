/**
 * 将 ISO 时间字符串转换为用户本地时间，格式：YYYY-MM-DD HH:mm
 */
export function formatLocalTime(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 初始化页面上所有带 data-time 属性的 time 元素，转换为本地时间
 */
export function initTimeElements(): void {
  document.querySelectorAll('time[data-time]').forEach((timeEl) => {
    const isoString = timeEl.getAttribute('data-time');
    if (isoString) {
      timeEl.textContent = formatLocalTime(isoString);
    }
  });
}
