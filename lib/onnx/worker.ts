import { env, RawImage } from '@huggingface/transformers'
import * as ort from 'onnxruntime-web'
import type { WorkerRequest, WorkerResponse } from './interface'

env.allowLocalModels = true
env.allowRemoteModels = false

const LABELS = [
    'Header',
    'Text',
    'Reference',
    'Figure caption',
    'Figure',
    'Table caption',
    'Table',
    'Title',
    'Footer',
    'Equation',
]

let session: ort.InferenceSession | null = null
const MODEL_PATH = '/models/yolov8-cdln.onnx'

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
    const { id, image } = event.data

    try {
        // 1. 初始化 Session
        if (!session) {
            self.postMessage({ id, status: 'progress', progress: 10, file: 'model.onnx' } as WorkerResponse)

            session = await ort.InferenceSession.create(MODEL_PATH, {
                executionProviders: ['wasm'],
            })

            self.postMessage({ id, status: 'progress', progress: 100, file: 'model.onnx' } as WorkerResponse)
        }

        // 2. 图像预处理
        const rawImg = await RawImage.read(image)
        const inputSize = 640 // YOLO 默认

        const resized = await rawImg.resize(inputSize, inputSize)

        // 归一化 & 转 Tensor (HWC -> CHW, 0-255 -> 0-1)
        const floatData = new Float32Array(inputSize * inputSize * 3)
        const { data } = resized

        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            // i: RGBA index, j: pixel index
            // R
            floatData[j] = data[i] / 255.0
            // G
            floatData[j + inputSize * inputSize] = data[i + 1] / 255.0
            // B
            floatData[j + inputSize * inputSize * 2] = data[i + 2] / 255.0
        }

        const tensor = new ort.Tensor('float32', floatData, [1, 3, inputSize, inputSize])

        // 3. 推理
        const feeds = { images: tensor } // YOLOv8/v10 默认输入名为 'images'
        const results = await session.run(feeds)

        // 获取输出: Shape (1, 14, 8400)
        const output = results[session.outputNames[0]]

        // 4. 后处理 (解析 + NMS)
        const predictions = processOutput(output, rawImg.width, rawImg.height)

        console.log(`Worker: Detected ${predictions.length} items.`, predictions)

        const message: WorkerResponse = {
            id,
            status: 'success',
            output: predictions,
            origin: { w: rawImg.width, h: rawImg.height },
        }
        self.postMessage(message)
    } catch (err) {
        console.error('Worker Error:', err)
        self.postMessage({ id, status: 'error', error: String(err) })
    }
}

function processOutput(output: any, imgWidth: number, imgHeight: number) {
    const boxes: any[] = []
    const [channels, anchors] = output.dims // 1, 14, 8400
    const data = output.data as Float32Array

    const CONFIDENCE_THRESHOLD = 0.25
    const IOU_THRESHOLD = 0.45

    // 计算缩放比例 (原图 / 模型输入)
    // 模型输入固定为 640 (如果你改了 inputSize 这里也要改)
    const xRatio = imgWidth / 640
    const yRatio = imgHeight / 640

    for (let i = 0; i < anchors; i++) {
        // 1. 找出最大概率的类别
        let maxScore = 0
        let maxClassIndex = -1

        // 从第 4 个开始遍历类别 (前4个是坐标)
        for (let j = 4; j < channels; j++) {
            const score = data[j * anchors + i]
            if (score > maxScore) {
                maxScore = score
                maxClassIndex = j - 4
            }
        }

        if (maxScore > CONFIDENCE_THRESHOLD) {
            // 2. 读取 YOLO 原始坐标 (640x640 尺度下的 cx, cy, w, h)
            const cx = data[0 * anchors + i]
            const cy = data[1 * anchors + i]
            const w = data[2 * anchors + i]
            const h = data[3 * anchors + i]

            // 3. 转换为 左上角 (x_min, y_min) 和 右下角 (x_max, y_max)
            // 先计算在 640 尺度下的左上/右下
            const x_min_640 = cx - w / 2
            const y_min_640 = cy - h / 2
            const x_max_640 = cx + w / 2
            const y_max_640 = cy + h / 2

            // 4. 映射回原图尺寸 (分别乘上宽高的缩放比)
            const x_min = x_min_640 * xRatio
            const y_min = y_min_640 * yRatio
            const x_max = x_max_640 * xRatio
            const y_max = y_max_640 * yRatio

            // 5. 边界限制 (防止框跑到图片外面)
            boxes.push({
                label: LABELS[maxClassIndex] || `Class ${maxClassIndex}`,
                score: maxScore,
                // 格式：[xmin, ymin, xmax, ymax]
                box: [Math.max(0, x_min), Math.max(0, y_min), Math.min(imgWidth, x_max), Math.min(imgHeight, y_max)],
            })
        }
    }

    return nms(boxes, IOU_THRESHOLD)
}

/**
 * 对应的 NMS 函数 (适配 [xmin, ymin, xmax, ymax] 格式)
 */
function nms(boxes: any[], iouThreshold: number) {
    if (boxes.length === 0) return []

    boxes.sort((a, b) => b.score - a.score)

    const selected = []
    const active = new Array(boxes.length).fill(true)

    for (let i = 0; i < boxes.length; i++) {
        if (!active[i]) continue
        selected.push(boxes[i])

        for (let j = i + 1; j < boxes.length; j++) {
            if (active[j]) {
                // 注意：这里传进去的是 box 对象
                const iou = calculateIoU(boxes[i].box, boxes[j].box)
                if (iou > iouThreshold) {
                    active[j] = false
                }
            }
        }
    }
    return selected
}

/**
 * 计算 IoU (适配 xmin, ymin, xmax, ymax)
 */
function calculateIoU(box1: number[], box2: number[]) {
    // box: [xmin, ymin, xmax, ymax]
    const x1 = Math.max(box1[0], box2[0])
    const y1 = Math.max(box1[1], box2[1])
    const x2 = Math.min(box1[2], box2[2])
    const y2 = Math.min(box1[3], box2[3])

    const intersectionW = Math.max(0, x2 - x1)
    const intersectionH = Math.max(0, y2 - y1)
    const intersectionArea = intersectionW * intersectionH

    const box1Area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    const box2Area = (box2[2] - box2[0]) * (box2[3] - box2[1])

    const unionArea = box1Area + box2Area - intersectionArea

    return unionArea === 0 ? 0 : intersectionArea / unionArea
}
