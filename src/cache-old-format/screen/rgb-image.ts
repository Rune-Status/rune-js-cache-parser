import { EarlyCacheArchive } from '../early-cache-archive';

export class RgbImage {

    public pixels: number[];
    public width: number;
    public height: number;
    public offsetX: number;
    public offsetY: number;
    public maxWidth: number;
    public maxHeight: number;

    public static load(archive: EarlyCacheArchive, fileName: string, archiveIndex: number): RgbImage {
        return new RgbImage();
        /*const dataBuffer = archive.getFileData(fileName + '.dat');
        const indexBuffer = archive.getFileData('index.dat');
        indexBuffer.setReaderIndex(dataBuffer.readUnsignedShortBE());

        const image = new RgbImage();

        image.maxWidth = indexBuffer.readUnsignedShortBE();
        image.maxHeight = indexBuffer.readUnsignedShortBE();
        const length = indexBuffer.readUnsignedByte();
        const pixels: number[] = new Array(length);

        for(let pixel = 0; pixel < length - 1; pixel++) {
            pixels[pixel + 1] = indexBuffer.readMediumBE();
            if(pixels[pixel + 1] == 0) {
                pixels[pixel + 1] = 1;
            }
        }

        for(let index = 0; index < archiveIndex; index++) {
            indexBuffer.setReaderIndex(indexBuffer.getReaderIndex() + 2);
            dataBuffer.setReaderIndex(dataBuffer.getReaderIndex() + indexBuffer.readUnsignedShortBE() * indexBuffer.readUnsignedShortBE());
            indexBuffer.setReaderIndex(indexBuffer.getReaderIndex() + 1);
        }

        image.offsetX = indexBuffer.readUnsignedByte();
        image.offsetY = indexBuffer.readUnsignedByte();
        image.width = indexBuffer.readUnsignedShortBE();
        image.height = indexBuffer.readUnsignedShortBE();
        const type = indexBuffer.readUnsignedByte();
        const pixelCount = image.width * image.height;
        image.pixels = new Array(pixelCount);

        if(type == 0) {
            for(let pixel = 0; pixel < pixelCount; pixel++){
                image.pixels[pixel] = pixels[dataBuffer.readUnsignedByte()];
            }

            return;
        }

        if(type == 1) {
            for(let x = 0; x < image.width; x++) {
                for(let y = 0; y < image.height; y++) {
                    image.pixels[x + y * image.width] = pixels[dataBuffer.readUnsignedByte()];
                }
            }
        }

        return image;*/
    }

}
