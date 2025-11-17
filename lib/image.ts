import { toBlob } from 'html-to-image'

import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/src/display/api'

export async function convertPdfToImages(file: File, canvasEl: HTMLCanvasElement): Promise<Blob[]> {
    const pdfjsLib = await import('pdfjs-dist/build/pdf.min.mjs')

    const version = pdfjsLib.version || '5.4.394'
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`

    const imagesAsBlobs: Blob[] = []
    const arrayBuffer = await file.arrayBuffer()

    const pdfDoc: PDFDocumentProxy = await pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${version}/cmaps/`,
        cMapPacked: true,
    }).promise

    async function convertPageToImage(page: PDFPageProxy, scale: number): Promise<Blob> {
        const viewport = page.getViewport({ scale })

        canvasEl.height = viewport.height
        canvasEl.width = viewport.width

        const ctx = canvasEl.getContext('2d')
        if (!ctx) throw new Error('Canvas context not found')

        await page.render({
            canvas: canvasEl,
            viewport: viewport,
        }).promise

        return new Promise((resolve, reject) => {
            canvasEl.toBlob(
                blob => {
                    if (blob) resolve(blob)
                    else reject(new Error('Canvas to Blob conversion failed.'))
                },
                'image/png',
                0.9,
            )
        })
    }

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i)
        const imageBlob = await convertPageToImage(page, 2)
        imagesAsBlobs.push(imageBlob)
        page.cleanup()
    }

    return imagesAsBlobs
}

export async function convertDomToImage(dom: HTMLElement): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
        const data = await toBlob(dom, {
            pixelRatio: 2,
        })

        if (data) {
            resolve(data)
        }
        reject(new Error('null'))
    })
}
