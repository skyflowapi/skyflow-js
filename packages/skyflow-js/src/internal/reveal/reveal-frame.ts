/*
Copyright (c) 2022 Skyflow, Inc.
*/
// privacyDB reveal-frame: the shared @core reveal-frame base plus the file-render
// feature. The base's two protected hooks (registerRenderFileResponseListener /
// handleRevealCallRequest) are overridden here to wire the RENDER_FILE bus +
// message paths, so this DOM/file-upload-adjacent surface stays out of flowDB's
// token-only bundle.
import bus from 'framebus';
import JSZip from 'jszip';
import getCssClassesFromJss from '@core/libs/jss-styles';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  STYLE_TYPE,
  RENDER_ELEMENT_IMAGE_STYLES,
  DEFAULT_FILE_RENDER_ERROR,
  ELEMENT_EVENTS_TO_CLIENT,
  REVEAL_TYPES,
  ZIP_CONTAINER_STYLES,
  ZIP_NAV_STYLES,
  ZIP_NAV_LIST_ITEM_STYLES,
  ZIP_PANEL_STYLES,
  ZIP_PREVIEW_MESSAGE_STYLES,
  ZIP_PREVIEW_ERROR_STYLES,
  DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE,
  ZIP_EMPTY_ARCHIVE_MESSAGE,
  ZIP_PREVIEW_LOADING_MESSAGE,
  ZIP_ARCHIVE_MIME_TYPES,
} from '@core/constants';
import properties from '@core/properties';
import Client from '@core/client';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import logs from '@core/utils/logs';
import CoreRevealFrame from '@core/internal/reveal/reveal-frame';
import {
  IRenderResponseType, IRevealRecord, IUnzippedFileMetadata, MessageType, IRenderOptions,
  ZipLabelMode, ZipRenderLayout,
} from '../../utils/common';
import { formatForRenderClient, getFileURLFromVaultBySkyflowIDComposable } from '../../api-utils/reveal';
import { parameterizedString, printLog } from '../../utils/logs-helper';
import { isDangerousFileType } from '../../utils/validators';

const { getType } = require('mime');

const CLASS_NAME = 'RevealFrame';

// Defaults for `renderFile(options)`; zip rendering and download are opt-in.
const DEFAULT_RENDER_OPTIONS: Required<IRenderOptions> = {
  zipRender: false,
  layout: ZipRenderLayout.LIST_DETAIL,
  allowDownload: false,
  autoSelectFirst: true,
  labelMode: ZipLabelMode.BASENAME,
};

// One entry inside a rendered zip. `entry` is the JSZip handle; bytes are only
// pulled out (and a blob URL created) the first time the file is previewed or
// downloaded, so large archives don't get fully inflated into memory up front.
interface IUnzippedFile {
  name: string;
  type: string;
  size: number;
  entry: JSZip.JSZipObject;
  url?: string;
}

class RevealFrame extends CoreRevealFrame {
  #client!: Client;

  // Zip render (list-detail layout) state.
  #zipNav?: HTMLDivElement;

  #zipPanel?: HTMLDivElement;

  #filesList: IUnzippedFileMetadata[] = [];

  #unzippedFiles: IUnzippedFile[] = [];

  #currentFile?: IUnzippedFile;

  #downloadListenerRegistered = false;

  // Children of the element container before the zip layout replaced them, so a
  // later re-render / failure can put the content + error spans back in the DOM.
  #originalChildren?: Node[];

  // Monotonic id per renderFile call. A render that finishes after a newer one
  // started must not touch the DOM (stale response / overlapping calls).
  #renderSeq = 0;

  // Effective `renderFile(options)` for the current render (defaults merged with
  // what the client passed). Kept on the instance because `downloadCurrentFile`
  // arrives as a separate message after the render completes.
  #renderOptions: Required<IRenderOptions> = { ...DEFAULT_RENDER_OPTIONS };

  protected registerRenderFileResponseListener(): void {
    // Deferred wrapper (not `this.sub2` directly): the @core base constructor
    // calls this during super(), before this subclass's `sub2` arrow-field is
    // initialized — so the lookup must happen at fire-time, not registration.
    bus
      .target(window.location.origin)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY + this.name,
        (responseUrl) => this.sub2(responseUrl),
      );
  }

  protected handleRevealCallRequest(event: MessageEvent): void {
    if (event?.origin === this.clientDomain) {
      if (event?.data?.name === ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + this.name) {
        if (event?.data?.data?.iframeName === this.name
        && event?.data?.data?.type === REVEAL_TYPES.RENDER_FILE) {
          this.#renderOptions = this.sanitizeRenderOptions(event?.data?.data?.renderOptions);
          this.renderFile(this.record, event?.data?.clientConfig,
            event?.data?.errorMessages)?.then((resolvedResult) => {
            const result = formatForRenderClient(
              resolvedResult as IRenderResponseType,
              this.record?.column,
            );
            window?.parent?.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + this.name,
              data: {
                type: REVEAL_TYPES.RENDER_FILE,
                result,
              },
            }, this.clientDomain);

            window?.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + window?.name,
            }, properties?.IFRAME_SECURE_ORIGIN);
          })?.catch((error) => {
            window?.parent?.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + this.name,
              data: {
                type: REVEAL_TYPES.RENDER_FILE,
                result: {
                  errors: error,
                },
              },
            }, this.clientDomain);

            window?.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + window?.name,
            }, properties?.IFRAME_SECURE_ORIGIN);
          });
        }
      }
    }
  }

  // The client-side element already validates renderFile options, but the iframe
  // only sees a postMessage payload, so it re-checks every key and falls back to
  // the default for anything unexpected rather than trusting the message.
  private sanitizeRenderOptions(raw: unknown): Required<IRenderOptions> {
    const out: Required<IRenderOptions> = { ...DEFAULT_RENDER_OPTIONS };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    const r = raw as Record<string, unknown>;
    const ignore = (key: string) => printLog(
      parameterizedString(logs.warnLogs.INVALID_RENDER_OPTION_IGNORED, key),
      MessageType.WARN,
      this.context?.logLevel,
    );
    const bool = (key: 'zipRender' | 'allowDownload' | 'autoSelectFirst') => {
      if (!(key in r)) return;
      if (typeof r[key] === 'boolean') out[key] = r[key] as boolean; else ignore(key);
    };
    bool('zipRender');
    bool('allowDownload');
    bool('autoSelectFirst');
    if ('layout' in r) {
      if (Object.values(ZipRenderLayout).includes(r.layout as ZipRenderLayout)) {
        out.layout = r.layout as ZipRenderLayout;
      } else ignore('layout');
    }
    if ('labelMode' in r) {
      if (Object.values(ZipLabelMode).includes(r.labelMode as ZipLabelMode)) {
        out.labelMode = r.labelMode as ZipLabelMode;
      } else ignore('labelMode');
    }
    return out;
  }

  private sub2 = (responseUrl: { iframeName?: string; error?: string; url?: string }) => {
    if (responseUrl.iframeName === this.name) {
      if (Object.prototype.hasOwnProperty.call(responseUrl, 'error') && responseUrl.error === DEFAULT_FILE_RENDER_ERROR) {
        this.setRevealError(DEFAULT_FILE_RENDER_ERROR);
        if (Object.prototype.hasOwnProperty.call(this.record, 'altText')) {
          this.dataElememt.innerText = this.record.altText;
        }
        bus
          .emit(
            ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.name,
            {
              height: this.elementContainer.scrollHeight,
            }, () => {
            },
          );
      } else {
        const ext = this.getExtension(responseUrl.url as string);
        this.addFileRender(responseUrl.url as string, ext);
      }
    }
  };

  // Styles for the in-pane message. Errors use the element's errorTextStyles.base
  // (same as every other error text on the element) on top of the SDK default.
  // The loading message only takes the default.
  private previewMessageStyles(isWarning: boolean) {
    if (!isWarning) return ZIP_PREVIEW_MESSAGE_STYLES;
    return {
      [STYLE_TYPE.BASE]: {
        ...ZIP_PREVIEW_ERROR_STYLES[STYLE_TYPE.BASE],
        ...(this.record?.errorTextStyles?.[STYLE_TYPE.BASE] || {}),
      },
    };
  }

  static isZipMimeType(type: unknown): boolean {
    return typeof type === 'string' && ZIP_ARCHIVE_MIME_TYPES.includes(type.toLowerCase());
  }

  private renderFile(data: IRevealRecord, clientConfig, customErrorMessages):
  Promise<IRenderResponseType> | undefined {
    this.#client = new Client(clientConfig, {
      uuid: '',
      clientDomain: '',
    });
    this.#client.setErrorMessages(customErrorMessages ?? {});
    this.#renderSeq += 1;
    const renderId = this.#renderSeq;
    // Any previous zip layout is torn down first so "loading" / errors land on the
    // visible content + error spans, not on nodes detached by the last render.
    this.resetZipLayout();
    return new Promise((resolve, reject) => {
      try {
        getFileURLFromVaultBySkyflowIDComposable(data, this.#client, clientConfig.authToken)
          .then((resolvedResult) => {
            let url = '';
            if (resolvedResult.fields && data.column) {
              url = resolvedResult.fields[data.column];
            }
            const fileType = this.getExtension(url);
            const isZip = RevealFrame.isZipMimeType(fileType);
            if (isZip && this.#renderOptions.zipRender) {
              this.dataElememt.innerText = '...loading';
              this.unZipFiles(url).then((files) => {
                printLog(parameterizedString(logs.infoLogs.FILES_UNZIPPED_SUCCESSFULLY,
                  CLASS_NAME, this.record?.skyflowID), MessageType.LOG, this.context?.logLevel);
                const metadata = files.map((f) => ({
                  name: f.name, fileSize: f.size, type: f.type,
                }));
                if (renderId !== this.#renderSeq) {
                  // A newer renderFile() call owns the DOM now; just answer this one.
                  resolve({ ...resolvedResult, unZippedFilesMetadata: metadata });
                  return;
                }
                this.#unzippedFiles = files;
                this.#filesList = metadata;
                if (files.length > 0) {
                  this.renderUnZipFile(files);
                } else {
                  this.dataElememt.innerText = ZIP_EMPTY_ARCHIVE_MESSAGE;
                }
                resolve({
                  ...resolvedResult,
                  unZippedFilesMetadata: this.#filesList,
                });
              }).catch((zipError) => {
                printLog(parameterizedString(logs.errorLogs.FAILED_TO_UNZIP_FILES, CLASS_NAME,
                  zipError), MessageType.ERROR, this.context?.logLevel);
                if (renderId === this.#renderSeq) {
                  this.sub2({
                    error: DEFAULT_FILE_RENDER_ERROR,
                    iframeName: this.name,
                  });
                }
                reject({
                  errors: {
                    error: { ...SKYFLOW_ERROR_CODE.FAILED_TO_UNZIP_FILES },
                  },
                });
              });
            } else {
              if (renderId !== this.#renderSeq) {
                resolve(resolvedResult);
                return;
              }
              this.sub2({
                url,
                iframeName: this.name,
              });
              resolve(resolvedResult);
            }
          },
          (rejectedResult) => {
            if (renderId === this.#renderSeq) {
              this.sub2({
                error: DEFAULT_FILE_RENDER_ERROR,
                iframeName: this.name,
              });
            }
            reject(rejectedResult);
          });
      } catch (err) {
        reject(err);
      }
    });
  }

  // Downloads the archive and returns one handle per regular file (directories
  // and OS metadata skipped). Nothing is inflated here; see getFileUrl.
  // eslint-disable-next-line class-methods-use-this
  private async unZipFiles(url: string): Promise<IUnzippedFile[]> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch ZIP file');
    const arrayBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const validFiles = Object.keys(zip.files).filter(
      (filename) => !zip.files[filename].dir && !RevealFrame.isSystemFile(filename),
    );
    return validFiles.map((filename) => {
      const entry = zip.files[filename];
      // JSZip keeps the central-directory size on the (internal) compressed data
      // object; fall back to 0 when a build doesn't expose it.
      // eslint-disable-next-line no-underscore-dangle
      const size = Number((entry as any)?._data?.uncompressedSize) || 0;
      return {
        name: filename, type: getType(filename) || '', size, entry,
      };
    });
  }

  // Inflates one entry on first use and caches its blob URL on the file handle.
  // eslint-disable-next-line class-methods-use-this
  private async getFileUrl(file: IUnzippedFile): Promise<string> {
    if (file.url) return file.url;
    const blob = await file.entry.async('blob');
    const typed = new Blob([blob], { type: file.type });
    // Another caller may have raced us; keep the first URL and drop this one.
    if (file.url) {
      return file.url;
    }
    file.url = URL.createObjectURL(typed);
    return file.url;
  }

  private revokeUnzippedFiles() {
    this.#unzippedFiles.forEach((file) => {
      if (!file.url) return;
      try {
        URL.revokeObjectURL(file.url);
      } catch {
        // ignore - already revoked or unsupported
      }
      // eslint-disable-next-line no-param-reassign
      file.url = undefined;
    });
    this.#unzippedFiles = [];
    this.#filesList = [];
    this.#currentFile = undefined;
  }

  // Removes the zip layout (if any), revokes its blob URLs and restores the
  // original content/error nodes so subsequent messages render where users look.
  private resetZipLayout() {
    this.revokeUnzippedFiles();
    if (!this.#zipNav && !this.#zipPanel) return;
    this.#zipNav = undefined;
    this.#zipPanel = undefined;
    this.elementContainer.innerHTML = '';
    (this.#originalChildren ?? [this.dataElememt]).forEach((node) => {
      this.elementContainer.appendChild(node);
    });
    this.#originalChildren = undefined;
  }

  static isSystemFile(path: string): boolean {
    return path.startsWith('__MACOSX/') || path.endsWith('.DS_Store') || path.endsWith('Thumbs.db');
  }

  static basename(path: string): string {
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1] ?? path;
  }

  // Builds the list-detail layout: file list on the left, preview on the right.
  private renderUnZipFile(files: IUnzippedFile[]) {
    this.#zipNav = document.createElement('div');
    this.#zipPanel = document.createElement('div');
    this.#zipNav.id = 'zip-nav';
    this.#zipPanel.id = 'zip-panel';
    this.#zipNav.className = `SkyflowElement-zip-nav-${STYLE_TYPE.BASE}`;
    this.#zipPanel.className = `SkyflowElement-zip-panel-${STYLE_TYPE.BASE}`;

    this.registerDownloadListener();
    this.renderFileList(files);

    const divContainer = document.createElement('div');
    divContainer.className = `SkyflowElement-zip-container-${STYLE_TYPE.BASE}`;
    const baseInputStyles = this.record?.inputStyles?.[STYLE_TYPE.BASE];
    const containerStyles = {
      [STYLE_TYPE.BASE]: {
        ...ZIP_CONTAINER_STYLES[STYLE_TYPE.BASE],
        ...(baseInputStyles || {}),
      },
    };
    divContainer.appendChild(this.#zipNav);
    divContainer.appendChild(this.#zipPanel);
    this.#originalChildren = Array.from(this.elementContainer.childNodes);
    this.elementContainer.innerHTML = '';
    this.elementContainer.appendChild(divContainer);
    getCssClassesFromJss(containerStyles, 'zip-container');

    const heightOverride = baseInputStyles?.height ? { height: baseInputStyles.height } : {};
    const zipNavStyles = {
      [STYLE_TYPE.BASE]: {
        ...ZIP_NAV_STYLES[STYLE_TYPE.BASE],
        ...heightOverride,
        ...(this.record?.zipNavStyles?.[STYLE_TYPE.BASE] || {}),
      },
    };
    getCssClassesFromJss(zipNavStyles, 'zip-nav');

    const zipPanelStyles = {
      [STYLE_TYPE.BASE]: {
        ...ZIP_PANEL_STYLES[STYLE_TYPE.BASE],
        ...heightOverride,
        ...(this.record?.zipPanelStyles?.[STYLE_TYPE.BASE] || {}),
      },
    };
    getCssClassesFromJss(zipPanelStyles, 'zip-panel');

    this.emitHeight();
  }

  private emitHeight() {
    bus.emit(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.name, {
      height: this.elementContainer.scrollHeight,
    }, () => {});
  }

  // Registers the "download current file" message listener once per frame. Only
  // messages from the client page (same origin check as render requests) count.
  private registerDownloadListener() {
    if (this.#downloadListenerRegistered) return;
    this.#downloadListenerRegistered = true;
    window.addEventListener('message', (event) => {
      if (event?.origin !== this.clientDomain) return;
      if (event?.data?.name
        !== ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_DOWNLOAD_CURRENT_FILE + this.name) {
        return;
      }
      this.downloadCurrentFile();
    });
  }

  private async downloadCurrentFile(): Promise<void> {
    if (!this.#renderOptions.allowDownload) {
      printLog(logs.errorLogs.DOWNLOAD_NOT_ALLOWED, MessageType.ERROR, this.context?.logLevel);
      return;
    }
    const currentFile = this.#currentFile;
    if (!currentFile) {
      printLog(logs.errorLogs.FAILED_DOWNLOAD_FILE, MessageType.ERROR, this.context?.logLevel);
      return;
    }
    if (isDangerousFileType(currentFile)) {
      printLog(logs.errorLogs.DOWNLOAD_BLOCKED_DANGEROUS_FILE, MessageType.ERROR,
        this.context?.logLevel);
      return;
    }
    let href: string;
    try {
      href = await this.getFileUrl(currentFile);
    } catch {
      printLog(logs.errorLogs.FAILED_DOWNLOAD_FILE, MessageType.ERROR, this.context?.logLevel);
      return;
    }
    // Selection may have moved (or the layout been torn down) while inflating.
    if (this.#currentFile !== currentFile) return;
    printLog(parameterizedString(logs.infoLogs.FILE_DOWNLOADED, CLASS_NAME, currentFile.name),
      MessageType.LOG, this.context?.logLevel);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = RevealFrame.basename(currentFile.name);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  private renderFileList(files: IUnzippedFile[]) {
    if (!this.#zipNav) return;
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.margin = '0';
    ul.style.padding = '0';
    ul.style.overflow = 'auto';
    const customItemStyles = this.record?.zipNavListItemStyles;
    const items: HTMLLIElement[] = [];

    const selectItem = (index: number) => {
      items.forEach((el, idx) => {
        el.classList.remove('active', `SkyflowElement-zip-nav-item${idx}-${STYLE_TYPE.FOCUS}`);
        el.classList.add(`SkyflowElement-zip-nav-item${idx}-${STYLE_TYPE.BASE}`);
      });
      const li = items[index];
      li.classList.add('active', `SkyflowElement-zip-nav-item${index}-${STYLE_TYPE.FOCUS}`);
      li.classList.remove(`SkyflowElement-zip-nav-item${index}-${STYLE_TYPE.BASE}`);
      const focusStyles = {
        [STYLE_TYPE.FOCUS]: {
          ...ZIP_NAV_LIST_ITEM_STYLES[STYLE_TYPE.BASE],
          ...ZIP_NAV_LIST_ITEM_STYLES[STYLE_TYPE.FOCUS],
          ...(customItemStyles?.[STYLE_TYPE.BASE] || {}),
          ...(customItemStyles?.[STYLE_TYPE.FOCUS] || {}),
        },
      };
      getCssClassesFromJss(focusStyles, `zip-nav-item${index}`);
      this.renderZipFile(files[index]);
    };

    const labels = RevealFrame.buildFileLabels(files, this.#renderOptions.labelMode);
    files.forEach((file, index) => {
      const li = document.createElement('li');
      li.className = `SkyflowElement-zip-nav-item${index}-${STYLE_TYPE.BASE}`;
      li.textContent = labels[index];
      // Full path is always available on hover.
      li.title = file.name;
      const itemStyles = {
        [STYLE_TYPE.BASE]: {
          ...ZIP_NAV_LIST_ITEM_STYLES[STYLE_TYPE.BASE],
          ...(customItemStyles?.[STYLE_TYPE.BASE] || {}),
        },
      };
      getCssClassesFromJss(itemStyles, `zip-nav-item${index}`);
      li.addEventListener('click', () => selectItem(index));
      items.push(li);
      ul.appendChild(li);
    });

    this.#zipNav.innerHTML = '';
    this.#zipNav.appendChild(ul);
    if (files.length > 0 && this.#renderOptions.autoSelectFirst) selectItem(0);
  }

  // File-list labels for `labelMode`. 'path' shows the full archive path. 'basename'
  // shows the last path segment; when two files share a basename the nearest parent
  // folder is prepended ("a/report.pdf", "b/report.pdf"), and if that still
  // collides (or there is no parent) the full path is used so labels stay unique.
  static buildFileLabels(files: { name: string }[], labelMode: ZipLabelMode): string[] {
    if (labelMode === ZipLabelMode.PATH) return files.map((f) => f.name);
    const segments = files.map((f) => f.name.split('/').filter(Boolean));
    const basenames = segments.map((parts, i) => parts[parts.length - 1] ?? files[i].name);
    const count = (list: string[]) => list.reduce<Record<string, number>>((acc, key) => {
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const baseCounts = count(basenames);
    const firstPass = segments.map((parts, i) => {
      const base = basenames[i];
      if (baseCounts[base] > 1 && parts.length > 1) return `${parts[parts.length - 2]}/${base}`;
      return base;
    });
    const passCounts = count(firstPass);
    return firstPass.map((label, i) => (passCounts[label] > 1 ? files[i].name : label));
  }

  // Previews a single extracted file in the right panel. Bytes are inflated on
  // demand; if the user switches files before that finishes, the late result is
  // dropped so the panel always matches the highlighted list item.
  private async renderZipFile(file: IUnzippedFile): Promise<void> {
    if (!this.#zipPanel) return;
    this.#currentFile = file;
    const panel = this.#zipPanel;
    panel.innerHTML = '';

    const showMessage = (text: string, isWarning: boolean) => {
      if (this.#currentFile !== file || this.#zipPanel !== panel) return;
      panel.innerHTML = '';
      const msg = document.createElement('div');
      msg.textContent = text;
      const name = isWarning ? 'zip-preview-error' : 'zip-preview-message';
      msg.className = `SkyflowElement-${name}-${STYLE_TYPE.BASE}`;
      getCssClassesFromJss(this.previewMessageStyles(isWarning), name);
      panel.appendChild(msg);
    };

    if (isDangerousFileType(file)) {
      showMessage(DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE, true);
      return;
    }
    showMessage(ZIP_PREVIEW_LOADING_MESSAGE, false);

    // Which types actually display is left to the browser: images in <img>,
    // video/audio in their tags, everything else (pdf and the rest) in <embed>.
    const type = (file.type || '').toLowerCase();
    try {
      const url = await this.getFileUrl(file);
      if (this.#currentFile !== file || this.#zipPanel !== panel) return;
      panel.innerHTML = '';
      let previewElement: HTMLElement;
      if (type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = file.name;
        img.onerror = () => showMessage(DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE, true);
        img.onload = () => this.emitHeight();
        previewElement = img;
      } else if (type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.onerror = () => showMessage(DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE, true);
        previewElement = video;
      } else if (type.startsWith('audio/')) {
        const audio = document.createElement('audio');
        audio.src = url;
        audio.controls = true;
        audio.onerror = () => showMessage(DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE, true);
        previewElement = audio;
      } else {
        // pdf and everything else the browser can embed
        const embed = document.createElement('embed');
        embed.src = url;
        embed.setAttribute('type', type);
        embed.style.width = '100%';
        embed.style.height = '100%';
        previewElement = embed;
      }
      panel.appendChild(previewElement);
    } catch (err) {
      printLog(parameterizedString(logs.errorLogs.ZIP_PREVIEW_FAILED, CLASS_NAME, file.name),
        MessageType.ERROR, this.context?.logLevel);
      showMessage(DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE, true);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private getExtension(url: string) {
    try {
      const params = new URL(url).searchParams;
      const name = params.get('response-content-disposition');
      if (name) {
        const ext = getType(name);
        return ext;
      }
      return '';
    } catch {
      return '';
    }
  }

  private addFileRender(responseUrl: string, ext: string) {
    let tag = '';
    if (typeof ext === 'string' && ext.includes('image')) {
      tag = 'img';
    } else {
      tag = 'embed';
    }
    const fileElement = document.createElement(tag);
    fileElement.addEventListener('load', () => {
      bus
        .emit(
          ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.name,
          {
            height: this.elementContainer.scrollHeight,
          }, () => {
          },
        );
    });
    fileElement.className = `SkyflowElement-${tag}-${STYLE_TYPE.BASE}`;
    if (tag === 'embed' && typeof ext === 'string') {
      fileElement.setAttribute('type', ext);
    }
    fileElement.setAttribute('src', responseUrl);
    if (Object.prototype.hasOwnProperty.call(this.record, 'inputStyles')) {
      this.inputStyles = {};
      if (tag === 'img') {
        this.inputStyles[STYLE_TYPE.BASE] = {
          ...this.record.inputStyles[STYLE_TYPE.BASE],
        };
        if (this.record?.inputStyles
          && this.record?.inputStyles[STYLE_TYPE.BASE]
           && this.record?.inputStyles[STYLE_TYPE.BASE]?.overflow && this.composableContainer) {
          this.elementContainer.className = `SkyflowElement-div-container-${STYLE_TYPE.BASE}`;
          const divStyles = {
            [STYLE_TYPE.BASE]: {
              ...this.record.inputStyles[STYLE_TYPE.BASE],
            },
          };
          this.elementContainer.style.overflow = this.record
            .inputStyles[STYLE_TYPE.BASE].overflow as string;
          this.inputStyles[STYLE_TYPE.BASE] = {
            ...this.inputStyles[STYLE_TYPE.BASE],
          };
          getCssClassesFromJss(divStyles, 'div-container');
        } else {
          this.inputStyles[STYLE_TYPE.BASE] = {
            ...RENDER_ELEMENT_IMAGE_STYLES[STYLE_TYPE.BASE],
            ...this.inputStyles[STYLE_TYPE.BASE],
          };
          getCssClassesFromJss(this.inputStyles, tag);
        }
      } else {
        this.inputStyles[STYLE_TYPE.BASE] = {
          ...RENDER_ELEMENT_IMAGE_STYLES[STYLE_TYPE.BASE],
          ...this.record.inputStyles[STYLE_TYPE.BASE],
        };
        getCssClassesFromJss(this.inputStyles, tag);
      }
    }

    if (this.elementContainer.childNodes[0] !== undefined) {
      this.elementContainer.innerHTML = '';
      this.elementContainer.appendChild(fileElement);
    } else {
      this.elementContainer.appendChild(fileElement);
    }
    if (fileElement instanceof HTMLImageElement
      && this.record?.inputStyles
      && this.record?.inputStyles[STYLE_TYPE.BASE]
      && this.record?.inputStyles[STYLE_TYPE.BASE]?.overflow && this.composableContainer) {
      fileElement.onload = () => {
        if (fileElement?.naturalWidth && fileElement?.naturalHeight) {
          fileElement.style.width = `${fileElement.naturalWidth}px`;
          fileElement.style.height = `${fileElement.naturalHeight}px`;
        }

        if (this.record?.inputStyles[STYLE_TYPE.BASE]?.width) {
          this.elementContainer.style.width = this.record.inputStyles[STYLE_TYPE.BASE].width;
        }
        if (this.record?.inputStyles[STYLE_TYPE.BASE]?.height) {
          this.elementContainer.style.height = this.record.inputStyles[STYLE_TYPE.BASE].height;
        }
        this.elementContainer.style.overflow = this.record
          .inputStyles[STYLE_TYPE.BASE].overflow as string;

        window?.postMessage({
          type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + window?.name,
        }, properties?.IFRAME_SECURE_ORIGIN);
      };
    }
  }
}

export default RevealFrame;
