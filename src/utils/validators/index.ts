import {
  IInsertRecordInput,
  IRevealRecord,
  RedactionType,
} from "../../Skyflow";

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
  const [month, year] = date.includes("/") ? date.split("/") : date.split("-");
  const expiryDate = new Date(year + "-" + month + "-01");
  const today = new Date();

  return expiryDate > today;
};

export const validateInsertRecords = (recordObj: IInsertRecordInput) => {
  if (!("records" in recordObj)) {
    throw new Error("records object key value not found");
  }
  const records = recordObj.records;
  if (records.length === 0) {
    throw new Error("records object is empty");
  }
  records.forEach((record) => {
    if (!("table" in record && "fields" in record)) {
      throw new Error("table or fields parameter cannot be passed as empty");
    }
    if (record.table === "") {
      throw new Error("Table can't be passed as empty");
    }
  });
};

export const validateGetRecords = (records: IRevealRecord[]) => {
  if (records.length === 0) throw new Error("Empty Records");
  records.forEach((record) => {
    if (Object.keys(record).length === 0)
      throw new Error("Record cannot be Empty Object");

    const recordId = record.id;
    if (!recordId) throw new Error("Missing id property");
    if (recordId === "" || typeof recordId !== "string")
      throw new Error("Invalid Token Id");

    const recordRedaction = record.redaction;
    if (!recordRedaction) throw new Error("Missing Redaction property");
    if (!Object.values(RedactionType).includes(recordRedaction))
      throw new Error("Invalid Redaction Type");
  });
};
