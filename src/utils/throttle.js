/**
 * Throttle function - ensures function is called at most once per time period
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 */
export function throttle(fn, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Debounce function - delays function execution until after wait period of inactivity
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 */
export function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}
