import { Buffer } from 'buffer';

const wordToColor = (word: number): string => {
    const r = ((word >> 0x00) & 0x1f) << 3;
    const g = ((word >> 0x05) & 0x1f) << 3;
    const b = ((word >> 0x0a) & 0x1f) << 3;
    const a = word > 0 ? 1 : 0;
    return `rgba(${r}, ${g}, ${b}, ${a})`
};


const unpackTexture = (src: Buffer) => {

    const tim = {
        type: src.readUInt32LE(0x00),
        fullSize: src.readUInt32LE(0x04),
        paletteX: src.readUInt16LE(0x0c),
        paletteY: src.readUInt16LE(0x0e),
        colorCount: src.readUInt16LE(0x10),
        paletteCount: src.readUInt16LE(0x12),
        imageX: src.readUInt16LE(0x14),
        imageY: src.readUInt16LE(0x16),
        width: src.readUInt16LE(0x18) * 4,
        height: src.readUInt16LE(0x1a),
        bitfieldSize: src.readUInt16LE(0x24),
        payloadSize: src.readUInt16LE(0x26),
    };


    const { fullSize, bitfieldSize } = tim;
    const bitfield: number[] = new Array();
    const target = Buffer.alloc(fullSize);

    // Read Bitfield

    let ofs = 0x30;
    for (let i = 0; i < bitfieldSize; i += 4) {
        const dword = src.readUInt32LE(ofs + i);
        for (let k = 31; k > -1; k--) {
            bitfield.push(dword & (1 << k) ? 1 : 0);
        }
    }

    ofs += bitfieldSize;

    // Decompress

    let outOfs = 0;
    let windowOfs = 0;
    let cmdCount = 0;
    let bytes = 0;

    for (let i = 0; i < bitfield.length; i++) {
        const bit = bitfield[i];
        if (outOfs === fullSize) {
            break;
        }

        const word = src.readUInt16LE(ofs);
        ofs += 2;

        switch (bit) {
            case 0:
                target.writeUInt16LE(word, outOfs);
                outOfs += 2;
                break;
            case 1:
                if (word === 0xffff) {
                    windowOfs += 0x2000;
                    cmdCount = 0;
                    bytes = 0;
                } else {
                    cmdCount++;
                    const copyFrom = windowOfs + ((word >> 3) & 0x1fff);
                    const copyLen = ((word & 0x07) + 2) * 2;
                    bytes += copyLen;
                    for (let i = 0; i < copyLen; i++) {
                        target[outOfs++] = target[copyFrom + i];
                    }
                }
                break;
        }
    }

    // Read palette
    ofs = 0;
    const { colorCount, paletteCount } = tim;
    const palette: string[] = new Array();
    for (let i = 0; i < paletteCount * colorCount; i++) {
        const word = target.readUInt16LE(ofs);
        ofs += 2;
        palette.push(wordToColor(word));
    }

    // Read image data
    const imageData: number[] = new Array();
    for (ofs; ofs < target.length; ofs++) {
        const byte = target.readUInt8(ofs);
        imageData.push(byte & 0xf);
        imageData.push(byte >> 4);
    }

    return { palette, imageData }
}

const renderTexture = (imageData: number[], palette: string[]) => {

    const WIDTH = 256;
    const HEIGHT = 256;

    // Render Canvas
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d')

    let index = 0;
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            const colorIndex = imageData[index++];
            const color = palette[colorIndex!];
            ctx!.fillStyle = color;
            ctx!.fillRect(x, y, 1, 1)
        }
    }

    return canvas;
}

const loadTexture = (buffer: ArrayBuffer) => {
    const src = Buffer.from(buffer)
    const bodyTexture = unpackTexture(src);
    const bodyCanvas = renderTexture(bodyTexture.imageData, bodyTexture.palette);
    return bodyCanvas;
}

export { loadTexture };
export default loadTexture;
