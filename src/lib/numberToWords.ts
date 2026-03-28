/**
 * Number to Words Converter for Indian Rupees
 * Converts numeric amounts to English words (Indian format)
 * 
 * @param amount - The numeric amount to convert
 * @returns The amount in words (e.g., "One Hundred Thirty Rupees Only")
 */

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
             'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 
             'Eighteen', 'Nineteen'];

const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const scales = ['', 'Thousand', 'Lakh', 'Crore'];

function convertTwoDigits(n: number): string {
  if (n < 20) {
    return ones[n];
  }
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
}

function convertUpto99(n: number): string {
  if (n < 100) {
    return convertTwoDigits(n);
  }
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;
  let result = ones[hundred] + ' Hundred';
  if (remainder > 0) {
    result += ' ' + convertTwoDigits(remainder);
  }
  return result;
}

function convertToIndianFormat(n: number): string {
  if (n === 0) {
    return 'Zero';
  }
  
  let result = '';
  let scaleIndex = 0;
  
  // Handle crores (last 2 digits before last 2)
  const crore = Math.floor(n / 10000000);
  if (crore > 0) {
    result += convertUpto99(crore) + ' Crore ';
    n = n % 10000000;
  }
  
  // Handle lakhs (next 2 digits)
  const lakh = Math.floor(n / 100000);
  if (lakh > 0) {
    result += convertUpto99(lakh) + ' Lakh ';
    n = n % 100000;
  }
  
  // Handle thousands
  const thousand = Math.floor(n / 1000);
  if (thousand > 0) {
    result += convertUpto99(thousand) + ' Thousand ';
    n = n % 1000;
  }
  
  // Handle remaining (0-999)
  if (n > 0) {
    result += convertUpto99(n);
  }
  
  return result.trim();
}

export function numberToWords(amount: number): string {
  // Handle negative amounts
  if (amount < 0) {
    return 'Negative ' + numberToWords(Math.abs(amount));
  }
  
  // Round to 2 decimal places
  const roundedAmount = Math.round(amount * 100) / 100;
  
  // Split into rupees and paise
  const rupees = Math.floor(roundedAmount);
  const paise = Math.round((roundedAmount - rupees) * 100);
  
  let words = '';
  
  // Convert rupees
  if (rupees > 0) {
    words = convertToIndianFormat(rupees) + ' Rupee' + (rupees !== 1 ? 's' : '');
  }
  
  // Convert paise
  if (paise > 0) {
    if (rupees > 0) {
      words += ' and ';
    }
    words += convertToIndianFormat(paise) + ' Paise';
  }
  
  // If no rupees and no paise
  if (rupees === 0 && paise === 0) {
    return 'Zero Rupees';
  }
  
  return words + ' Only';
}

/**
 * Format amount for display in receipt
 * @param amount - The amount to format
 * @returns Formatted string with ₹ symbol
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}
