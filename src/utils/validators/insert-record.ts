import { IInsertRecordInput } from "../../Skyflow";

function validateRecordsInput(recordObj: IInsertRecordInput) {
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
}

export default validateRecordsInput;
