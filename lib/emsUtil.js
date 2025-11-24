export function getPagination(currentPage, totalPages) {
  const delta = 2; // How many pages before/after current
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      range.push(i);
    }
  }

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}

export function sleep(ms) {
  new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extracts error message from an error object
 * @param {Error|Object} error - The error object from API calls
 * @param {string} defaultMessage - Default message if error message cannot be extracted
 * @returns {string} - The extracted error message or default message
 */
export function getErrorMessage(error, defaultMessage = "An error occurred") {
  if (!error) return defaultMessage;
  
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    defaultMessage
  );
}
