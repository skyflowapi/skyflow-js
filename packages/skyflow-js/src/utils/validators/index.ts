/* eslint-disable max-len */
/*
Copyright (c) 2022 Skyflow, Inc.
*/
import * as coreValidators from '@core/validators';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import logs from '@core/utils/logs';
import SkyflowError from '@core/errors';
import { IRevealElementInput } from '../../external/reveal/reveal-container';
import {
  RedactionType,
  MessageType,
  CollectElementInput,
  LogLevel,
  IRenderOptions,
  ZipLabelMode,
  ZipRenderLayout,
} from '../common';
import { printLog } from '../logs-helper';

// Re-export the variant-neutral validators now living in @core so the existing
// `../utils/validators` importers keep resolving the full set. Bound as local
// consts (not `export *`) so jest.spyOn(validators, ...) hooks still work —
// star/named re-exports compile to non-configurable getters that can't be spied.
export const validateCreditCardNumber = coreValidators.validateCreditCardNumber;
export const detectCardType = coreValidators.detectCardType;
export const validateExpiryYear = coreValidators.validateExpiryYear;
export const validateExpiryMonth = coreValidators.validateExpiryMonth;
export const isValidExpiryDateFormat = coreValidators.isValidExpiryDateFormat;
export const isValidExpiryYearFormat = coreValidators.isValidExpiryYearFormat;
export const isValidURL = coreValidators.isValidURL;
export const isValidRegExp = coreValidators.isValidRegExp;
export const validateCardNumberLengthCheck = coreValidators.validateCardNumberLengthCheck;
export const validateBooleanOptions = coreValidators.validateBooleanOptions;
export const validateExpiryDate = coreValidators.validateExpiryDate;
export const validateInsertRecords = coreValidators.validateInsertRecords;
export const validateUpdateRecord = coreValidators.validateUpdateRecord;
export const validateAdditionalFieldsInCollect = coreValidators.validateAdditionalFieldsInCollect;
export const validateDetokenizeInput = coreValidators.validateDetokenizeInput;
export const validateGetInput = coreValidators.validateGetInput;
export const validateGetByIdInput = coreValidators.validateGetByIdInput;
export const validateDeleteRecords = coreValidators.validateDeleteRecords;
export const validateInitConfig = coreValidators.validateInitConfig;
export const validateUpsertOptions = coreValidators.validateUpsertOptions;
export const validateComposableContainerOptions = coreValidators.validateComposableContainerOptions;
export const validateInputFormatOptions = coreValidators.validateInputFormatOptions;

// Variant-specific rules kept local:
//  - reveal-input validators: the privacyDB reveal input carries skyflowID /
//    column / table / redaction-per-record / file-render keys (flowDB's is
//    token-only), so these diverge from the flowvault package.
//  - collect-input validator: emits a package-specific deprecation warning via
//    the Tier-1 per-package logs-helper (printLog), so it stays here.
export const validateRevealElementRecords = (records: IRevealElementInput[]) => {
  if (records.length === 0) throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_RECORDS_REVEAL, []);
  records.forEach((record: any) => {
    if (!(record && Object.prototype.hasOwnProperty.call(record, 'skyflowID'))) {
      if (!(record && Object.prototype.hasOwnProperty.call(record, 'token'))) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TOKEN_KEY_REVEAL, []);
      }
      if (!record.token) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TOKEN_ID_REVEAL, []);
      }
      if (!(typeof record.token === 'string' || record.token instanceof String)) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TOKEN_ID_REVEAL, []);
      }
    }

    const recordRedaction = record.redaction;
    if (recordRedaction) {
      if (!Object.values(RedactionType).includes(recordRedaction)) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_REDACTION_TYPE_REVEAL, []);
      }
    }

    if (Object.prototype.hasOwnProperty.call(record, 'label') && typeof record.label !== 'string') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_LABEL_REVEAL, []);
    }

    if (Object.prototype.hasOwnProperty.call(record, 'altText') && typeof record.altText !== 'string') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ALT_TEXT_REVEAL, []);
    }

    if (Object.prototype.hasOwnProperty.call(record, 'format') && typeof record.format !== 'string') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FORMAT_REVEAL, []);
    }
    if (Object.prototype.hasOwnProperty.call(record, 'format') && record.format === '') {
      throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_FORMAT_REVEAL, []);
    }
  });
};

export const validateRenderElementRecord = (record: IRevealElementInput) => {
  if (!(record && Object.prototype.hasOwnProperty.call(record, 'skyflowID'))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_SKYFLOWID_KEY_REVEAL, []);
  }
  if (!record.skyflowID) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_SKYFLOW_ID_REVEAL, []);
  }
  if (Object.prototype.hasOwnProperty.call(record, 'skyflowID') && typeof record.skyflowID !== 'string') {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SKYFLOW_ID_REVEAL, []);
  }
  if (Object.prototype.hasOwnProperty.call(record, 'skyflowID') && (Object.prototype.hasOwnProperty.call(record, 'token'))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.SKYFLOW_IDS_AND_TOKEN_BOTH_SPECIFIED, []);
  }
  if (!(record && Object.prototype.hasOwnProperty.call(record, 'column'))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_COLUMN_KEY_REVEAL, []);
  }
  if (!record.column) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_COLUMN_NAME_REVEAL, []);
  }
  if (Object.prototype.hasOwnProperty.call(record, 'column') && typeof record.column !== 'string') {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_COLUMN_NAME_REVEAL, []);
  }
  if (!(record && Object.prototype.hasOwnProperty.call(record, 'table'))) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_TABLE_KEY_REVEAL, []);
  }
  if (!record.table) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_TABLE_REVEAL, []);
  }
  if (Object.prototype.hasOwnProperty.call(record, 'table') && typeof record.table !== 'string') {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_TABLE_REVEAL, []);
  }
  if (Object.prototype.hasOwnProperty.call(record, 'altText') && typeof record.altText !== 'string') {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ALT_TEXT_RENDER, []);
  }
};

// `renderFile(options)` options. `undefined` is allowed (all defaults); anything
// else must be a plain object whose known keys have the right type/value.
export const validateRenderOptions = (options?: IRenderOptions) => {
  if (options === undefined) return;
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_RENDER_OPTIONS, []);
  }
  const has = (key: string) => Object.prototype.hasOwnProperty.call(options, key);
  if (has('zipRender') && typeof options.zipRender !== 'boolean') {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ZIP_RENDER_OPTION, []);
  }
  if (has('layout') && !Object.values(ZipRenderLayout).includes(options.layout as ZipRenderLayout)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_LAYOUT_OPTION, []);
  }
  if (has('allowDownload') && typeof options.allowDownload !== 'boolean') {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_ALLOW_DOWNLOAD_OPTION, []);
  }
  if (has('autoSelectFirst') && typeof options.autoSelectFirst !== 'boolean') {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_AUTO_SELECT_FIRST_OPTION, []);
  }
  if (has('labelMode') && !Object.values(ZipLabelMode).includes(options.labelMode as ZipLabelMode)) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_LABEL_MODE_OPTION, []);
  }
};

export const validateCollectElementInput = (input: CollectElementInput, logLevel: LogLevel) => {
  if (!Object.prototype.hasOwnProperty.call(input, 'type')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.MISSING_ELEMENT_TYPE, [], true);
  }
  if (!input.type) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.EMPTY_ELEMENT_TYPE, [], true);
  }
  if (Object.prototype.hasOwnProperty.call(input, 'altText')) {
    printLog(logs.warnLogs.COLLECT_ALT_TEXT_DEPERECATED, MessageType.WARN, logLevel);
  }
  if (Object.prototype.hasOwnProperty.call(input, 'skyflowID') && !(typeof input.skyflowID === 'string')) {
    throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_SKYFLOWID_IN_COLLECT, [], true);
  }
};

// Zip render: file types that must never be previewed inside the reveal iframe.
const DANGEROUS_FILE_TYPES = [
  // Executables / binaries
  'application/x-msdownload', 'application/x-msdos-program', 'application/x-msinstaller',
  'application/x-exe', 'application/x-dosexec', 'application/x-elf', 'application/x-msi',
  'application/x-ms-shortcut', 'application/x-mach-binary', 'application/x-java-applet',
  'application/vnd.microsoft.portable-executable', 'application/vnd.debian.binary-package',
  // Scripts
  'application/x-sh', 'application/x-bash', 'application/x-csh', 'application/x-shellscript',
  'application/x-php', 'application/x-python', 'application/x-perl', 'application/x-ruby',
  'application/x-sql', 'application/x-powershell',
  'application/javascript', 'application/ecmascript', 'application/x-javascript',
  'text/javascript', 'text/ecmascript', 'text/x-python', 'text/x-shellscript', 'text/x-perl',
  'text/x-php', 'text/x-ruby', 'text/x-java-source', 'text/x-c', 'text/x-c++',
  // Markup that could execute in the preview
  'text/html',
  // Nested archives
  'application/x-7z-compressed', 'application/x-rar-compressed', 'application/vnd.rar',
  'application/zip', 'application/x-tar', 'application/gzip', 'application/x-bzip2',
  // Others
  'application/x-mscardfile', 'application/x-msmetafile', 'application/x-mswrite',
  'application/x-msaccess', 'application/x-msclip',
];

const DANGEROUS_FILE_EXTENSIONS = [
  // Executables / installers / system
  '.exe', '.msi', '.msp', '.mst', '.com', '.scr', '.pif', '.cpl', '.msc', '.gadget', '.app',
  '.bin', '.dll', '.drv', '.sys', '.elf', '.mach-o', '.dmg', '.apk', '.jar', '.class', '.lnk',
  '.inf', '.reg', '.scf', '.job', '.sct', '.shb', '.shs', '.url', '.xnk',
  // Scripts
  '.bat', '.cmd', '.sh', '.csh', '.bash', '.command', '.scpt', '.php', '.py', '.pl', '.rb',
  '.sql', '.js', '.jse', '.vb', '.vbe', '.vbs', '.vbscript', '.ws', '.wsc', '.wsf', '.wsh',
  '.hta', '.ps1', '.psm1', '.psd1', '.ps1xml', '.psc1', '.psc2', '.msh', '.msh1', '.msh2',
  '.mshxml', '.msh1xml', '.msh2xml',
  // Markup
  '.html', '.htm',
  // Nested archives / disk images
  '.7z', '.rar', '.tar', '.gz', '.bz2', '.xz', '.z', '.ace', '.cab', '.arj', '.uue', '.bz',
  '.tbz2', '.tgz', '.zoo', '.lzh', '.lha', '.iso', '.img', '.toast', '.vmdk', '.vhd', '.vhdx',
  '.ova', '.ovf', '.vdi', '.vbox',
];

export const isDangerousFileType = (
  file?: { name?: string; type?: string } | null,
): boolean => {
  const lowerName = (file?.name || '').toLowerCase();
  const lowerType = (file?.type || '').toLowerCase();
  if (DANGEROUS_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
    return true;
  }
  return DANGEROUS_FILE_TYPES.includes(lowerType);
};
