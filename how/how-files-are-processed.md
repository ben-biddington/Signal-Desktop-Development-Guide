# How files are processed

![alt text](./assets/how-files-are-processed/message-with-image-attached.png)

Attached files are processed by `handleImageAttachment` (`ts/util/handleImageAttachment.ts`).

## How to write tests against `handleImageAttachment`

These are written under `test-electron` because `handleImageAttachment` requires browser APIs.

```ts
import { readFileSync, statSync } from "fs";
import { basename } from "path";
import { assert } from "chai";
import type { PNGWithMetadata } from "pngjs";
import { PNG } from "pngjs";
import JPEG from "jpeg-js";
import { handleImageAttachment } from "../../util/handleImageAttachment";

const process = async (
  sampleFile: string
): Promise<[PNGWithMetadata, PNGWithMetadata]> => {
  const result = await handleImageAttachment(
    new File([readFileSync(sampleFile)], basename(sampleFile), {
      type: "image/png",
    })
  );

  // @ts-expect-error "data is undefined"
  const buffer = Buffer.from(result.data);

  const before = png(readFileSync(sampleFile));
  const after = png(buffer);

  return [before, after];
};

const png = (file: string | Buffer) =>
  PNG.sync.read(Buffer.isBuffer(file) ? file : readFileSync(file));

const jpeg = (file: Buffer) => JPEG.decode(file);

const fileSize = (file: string) => statSync(file).size;

// npm run test-electron -- --grep="image processing"
describe("image processing with `handleImageAttachment`", () => {
  it("returns a png file when input file is small (489B)", async () => {
    const smallPngFile = "./fixtures/20x200-yellow.png";

    assert.equal(fileSize(smallPngFile), 489);

    const [before, after] = await process(smallPngFile);

    assert.equal(after.width, before.width);
    assert.equal(after.height, before.height);
    assert.equal(after.alpha, before.alpha);

    assert.equal(after.data.length, before.data.length);
  });

  /*
  
    Conversion to jpeg removes transparency.

    https://github.com/signalapp/Signal-Desktop/issues/6928

  */
  it("returns a jpeg for this large png (500kB)", async () => {
    const largePngFile =
      "./fixtures/freepngs-2cd43b_bed7d1327e88454487397574d87b64dc_mv2.png";

    assert.equal(fileSize(largePngFile), 511505);

    const originalPng = png(largePngFile);

    assert.deepEqual(
      {
        width: originalPng.width,
        height: originalPng.height,
      },
      { width: 800, height: 1200 }
    );

    const result = await handleImageAttachment(
      new File([readFileSync(largePngFile)], basename(largePngFile), {
        type: "image/png",
      })
    );

    assert.equal(
      result.fileName,
      "freepngs-2cd43b_bed7d1327e88454487397574d87b64dc_mv2.jpg"
    );

    // @ts-expect-error "data is undefined"
    const jpegFile = jpeg(result.data);

    assert.deepEqual(
      { width: jpegFile.width, height: jpegFile.height },
      { width: 800, height: 1200 },
      "Image dimensions have been changed"
    );

    // Not sure I expected this
    assert.equal(jpegFile.data.length, originalPng.data.length);
  });
});
```

I am having a problem with this test though because I want to compare `result` with `file` and I don't know how.

I am unsure actually how `readFileSync` is working. This must be run under same context as `main.ts`?

That means we can load the image with node js.

# Issues

## [Transparent Png Doesn't Work (Even With Files)](https://github.com/signalapp/Signal-Desktop/issues/6928)

This looks to be an issue whereby png files are converted to jpeg when resizing. See `scaleImageToLevel` (`ts/util/scaleImageToLevel.ts`).

## [File size increase when sending images](https://github.com/signalapp/Signal-Desktop/issues/6881)
