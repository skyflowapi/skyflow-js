/*
Copyright (c) 2022 Skyflow, Inc.
*/
// flowDB reveal element: the shared @core reveal-element base bound to flowDB's
// token-only reveal-input shape. No renderFile — file-render is privacyDB-only.
import CoreRevealElement from '@core/external/reveal/reveal-element';
import { IRevealElementInput } from './reveal-container';

export default class RevealElement extends CoreRevealElement<IRevealElementInput> {}
