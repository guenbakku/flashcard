function formatDatetime(dateStr: number | string | Date | undefined) {
  if (!dateStr) {
    return null;
  }

  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default formatDatetime;
