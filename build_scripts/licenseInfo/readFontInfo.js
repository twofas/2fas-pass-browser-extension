// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { Buffer } from 'node:buffer';
import zlib from 'node:zlib';

const WOFF2_KNOWN_TAGS = Object.freeze([
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT',
  'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH',
  'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar',
  'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'
]);

const NAME_IDS = Object.freeze({
  copyright: 0,
  family: 1,
  subfamily: 2,
  fullName: 4,
  version: 5,
  manufacturer: 8,
  designer: 9,
  description: 10,
  vendorUrl: 11,
  designerUrl: 12,
  licenseDescription: 13,
  licenseUrl: 14,
  typographicFamily: 16
});

/**
 * Reads a UIntBase128 number (WOFF2).
 * @param {Buffer} buffer - Font data.
 * @param {number} offset - Start offset.
 * @return {{ value: number, offset: number }} Value and the offset after it.
 */
const readUIntBase128 = (buffer, offset) => {
  let value = 0;

  for (let i = 0; i < 5; i += 1) {
    const byte = buffer[offset + i];
    value = (value * 128) + (byte & 0x7f);

    if ((byte & 0x80) === 0) {
      return { value, offset: offset + i + 1 };
    }
  }

  throw new Error('Invalid UIntBase128');
};

/**
 * Extracts the tables of a TrueType/OpenType font.
 * @param {Buffer} buffer - Font data.
 * @return {Map<string, Buffer>} Table tag to table data.
 */
const readSfntTables = buffer => {
  const tables = new Map();
  const numTables = buffer.readUInt16BE(4);

  for (let i = 0; i < numTables; i += 1) {
    const record = 12 + (i * 16);
    const tag = buffer.toString('latin1', record, record + 4);
    const offset = buffer.readUInt32BE(record + 8);
    const length = buffer.readUInt32BE(record + 12);
    tables.set(tag, buffer.subarray(offset, offset + length));
  }

  return tables;
};

/**
 * Extracts the untransformed tables of a WOFF2 font (glyf/loca/hmtx stay transformed and are not needed here).
 * @param {Buffer} buffer - Font data.
 * @return {Map<string, Buffer>} Table tag to table data.
 */
const readWoff2Tables = buffer => {
  const numTables = buffer.readUInt16BE(12);
  const totalCompressedSize = buffer.readUInt32BE(20);
  const entries = [];
  let offset = 48;

  for (let i = 0; i < numTables; i += 1) {
    const flags = buffer[offset];
    offset += 1;

    let tag;

    if ((flags & 0x3f) === 0x3f) {
      tag = buffer.toString('latin1', offset, offset + 4);
      offset += 4;
    } else {
      tag = WOFF2_KNOWN_TAGS[flags & 0x3f];
    }

    const transformVersion = flags >> 6;
    const origLength = readUIntBase128(buffer, offset);
    offset = origLength.offset;

    const isTransformed = tag === 'glyf' || tag === 'loca' ? transformVersion === 0 : transformVersion !== 0;
    let length = origLength.value;

    if (isTransformed) {
      const transformLength = readUIntBase128(buffer, offset);
      offset = transformLength.offset;
      length = transformLength.value;
    }

    entries.push({ tag, length, isTransformed });
  }

  const data = zlib.brotliDecompressSync(buffer.subarray(offset, offset + totalCompressedSize));
  const tables = new Map();
  let position = 0;

  for (const entry of entries) {
    if (!entry.isTransformed) {
      tables.set(entry.tag, data.subarray(position, position + entry.length));
    }

    position += entry.length;
  }

  return tables;
};

/**
 * Reads the English strings of a "name" table.
 * @param {Buffer} table - name table data.
 * @return {Map<number, string>} nameID to string.
 */
const readNameTable = table => {
  const names = new Map();
  const count = table.readUInt16BE(2);
  const stringOffset = table.readUInt16BE(4);
  const macNames = new Map();

  for (let i = 0; i < count; i += 1) {
    const record = 6 + (i * 12);
    const platformId = table.readUInt16BE(record);
    const encodingId = table.readUInt16BE(record + 2);
    const languageId = table.readUInt16BE(record + 4);
    const nameId = table.readUInt16BE(record + 6);
    const length = table.readUInt16BE(record + 8);
    const start = stringOffset + table.readUInt16BE(record + 10);
    const bytes = table.subarray(start, start + length);

    if (platformId === 3 && (encodingId === 1 || encodingId === 10) && languageId === 0x409) {
      names.set(nameId, Buffer.from(bytes).swap16().toString('utf16le'));
    } else if (platformId === 1 && encodingId === 0 && languageId === 0) {
      macNames.set(nameId, bytes.toString('latin1'));
    }
  }

  for (const [nameId, value] of macNames) {
    if (!names.has(nameId)) {
      names.set(nameId, value);
    }
  }

  return names;
};

/**
 * Reads the variation axes of a "fvar" table.
 * @param {Buffer} table - fvar table data.
 * @return {string} Axes as "tag min–max (default d)", separated by ", ".
 */
const readAxes = table => {
  const axesOffset = table.readUInt16BE(4);
  const axisCount = table.readUInt16BE(8);
  const axisSize = table.readUInt16BE(10);
  const axes = [];

  for (let i = 0; i < axisCount; i += 1) {
    const record = axesOffset + (i * axisSize);
    const tag = table.toString('latin1', record, record + 4);
    const [min, def, max] = [4, 8, 12].map(shift => table.readInt32BE(record + shift) / 65536);
    axes.push(`${tag} ${min}–${max} (default ${def})`);
  }

  return axes.join(', ');
};

/**
 * Reads the metadata of a font file (TTF, OTF or WOFF2): name strings, variation axes, glyph count and hhea vertical metrics.
 * @param {Buffer} buffer - Font data.
 * @return {Object} Font metadata.
 */
const readFontInfo = buffer => {
  const signature = buffer.toString('latin1', 0, 4);
  let tables;

  if (signature === 'wOF2') {
    tables = readWoff2Tables(buffer);
  } else if (signature === '\u0000\u0001\u0000\u0000' || signature === 'OTTO' || signature === 'true') {
    tables = readSfntTables(buffer);
  } else {
    throw new Error(`Unsupported font format "${signature}"`);
  }

  const names = tables.has('name') ? readNameTable(tables.get('name')) : new Map();
  const info = Object.fromEntries(Object.entries(NAME_IDS).map(([key, nameId]) => [key, names.get(nameId) || '']));

  info.versionNumber = /(\d+(?:\.\d+)*)/.exec(info.version)?.[1] || '';
  info.axes = tables.has('fvar') ? readAxes(tables.get('fvar')) : '';
  info.glyphs = tables.has('maxp') ? tables.get('maxp').readUInt16BE(4) : 0;
  info.unitsPerEm = tables.has('head') ? tables.get('head').readUInt16BE(18) : 0;
  info.ascender = tables.has('hhea') ? tables.get('hhea').readInt16BE(4) : 0;
  info.descender = tables.has('hhea') ? tables.get('hhea').readInt16BE(6) : 0;
  info.lineGap = tables.has('hhea') ? tables.get('hhea').readInt16BE(8) : 0;

  return info;
};

export default readFontInfo;
