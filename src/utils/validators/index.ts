export const validateCreditCardNumber = (cardNumber: string) => {
  let value = cardNumber.replace(/\D/g, "");
  let sum = 0;
  let shouldDouble = false;

  for (let i = value.length - 1; i >= 0; i--) {
    let digit = parseInt(value.charAt(i));

    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 == 0;
};

export const validateExpiryDate = (date: string) => {
  const [month, year] = date.includes('/') ? date.split("/") : date.split("-");
  const expiryDate = new Date(year + "-" + month + "-01");
  const today = new Date();

  return expiryDate > today;
};
