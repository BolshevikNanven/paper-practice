import * as pdfjsLib from 'pdfjs-dist'
import { toBlob } from 'html-to-image'

import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/src/display/api'

const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.href

/**
 * 处理一个 PDF 文件，将其所有页面转换为图片
 * @param file 单个 PDF 文件
 * @param canvasEl 可重用的 canvas 元素
 * @returns 包含所有页面 data URL 的数组
 */
/**
 * 将 PDF 文件转换为图片 Blob 数组
 * @param file 用户选择的 PDF 文件
 * @param canvasEl 一个可重用的 <canvas> 元素
 * @returns Promise，解析为一个包含所有页面 Blob 的数组
 */
export async function convertPdfToImages(file: File, canvasEl: HTMLCanvasElement): Promise<Blob[]> {
    const imagesAsBlobs: Blob[] = []
    const arrayBuffer = await file.arrayBuffer()

    // 2. 加载 PDF 文档
    const pdfDoc: PDFDocumentProxy = await pdfjsLib.getDocument({
        data: arrayBuffer,
    }).promise

    async function convertPageToImage(page: PDFPageProxy, scale: number): Promise<Blob> {
        const viewport = page.getViewport({ scale })

        canvasEl.height = viewport.height
        canvasEl.width = viewport.width

        await page.render({
            canvas: canvasEl,
            viewport: viewport,
        }).promise

        return new Promise((resolve, reject) => {
            canvasEl.toBlob(
                blob => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Canvas to Blob conversion failed.'))
                    }
                },
                'image/png',
                0.9,
            )
        })
    }

    // 5. 遍历所有页面
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
