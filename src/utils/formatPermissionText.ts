// format text: Can view | Can edit | PENDING
export const formatPermissionText = (text: string) =>
  text === 'PENDING'
    ? text
    : `Can ${text[0].toUpperCase()}${text.substring(1).toLowerCase()}`;

// convert date to string: yyyy-mm-dd
export const formatDate = (date: Date) => date.toISOString().split('T')[0];
