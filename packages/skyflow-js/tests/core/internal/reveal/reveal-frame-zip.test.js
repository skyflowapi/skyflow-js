/*
Copyright (c) 2025 Skyflow, Inc.
*/
import bus from "framebus";
import JSZip from "jszip";
import RevealFrame from "../../../../src/internal/reveal/reveal-frame";
import {
  DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE,
  ELEMENT_EVENTS_TO_IFRAME,
  REVEAL_TYPES,
  ZIP_EMPTY_ARCHIVE_MESSAGE,
  ZIP_CONTAINER_STYLES,
  ZIP_NAV_STYLES,
  ZIP_NAV_LIST_ITEM_STYLES,
  ZIP_PANEL_STYLES,
  ZIP_PREVIEW_ERROR_STYLES,
} from "@core/constants";
import SKYFLOW_ERROR_CODE from "@core/utils/constants";
import logs from "@core/utils/logs";
import { Env, LogLevel } from "../../../../src/utils/common";
import properties from "@core/properties";

const mockGetFileURLFromVaultBySkyflowIDComposable = jest.fn();
jest.mock('../../../../src/api-utils/reveal', () => {
  const original = jest.requireActual('../../../../src/api-utils/reveal');
  return {
    ...original,
    getFileURLFromVaultBySkyflowIDComposable: (...args) => mockGetFileURLFromVaultBySkyflowIDComposable(...args),
  };
});
// Record every JSS class generation so tests can assert the styles handed to it.
const jssCalls = [];
jest.mock('@core/libs/jss-styles', () => {
  const actual = jest.requireActual('@core/libs/jss-styles');
  return {
    __esModule: true,
    default: (styles, name) => {
      jssCalls.push({ styles, name });
      return actual.default(styles, name);
    },
  };
});
properties.IFRAME_SECURE_ORIGIN = "http://localhost";

const fileUrl = (filename) => `https://fileurl?response-content-disposition=inline%3B%20filename%3D${filename}&X-Amz-Signature=abc`;
const ZIP_URL = fileUrl('archive.zip');
const clientDomain = 'http://localhost';
let testCounter = 0;
let elementNameComposable;

const setFileURLResolve = (url = ZIP_URL) => {
  mockGetFileURLFromVaultBySkyflowIDComposable.mockReset().mockImplementation(() => Promise.resolve({
    fields: { primary_card_file: url, skyflow_id: 'abc123' },
    fileMetadata: { contentType: 'application/zip' },
  }));
};

const buildZip = async (entries) => {
  const zip = new JSZip();
  Object.entries(entries).forEach(([name, content]) => {
    if (content === null) zip.folder(name);
    else zip.file(name, content);
  });
  return zip.generateAsync({ type: 'arraybuffer' });
};

const mockFetch = (arrayBuffer, ok = true) => {
  global.fetch = jest.fn(() => Promise.resolve({
    ok,
    arrayBuffer: () => Promise.resolve(arrayBuffer),
  }));
};

const defineUrl = (url) => {
  Object.defineProperty(window, "location", { value: { href: url }, writable: true });
  Object.defineProperty(window, "name", { value: elementNameComposable, writable: true });
  Object.defineProperty(window, "parent", {
    value: { postMessage: jest.fn(), addEventListener: jest.fn() },
    writable: true,
  });
};

const frameData = {
  record: {
    skyflowID: '1815-6223-1073-1425',
    table: 'pii_fields',
    column: 'primary_card_file',
    altText: 'xxxx',
    inputStyles: { base: { height: '300px' } },
    zipNavStyles: { base: { width: '25%' } },
    zipPanelStyles: { base: { width: '75%' } },
    zipNavListItemStyles: { base: { color: 'blue' }, focus: { color: 'green' } },
  },
  clientJSON: { metaData: { uuid: '1234' } },
  context: { logLevel: LogLevel.ERROR, env: Env.PROD },
};

// Zip rendering is opt-in via renderFile({ zipRender: true }); the harness turns it
// on by default so the zip tests read naturally. Pass `null` to send no options.
const dispatchRenderRequest = (renderOptions = { zipRender: true }) => {
  window.dispatchEvent(new MessageEvent('message', {
    data: {
      name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + elementNameComposable,
      data: {
        type: REVEAL_TYPES.RENDER_FILE,
        iframeName: elementNameComposable,
        ...(renderOptions !== null ? { renderOptions } : {}),
      },
      clientConfig: { vaultURL: 'http://localhost', vaultID: 'vault123', authToken: 'dummy-token' },
    },
    origin: clientDomain,
  }));
};

const dispatchDownload = (origin = clientDomain) => {
  window.dispatchEvent(new MessageEvent('message', {
    data: { name: ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_DOWNLOAD_CURRENT_FILE + elementNameComposable },
    origin,
  }));
};

// jsdom does not reflect innerText into textContent, so read it off the element directly.
const contentText = () => document.getElementsByClassName(`SkyflowElement-${elementNameComposable}-content-base`)[0]?.innerText;
const errorText = () => document.getElementsByClassName(`SkyflowElement-${elementNameComposable}-error-base`)[0]?.innerText;
const panel = () => document.querySelector('#zip-panel');
const navItems = () => document.querySelectorAll('#zip-nav li');

const waitFor = async (predicate, tries = 60) => {
  for (let i = 0; i < tries; i += 1) {
    const value = predicate();
    if (value) return value;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 5));
  }
  return predicate();
};

const waitForResponse = () => waitFor(() => window.parent.postMessage.mock.calls
  .map((c) => c[0])
  .find((m) => m?.type === (ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + elementNameComposable)));

const renderZip = async (entries, renderOptions) => {
  mockFetch(await buildZip(entries));
  RevealFrame.init();
  dispatchRenderRequest(renderOptions);
  return waitForResponse();
};

describe("Reveal Frame - zip file render", () => {
  let createObjectURL;
  let revokeObjectURL;
  let clickSpy;

  beforeAll(() => {
    createObjectURL = jest.fn((blob) => `blob:mock/${blob.size}`);
    revokeObjectURL = jest.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    if (typeof global.localStorage === 'undefined') {
      global.localStorage = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() };
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jssCalls.length = 0;
    jest.spyOn(bus, "emit").mockImplementation(() => {});
    jest.spyOn(bus, "target").mockReturnValue({ on: jest.fn(), off: jest.fn(), emit: jest.fn() });
    window.postMessage = jest.fn();
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    // Expected-failure tests log through the SDK logger; keep the output quiet.
    // Tests that assert on logs call jest.spyOn again and get these same mocks.
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    testCounter += 1;
    elementNameComposable = `reveal-composable:container${testCounter}:frame123:meta:${btoa(clientDomain)}`;
    setFileURLResolve();
    defineUrl('http://localhost/?' + btoa(JSON.stringify(frameData)));
  });

  afterEach(async () => {
    // Let any lazy preview / download still inflating settle before jsdom goes
    // away, otherwise it resumes against a torn-down environment.
    await new Promise((r) => setTimeout(r, 30));
    clickSpy.mockRestore();
    jest.restoreAllMocks();
    document.body.innerHTML = "";
  });

  // ---------------------------------------------------------------- happy path
  test("renders the list-detail layout, returns unZippedFilesMetadata and inflates lazily", async () => {
    const response = await renderZip({
      'photo.png': 'png-bytes',
      'doc.pdf': 'pdf-bytes',
      'nested/': null,
      '__MACOSX/._photo.png': 'junk',
      'nested/.DS_Store': 'junk',
      'nested/Thumbs.db': 'junk',
    });

    expect(global.fetch).toHaveBeenCalledWith(ZIP_URL);
    expect(response.data.type).toBe(REVEAL_TYPES.RENDER_FILE);
    const { success } = response.data.result;
    expect(success.skyflow_id).toBe('abc123');
    expect(success.column).toBe('primary_card_file');
    expect(success.unZippedFilesMetadata.map((f) => f.name).sort()).toEqual(['doc.pdf', 'photo.png']);
    // size comes from the archive's central directory, before any extraction
    expect(success.unZippedFilesMetadata.find((f) => f.name === 'photo.png')).toEqual({
      name: 'photo.png', type: 'image/png', fileSize: 'png-bytes'.length,
    });

    const items = navItems();
    expect(items).toHaveLength(2);
    expect(items[0].classList.contains('active')).toBe(true);
    expect(items[0].classList.contains('SkyflowElement-zip-nav-item0-focus')).toBe(true);
    expect(items[1].classList.contains('SkyflowElement-zip-nav-item1-base')).toBe(true);

    const preview = await waitFor(() => document.querySelector('#zip-panel img'));
    expect(preview.getAttribute('src')).toMatch(/^blob:mock/);
    expect(preview.getAttribute('alt')).toBe('photo.png');
    // only the selected file was inflated
    expect(createObjectURL).toHaveBeenCalledTimes(1);

    expect(document.querySelector('.SkyflowElement-zip-container-base')).toBeTruthy();
    expect(document.querySelector('.SkyflowElement-zip-nav-base')).toBeTruthy();
    expect(document.querySelector('.SkyflowElement-zip-panel-base')).toBeTruthy();
  });

  test("clicking a file switches preview + focus styles; blob URLs are created once and cached", async () => {
    await renderZip({ 'a.png': 'a', 'b.pdf': 'b' });
    await waitFor(() => document.querySelector('#zip-panel img'));
    expect(createObjectURL).toHaveBeenCalledTimes(1);

    const items = navItems();
    items[1].click();
    const embed = await waitFor(() => document.querySelector('#zip-panel embed'));
    expect(embed.getAttribute('type')).toBe('application/pdf');
    expect(items[1].classList.contains('active')).toBe(true);
    expect(items[1].classList.contains('SkyflowElement-zip-nav-item1-focus')).toBe(true);
    expect(items[0].classList.contains('active')).toBe(false);
    expect(items[0].classList.contains('SkyflowElement-zip-nav-item0-base')).toBe(true);
    expect(createObjectURL).toHaveBeenCalledTimes(2);

    // back to the first file: cached URL, no new blob
    items[0].click();
    await waitFor(() => document.querySelector('#zip-panel img'));
    expect(createObjectURL).toHaveBeenCalledTimes(2);
  });

  test("late preview result is dropped when the user has already switched files", async () => {
    const buffer = await buildZip({ 'slow.png': 'slow', 'fast.pdf': 'fast' });
    // delay inflating slow.png only
    const zip = await JSZip.loadAsync(buffer);
    const proto = Object.getPrototypeOf(zip.files['slow.png']);
    const realAsync = proto.async;
    jest.spyOn(proto, 'async').mockImplementation(function mocked(...args) {
      const result = realAsync.apply(this, args);
      if (this.name === 'slow.png') return new Promise((r) => setTimeout(() => r(result), 40));
      return result;
    });
    mockFetch(buffer);
    RevealFrame.init();
    dispatchRenderRequest();
    await waitForResponse();

    // slow.png is selected + inflating; switch to fast.pdf right away
    navItems()[1].click();
    await waitFor(() => document.querySelector('#zip-panel embed'));
    await new Promise((r) => setTimeout(r, 80));
    expect(document.querySelector('#zip-panel img')).toBeNull();
    expect(document.querySelector('#zip-panel embed')).toBeTruthy();
    expect(panel().children).toHaveLength(1);
  });

  // ---------------------------------------------------------------- previews by type
  test("video and audio preview; dangerous types show the warning and are never inflated", async () => {
    await renderZip({ 'clip.mp4': 'v', 'script.js': 'alert(1)', 'page.html': '<b/>', 'tune.mp3': 'm' });
    await waitFor(() => document.querySelector('#zip-panel video'));
    expect(document.querySelector('#zip-panel video').getAttribute('src')).toMatch(/^blob:mock/);

    const items = navItems();
    items[1].click();
    await waitFor(() => panel().textContent === DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE);
    expect(document.querySelector('#zip-panel embed')).toBeNull();

    items[2].click();
    await waitFor(() => panel().textContent === DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE);
    expect(createObjectURL).toHaveBeenCalledTimes(1);

    items[3].click();
    await waitFor(() => document.querySelector('#zip-panel audio'));
    expect(createObjectURL).toHaveBeenCalledTimes(2);
  });

  test("other types are handed to the browser: any image/* in <img>, the rest in <embed>", async () => {
    await renderZip({ 'scan.tif': 't', 'notes.txt': 'hello', 'data.xyz': 'x', 'README': 'r' });
    const img = await waitFor(() => document.querySelector('#zip-panel img'));
    expect(img.getAttribute('alt')).toBe('scan.tif');

    const items = navItems();
    items[1].click();
    let embed = await waitFor(() => document.querySelector('#zip-panel embed'));
    expect(embed.getAttribute('type')).toBe('text/plain');

    items[2].click();
    await waitFor(() => document.querySelector('#zip-panel embed')?.getAttribute('type') === 'chemical/x-xyz'
      || document.querySelector('#zip-panel embed')?.getAttribute('type') === '');
    embed = document.querySelector('#zip-panel embed');
    expect(embed.getAttribute('src')).toMatch(/^blob:mock/);

    items[3].click(); // no extension => empty type, still embedded rather than blank
    await waitFor(() => document.querySelector('#zip-panel embed')?.getAttribute('type') === '');
    expect(createObjectURL).toHaveBeenCalledTimes(4);
  });

  test("a broken image / video / audio swaps to the unsupported-preview message", async () => {
    await renderZip({ 'bad.png': 'not-really-png', 'bad.mp4': 'x', 'bad.mp3': 'y' });
    const img = await waitFor(() => document.querySelector('#zip-panel img'));
    img.onerror();
    expect(panel().textContent).toBe(DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE);

    navItems()[1].click();
    const video = await waitFor(() => document.querySelector('#zip-panel video'));
    video.onerror();
    expect(panel().textContent).toBe(DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE);

    navItems()[2].click();
    const audio = await waitFor(() => document.querySelector('#zip-panel audio'));
    audio.onerror();
    expect(panel().textContent).toBe(DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE);
  });

  test("in-pane warning is class-styled: SDK default, overridden by errorTextStyles.base", async () => {
    // 1. defaults only
    await renderZip({ 'run.exe': 'MZ' });
    await waitFor(() => panel().textContent === DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE);
    let msg = panel().firstElementChild;
    expect(msg.className).toBe('SkyflowElement-zip-preview-error-base');
    expect(msg.style.color).toBe(''); // no inline colour any more
    let call = jssCalls.filter((c) => c.name === 'zip-preview-error').pop();
    expect(call.styles.base).toEqual({ color: 'red', padding: '10px' });

    // 2. element-level errorTextStyles.base overrides the default
    document.body.innerHTML = '';
    window.parent.postMessage.mockClear();
    jssCalls.length = 0;
    defineUrl('http://localhost/?' + btoa(JSON.stringify({
      ...frameData,
      record: { ...frameData.record, errorTextStyles: { base: { color: '#b00020', fontSize: '12px' } } },
    })));
    await renderZip({ 'run.exe': 'MZ' });
    await waitFor(() => panel().textContent === DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE);
    call = jssCalls.filter((c) => c.name === 'zip-preview-error').pop();
    expect(call.styles.base).toEqual({ color: '#b00020', padding: '10px', fontSize: '12px' });

    // 3. errorTextStyles can also override the default padding; zipPanelStyles never
    //    reaches the message (it styles the panel only)
    document.body.innerHTML = '';
    window.parent.postMessage.mockClear();
    jssCalls.length = 0;
    defineUrl('http://localhost/?' + btoa(JSON.stringify({
      ...frameData,
      record: {
        ...frameData.record,
        errorTextStyles: { base: { color: '#b00020', padding: '0' } },
        zipPanelStyles: { base: { width: '75%', color: 'orange' }, error: { color: 'orange' } },
      },
    })));
    await renderZip({ 'run.exe': 'MZ' });
    await waitFor(() => panel().textContent === DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE);
    call = jssCalls.filter((c) => c.name === 'zip-preview-error').pop();
    expect(call.styles.base).toEqual({ color: '#b00020', padding: '0' });
    const panelCall = jssCalls.filter((c) => c.name === 'zip-panel').pop();
    expect(panelCall.styles.base.width).toBe('75%');
  });

  test("loading message uses the neutral message class, not the error styles", async () => {
    await renderZip({ 'a.png': 'a' });
    const loading = jssCalls.find((c) => c.name === 'zip-preview-message');
    expect(loading.styles.base).toEqual({ padding: '10px' });
    expect(jssCalls.find((c) => c.name === 'zip-preview-error')).toBeUndefined();
  });

  // ---------------------------------------------------------------- layout styles
  describe("zip layout styles", () => {
    // Render with a specific record (frameData.record replaced, not merged) so
    // each case controls exactly which style objects are present.
    const renderWithRecord = async (record, entries = { 'a.png': 'a', 'b.pdf': 'b' }) => {
      jssCalls.length = 0;
      defineUrl('http://localhost/?' + btoa(JSON.stringify({ ...frameData, record })));
      await renderZip(entries);
      await waitFor(() => document.querySelector('#zip-panel img'));
    };
    const styleFor = (name) => jssCalls.filter((c) => c.name === name).pop()?.styles;
    const baseRecord = { skyflowID: 'id', table: 'pii_fields', column: 'primary_card_file' };

    test("uses the SDK defaults when no zip style objects are passed", async () => {
      await renderWithRecord(baseRecord);
      expect(styleFor('zip-container')).toEqual(ZIP_CONTAINER_STYLES);
      expect(styleFor('zip-nav')).toEqual(ZIP_NAV_STYLES);
      expect(styleFor('zip-panel')).toEqual(ZIP_PANEL_STYLES);
      expect(styleFor('zip-nav-item1')).toEqual({ base: ZIP_NAV_LIST_ITEM_STYLES.base });
      // the auto-selected first item gets base + focus merged under the focus variant
      expect(styleFor('zip-nav-item0')).toEqual({
        focus: { ...ZIP_NAV_LIST_ITEM_STYLES.base, ...ZIP_NAV_LIST_ITEM_STYLES.focus },
      });
      expect(document.querySelector('.SkyflowElement-zip-nav-base')).toBeTruthy();
      expect(document.querySelector('.SkyflowElement-zip-panel-base')).toBeTruthy();
      expect(document.querySelector('.SkyflowElement-zip-nav-item0-focus')).toBeTruthy();
      expect(document.querySelector('.SkyflowElement-zip-nav-item1-base')).toBeTruthy();
    });

    test("custom zipNavStyles / zipPanelStyles / zipNavListItemStyles merge over the defaults", async () => {
      await renderWithRecord({
        ...baseRecord,
        zipNavStyles: { base: { width: '25%', backgroundColor: '#eee' } },
        zipPanelStyles: { base: { width: '75%', padding: '0' } },
        zipNavListItemStyles: { base: { color: 'blue', padding: '2px' }, focus: { color: 'green', border: 'none' } },
      });
      expect(styleFor('zip-nav').base).toEqual({ ...ZIP_NAV_STYLES.base, width: '25%', backgroundColor: '#eee' });
      expect(styleFor('zip-panel').base).toEqual({ ...ZIP_PANEL_STYLES.base, width: '75%', padding: '0' });
      expect(styleFor('zip-nav-item1').base).toEqual({ ...ZIP_NAV_LIST_ITEM_STYLES.base, color: 'blue', padding: '2px' });
      // focus = default base -> default focus -> custom base -> custom focus
      expect(styleFor('zip-nav-item0').focus).toEqual({
        ...ZIP_NAV_LIST_ITEM_STYLES.base,
        ...ZIP_NAV_LIST_ITEM_STYLES.focus,
        color: 'green',
        padding: '2px',
        border: 'none',
      });
    });

    test("inputStyles.base is applied to the container and its height also sizes nav and panel", async () => {
      await renderWithRecord({
        ...baseRecord,
        inputStyles: { base: { height: '300px', border: '1px solid red' } },
        zipNavStyles: { base: { width: '25%' } },
      });
      expect(styleFor('zip-container').base).toEqual({
        ...ZIP_CONTAINER_STYLES.base, height: '300px', border: '1px solid red',
      });
      expect(styleFor('zip-nav').base.height).toBe('300px');
      expect(styleFor('zip-panel').base.height).toBe('300px');
      // height override loses to an explicit zip style height
      jssCalls.length = 0;
      document.body.innerHTML = '';
      window.parent.postMessage.mockClear();
      await renderWithRecord({
        ...baseRecord,
        inputStyles: { base: { height: '300px' } },
        zipPanelStyles: { base: { height: '500px' } },
      });
      expect(styleFor('zip-panel').base.height).toBe('500px');
      expect(styleFor('zip-nav').base.height).toBe('300px');
    });

    test("without an inputStyles height, nav and panel keep the default 100% height", async () => {
      await renderWithRecord({ ...baseRecord, inputStyles: { base: { width: '400px' } } });
      expect(styleFor('zip-nav').base.height).toBe('100%');
      expect(styleFor('zip-panel').base.height).toBe('100%');
      expect(styleFor('zip-container').base.width).toBe('400px');
    });

    test("only the base variant is honoured for nav and panel; other variants are ignored", async () => {
      await renderWithRecord({
        ...baseRecord,
        zipNavStyles: { base: { width: '20%' }, focus: { width: '90%' }, error: { color: 'red' }, global: {} },
        zipPanelStyles: { base: { width: '80%' }, hover: { width: '1%' } },
      });
      expect(styleFor('zip-nav')).toEqual({ base: { ...ZIP_NAV_STYLES.base, width: '20%' } });
      expect(styleFor('zip-panel')).toEqual({ base: { ...ZIP_PANEL_STYLES.base, width: '80%' } });
    });

    test("empty, null or non-object zip style values fall back to the defaults without throwing", async () => {
      await renderWithRecord({
        ...baseRecord,
        zipNavStyles: {},
        zipPanelStyles: null,
        zipNavListItemStyles: { base: null },
        inputStyles: undefined,
      });
      expect(styleFor('zip-nav')).toEqual(ZIP_NAV_STYLES);
      expect(styleFor('zip-panel')).toEqual(ZIP_PANEL_STYLES);
      expect(styleFor('zip-nav-item1')).toEqual({ base: ZIP_NAV_LIST_ITEM_STYLES.base });
      expect(styleFor('zip-container')).toEqual(ZIP_CONTAINER_STYLES);
      expect(navItems()).toHaveLength(2);
    });

    test("style objects do not leak into each other", async () => {
      await renderWithRecord({
        ...baseRecord,
        errorTextStyles: { base: { color: '#b00020' } },
        labelStyles: { base: { fontWeight: 'bold' } },
        zipNavStyles: { base: { width: '25%' } },
        zipPanelStyles: { base: { width: '75%' } },
        zipNavListItemStyles: { base: { color: 'blue' } },
      });
      const nav = styleFor('zip-nav').base;
      const panelStyles = styleFor('zip-panel').base;
      const item = styleFor('zip-nav-item1').base;
      expect(nav.color).toBeUndefined();
      expect(nav.fontWeight).toBeUndefined();
      expect(panelStyles.color).toBeUndefined();
      expect(panelStyles.width).toBe('75%');
      expect(nav.width).toBe('25%');
      expect(item.width).toBeUndefined();
      expect(styleFor('zip-container').base.color).toBeUndefined();
      // errorTextStyles only reaches the in-pane message
      expect(styleFor('zip-preview-error')).toBeUndefined();
    });

    test("clicking a list item regenerates focus styles for that item and base for the rest", async () => {
      await renderWithRecord({
        ...baseRecord,
        zipNavListItemStyles: { base: { color: 'blue' }, focus: { color: 'green' } },
      });
      jssCalls.length = 0;
      navItems()[1].click();
      await waitFor(() => document.querySelector('#zip-panel embed'));
      expect(styleFor('zip-nav-item1')).toEqual({
        focus: {
          ...ZIP_NAV_LIST_ITEM_STYLES.base, ...ZIP_NAV_LIST_ITEM_STYLES.focus, color: 'green',
        },
      });
      // item0 dropped back to its base class (no new base styles need generating)
      expect(navItems()[0].classList.contains('SkyflowElement-zip-nav-item0-base')).toBe(true);
      expect(navItems()[0].classList.contains('SkyflowElement-zip-nav-item0-focus')).toBe(false);
      expect(navItems()[1].classList.contains('SkyflowElement-zip-nav-item1-focus')).toBe(true);
    });

    test("in-pane error message: default ZIP_PREVIEW_ERROR_STYLES when errorTextStyles is absent", async () => {
      jssCalls.length = 0;
      defineUrl('http://localhost/?' + btoa(JSON.stringify({ ...frameData, record: baseRecord })));
      await renderZip({ 'run.exe': 'MZ' });
      await waitFor(() => panel().textContent === DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE);
      expect(styleFor('zip-preview-error')).toEqual(ZIP_PREVIEW_ERROR_STYLES);
    });
  });

  // ---------------------------------------------------------------- download
  test("download (allowed): downloads the selected file by basename; other origins are ignored", async () => {
    await renderZip({ 'a.png': 'a', 'dir/sub/b.pdf': 'bb' }, { zipRender: true, allowDownload: true });
    navItems()[1].click();
    await waitFor(() => document.querySelector('#zip-panel embed'));

    const appendSpy = jest.spyOn(document.body, 'appendChild');
    dispatchDownload('https://evil.example');
    await new Promise((r) => setTimeout(r, 10));
    expect(clickSpy).not.toHaveBeenCalled();

    dispatchDownload();
    await waitFor(() => clickSpy.mock.calls.length === 1);
    const anchor = appendSpy.mock.calls.map((c) => c[0]).find((el) => el instanceof HTMLAnchorElement);
    expect(anchor.download).toBe('b.pdf');
    expect(anchor.href).toMatch(/^blob:mock/);
    expect(document.body.contains(anchor)).toBe(false);

    // unrelated messages are ignored
    window.dispatchEvent(new MessageEvent('message', { data: { name: 'something-else' }, origin: clientDomain }));
    await new Promise((r) => setTimeout(r, 10));
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  test("download is blocked by default (allowDownload false)", async () => {
    await renderZip({ 'a.png': 'a' });
    await waitFor(() => document.querySelector('#zip-panel img'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    dispatchDownload();
    await new Promise((r) => setTimeout(r, 10));
    expect(clickSpy).not.toHaveBeenCalled();
    expect(errorSpy.mock.calls.flat().join(' ')).toContain(logs.errorLogs.DOWNLOAD_NOT_ALLOWED);
  });

  test("download is blocked for dangerous file types even when allowed", async () => {
    await renderZip({ 'run.exe': 'MZ' }, { zipRender: true, allowDownload: true });
    await waitFor(() => panel().textContent === DEFAULT_WARNING_FOR_DANGEROUS_FILE_TYPE);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    dispatchDownload();
    await new Promise((r) => setTimeout(r, 10));
    expect(clickSpy).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(errorSpy.mock.calls.flat().join(' ')).toContain(logs.errorLogs.DOWNLOAD_BLOCKED_DANGEROUS_FILE);
  });

  test("download with nothing selected (autoSelectFirst false) logs and does nothing", async () => {
    await renderZip({ 'a.png': 'a' }, { zipRender: true, allowDownload: true, autoSelectFirst: false });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    dispatchDownload();
    await new Promise((r) => setTimeout(r, 10));
    expect(clickSpy).not.toHaveBeenCalled();
    expect(errorSpy.mock.calls.flat().join(' ')).toContain(logs.errorLogs.FAILED_DOWNLOAD_FILE);
  });

  // ---------------------------------------------------------------- options
  test("autoSelectFirst: false lists files without previewing one; click still works", async () => {
    await renderZip({ 'a.png': 'a', 'b.pdf': 'b' }, { zipRender: true, autoSelectFirst: false });
    const items = navItems();
    expect(items).toHaveLength(2);
    expect(document.querySelector('#zip-nav li.active')).toBeNull();
    expect(panel().children).toHaveLength(0);
    expect(createObjectURL).not.toHaveBeenCalled();

    items[0].click();
    await waitFor(() => document.querySelector('#zip-panel img'));
    expect(items[0].classList.contains('active')).toBe(true);
  });

  test("labelMode basename (default): basenames, full path on hover, parent folder on collisions", async () => {
    await renderZip({ 'docs/2024/report.pdf': 'a', 'docs/2025/report.pdf': 'b', 'images/cover.png': 'c' });
    const byTitle = Object.fromEntries([...navItems()].map((li) => [li.title, li.textContent]));
    expect(byTitle['docs/2024/report.pdf']).toBe('2024/report.pdf');
    expect(byTitle['docs/2025/report.pdf']).toBe('2025/report.pdf');
    expect(byTitle['images/cover.png']).toBe('cover.png');
  });

  test("labelMode path shows the full archive path", async () => {
    await renderZip({ 'docs/2024/report.pdf': 'a', 'images/cover.png': 'c' }, { zipRender: true, labelMode: 'path' });
    const labels = [...navItems()].map((li) => li.textContent).sort();
    expect(labels).toEqual(['docs/2024/report.pdf', 'images/cover.png']);
  });

  test("buildFileLabels keeps labels unique: falls back to full path when parents also collide", () => {
    const files = [{ name: 'report.pdf' }, { name: 'x/report.pdf' }, { name: 'y/z/other.pdf' }];
    expect(RevealFrame.buildFileLabels(files, 'basename')).toEqual(['report.pdf', 'x/report.pdf', 'other.pdf']);
    expect(RevealFrame.buildFileLabels(files, 'path')).toEqual(['report.pdf', 'x/report.pdf', 'y/z/other.pdf']);
    const clash = [{ name: 'a/x/r.pdf' }, { name: 'b/x/r.pdf' }, { name: 'c/r.pdf' }];
    expect(RevealFrame.buildFileLabels(clash, 'basename')).toEqual(['a/x/r.pdf', 'b/x/r.pdf', 'c/r.pdf']);
    expect(RevealFrame.buildFileLabels([], 'basename')).toEqual([]);
    expect(RevealFrame.buildFileLabels([{ name: 'weird/' }], 'basename')).toEqual(['weird']);
  });

  // ---------------------------------------------------------------- opt-in / detection
  test("without zipRender a .zip is rendered as a plain file (opt-in)", async () => {
    mockFetch(await buildZip({ 'a.png': 'a' }));
    RevealFrame.init();
    dispatchRenderRequest(null);
    const response = await waitForResponse();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(response.data.result.success.unZippedFilesMetadata).toBeUndefined();
    expect(document.querySelector('#zip-nav')).toBeNull();
    const embed = document.querySelector('embed');
    expect(embed.getAttribute('src')).toBe(ZIP_URL);
  });

  test("zipRender: false is honoured even when passed explicitly", async () => {
    mockFetch(await buildZip({ 'a.png': 'a' }));
    RevealFrame.init();
    dispatchRenderRequest({ zipRender: false });
    await waitForResponse();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(document.querySelector('#zip-nav')).toBeNull();
  });

  test("gzip is not a zip: rendered as a plain file even with zipRender", async () => {
    setFileURLResolve(fileUrl('archive.gz'));
    mockFetch(new ArrayBuffer(0));
    RevealFrame.init();
    dispatchRenderRequest({ zipRender: true });
    const response = await waitForResponse();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(response.data.result.success).toBeDefined();
    expect(response.data.result.errors).toBeUndefined();
    expect(document.querySelector('#zip-nav')).toBeNull();
    expect(document.querySelector('embed').getAttribute('src')).toBe(fileUrl('archive.gz'));
  });

  test("zipRender on a non-zip file (pdf) renders it as a plain file", async () => {
    setFileURLResolve(fileUrl('statement.pdf'));
    RevealFrame.init();
    dispatchRenderRequest({ zipRender: true });
    await waitForResponse();
    expect(document.querySelector('#zip-nav')).toBeNull();
    expect(document.querySelector('embed').getAttribute('type')).toBe('application/pdf');
  });

  test("isZipMimeType is exact and case-insensitive", () => {
    expect(RevealFrame.isZipMimeType('application/zip')).toBe(true);
    expect(RevealFrame.isZipMimeType('Application/X-Zip-Compressed')).toBe(true);
    expect(RevealFrame.isZipMimeType('application/gzip')).toBe(false);
    expect(RevealFrame.isZipMimeType('application/x-7z-compressed')).toBe(false);
    expect(RevealFrame.isZipMimeType('')).toBe(false);
    expect(RevealFrame.isZipMimeType(null)).toBe(false);
    expect(RevealFrame.isZipMimeType(undefined)).toBe(false);
  });

  // ---------------------------------------------------------------- untrusted options
  test("malformed renderOptions from the message fall back to defaults", async () => {
    const buffer = await buildZip({ 'a.png': 'a' });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // not an object → all defaults → zip not rendered
    mockFetch(buffer);
    RevealFrame.init();
    dispatchRenderRequest('zipRender=true');
    await waitForResponse();
    expect(global.fetch).not.toHaveBeenCalled();

    // wrong type for zipRender is ignored (default false)
    document.body.innerHTML = '';
    window.parent.postMessage.mockClear();
    RevealFrame.init();
    dispatchRenderRequest({ zipRender: 'yes' });
    await waitForResponse();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(document.querySelector('#zip-nav')).toBeNull();

    // invalid labelMode / layout / autoSelectFirst are ignored individually; valid zipRender still applies.
    // The "ignored option" warnings are WARN-level, so this frame runs at LogLevel.WARN.
    document.body.innerHTML = '';
    window.parent.postMessage.mockClear();
    defineUrl('http://localhost/?' + btoa(JSON.stringify({
      ...frameData, context: { logLevel: LogLevel.WARN, env: Env.PROD },
    })));
    RevealFrame.init();
    dispatchRenderRequest({ zipRender: true, labelMode: 'weird', layout: 'grid', autoSelectFirst: 'no', extra: 1 });
    await waitForResponse();
    expect(navItems()).toHaveLength(1);
    expect(navItems()[0].textContent).toBe('a.png');
    expect(navItems()[0].classList.contains('active')).toBe(true);
    const warnings = warnSpy.mock.calls.flat().join('\n');
    expect(warnings).toContain("'labelMode'");
    expect(warnings).toContain("'layout'");
    expect(warnings).toContain("'autoSelectFirst'");
  });

  // ---------------------------------------------------------------- empty / errors / limits
  test("empty zip (or only directories + OS metadata) shows the empty message and returns []", async () => {
    const response = await renderZip({ 'only-dir/': null, '__MACOSX/x': 'junk', 'a/.DS_Store': 'j' });
    expect(response.data.result.success.unZippedFilesMetadata).toEqual([]);
    expect(contentText()).toBe(ZIP_EMPTY_ARCHIVE_MESSAGE);
    expect(document.querySelector('#zip-nav')).toBeNull();
  });

  test("fetch failure rejects with FAILED_TO_UNZIP_FILES and shows the render error", async () => {
    mockFetch(new ArrayBuffer(0), false);
    RevealFrame.init();
    dispatchRenderRequest();
    const response = await waitForResponse();
    expect(response.data.result.errors).toEqual({
      errors: { error: { ...SKYFLOW_ERROR_CODE.FAILED_TO_UNZIP_FILES } },
    });
    expect(errorText()).toBe('File rendering failed. Please try again later.');
    expect(contentText()).toBe('xxxx'); // altText restored
  });

  test("network error (fetch throws) rejects with FAILED_TO_UNZIP_FILES", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('offline')));
    RevealFrame.init();
    dispatchRenderRequest();
    const response = await waitForResponse();
    expect(response.data.result.errors.errors.error.code).toBe(SKYFLOW_ERROR_CODE.FAILED_TO_UNZIP_FILES.code);
    expect(errorText()).toBe('File rendering failed. Please try again later.');
  });

  test("corrupt zip data rejects with FAILED_TO_UNZIP_FILES", async () => {
    mockFetch(Uint8Array.from(Buffer.from('not a zip')).buffer);
    RevealFrame.init();
    dispatchRenderRequest();
    const response = await waitForResponse();
    expect(response.data.result.errors.errors.error.code).toBe(SKYFLOW_ERROR_CODE.FAILED_TO_UNZIP_FILES.code);
  });

  test("a large archive renders its full manifest without inflating entries up front", async () => {
    const entries = {};
    for (let i = 0; i < 300; i += 1) entries[`dir${i % 7}/f${i}.txt`] = 'x'.repeat(50);
    const response = await renderZip(entries, { zipRender: true, autoSelectFirst: false });
    expect(response.data.result.success.unZippedFilesMetadata).toHaveLength(300);
    expect(response.data.result.success.unZippedFilesMetadata[0].fileSize).toBe(50);
    expect(navItems()).toHaveLength(300);
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------- re-render / races
  test("re-rendering revokes previous blob URLs and rebuilds the layout", async () => {
    await renderZip({ 'a.png': 'a' });
    await waitFor(() => document.querySelector('#zip-panel img'));
    expect(revokeObjectURL).not.toHaveBeenCalled();

    window.parent.postMessage.mockClear();
    mockFetch(await buildZip({ 'b.png': 'b', 'c.png': 'c' }));
    dispatchRenderRequest();
    await waitForResponse();
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith(expect.stringMatching(/^blob:mock/));
    expect(navItems()).toHaveLength(2);
    expect(document.querySelectorAll('.SkyflowElement-zip-container-base')).toHaveLength(1);
  });

  test("a failed re-render after a zip render tears the layout down and shows the error", async () => {
    await renderZip({ 'a.png': 'a' });
    expect(navItems()).toHaveLength(1);

    window.parent.postMessage.mockClear();
    mockFetch(new ArrayBuffer(0), false);
    dispatchRenderRequest();
    const response = await waitForResponse();
    expect(response.data.result.errors.errors.error.code).toBe(SKYFLOW_ERROR_CODE.FAILED_TO_UNZIP_FILES.code);
    expect(document.querySelector('#zip-nav')).toBeNull();
    expect(errorText()).toBe('File rendering failed. Please try again later.');
    expect(contentText()).toBe('xxxx');
  });

  test("re-render as a plain file after a zip render removes the zip layout", async () => {
    await renderZip({ 'a.png': 'a' });
    window.parent.postMessage.mockClear();
    setFileURLResolve(fileUrl('statement.pdf'));
    dispatchRenderRequest({ zipRender: true });
    await waitForResponse();
    expect(document.querySelector('#zip-nav')).toBeNull();
    expect(document.querySelector('embed').getAttribute('type')).toBe('application/pdf');
  });

  test("overlapping renders: the newer request owns the DOM even if the older finishes last", async () => {
    const first = await buildZip({ 'old.png': 'o' });
    const second = await buildZip({ 'new.png': 'n', 'new2.png': 'n' });
    let releaseFirst;
    global.fetch = jest.fn()
      .mockImplementationOnce(() => new Promise((r) => { releaseFirst = () => r({ ok: true, arrayBuffer: () => Promise.resolve(first) }); }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(second) }));

    RevealFrame.init();
    dispatchRenderRequest();
    await waitFor(() => global.fetch.mock.calls.length === 1);
    dispatchRenderRequest();
    await waitForResponse();
    expect(navItems()).toHaveLength(2);

    releaseFirst();
    await waitFor(() => window.parent.postMessage.mock.calls
      .filter((c) => c[0]?.type === ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + elementNameComposable).length === 2);
    // both callers got an answer, but the DOM still shows the second archive
    expect(navItems()).toHaveLength(2);
    expect([...navItems()].map((li) => li.title)).toEqual(['new.png', 'new2.png']);
  });

  // ---------------------------------------------------------------- helpers
  test("static helpers", () => {
    expect(RevealFrame.isSystemFile('__MACOSX/._a.png')).toBe(true);
    expect(RevealFrame.isSystemFile('dir/.DS_Store')).toBe(true);
    expect(RevealFrame.isSystemFile('dir/Thumbs.db')).toBe(true);
    expect(RevealFrame.isSystemFile('dir/a.png')).toBe(false);

    expect(RevealFrame.basename('a/b/c.pdf')).toBe('c.pdf');
    expect(RevealFrame.basename('c.pdf')).toBe('c.pdf');
    expect(RevealFrame.basename('dir/')).toBe('dir');
  });
});
