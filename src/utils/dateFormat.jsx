/**
 * Format date for blog display
 * @param {string | number | Date} value
 * @param {Object} options
 * @returns {string}
 */
export function formatDate(
    value,
    options = {
        withTime: false,
    }
) {
    if (!value) return '';

    let date;

    // Nếu là Date object
    if (value instanceof Date) {
        date = value;
    }
    // Nếu là timestamp
    else if (typeof value === 'number') {
        date = new Date(value);
    }
    // Nếu là string
    else if (typeof value === 'string') {
        date = new Date(value);
    }

    // Date không hợp lệ
    if (!date || isNaN(date.getTime())) {
        console.warn('[formatDate] Invalid date:', value);
        return '';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (!options.withTime) {
        return `${day}/${month}/${year}`;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}
