import {
    env,
    AutoModel,
    AutoProcessor,
    PreTrainedModel,
    Processor,
    RawImage,
    PretrainedConfig,
} from '@huggingface/transformers'
import type { WorkerRequest, WorkerResponse } from './interface'

env.allowLocalModels = true
env.allowRemoteModels = false

let model: PreTrainedModel
let processor: Processor

const MODEL_PATH = '/models/yolov10m-doclaynet'

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
    const { id, image } = event.data

    try {
        if (!model) {
            model = await AutoModel.from_pretrained(MODEL_PATH, { dtype: 'fp32' })
            processor = await AutoProcessor.from_pretrained(MODEL_PATH)
        }

        const imaged = await RawImage.read(image)
        const { pixel_values, reshaped_input_sizes } = await processor(imaged)

        // 运行模型推理
        const { output0 } = await model({ images: pixel_values })
        const predictions = output0.tolist()[0]

        const threshold = 0.3
        const [newHeight, newWidth] = reshaped_input_sizes[0]

        const [xs, ys] = [imaged.width / newWidth, imaged.height / newHeight]

        const results = []

        for (const [xmin, ymin, xmax, ymax, score, classId] of predictions) {
            if (score < threshold) continue

            // 映射回原图坐标
            const box = [xmin * xs, ymin * ys, xmax * xs, ymax * ys]

            interface ModelConfigExtensions {
                id2label?: Record<string, string>
            }
            const config = model.config as PretrainedConfig & ModelConfigExtensions
            const label = config.id2label ? config.id2label[classId] : `Class ${classId}`

            results.push({
                label: label,
                score: score,
                box: box,
            })
        }

        console.log(`Worker: Detected ${results.length} items.`, results)

        const message: WorkerResponse = {
            id,
            status: 'success',
            output: results,
            origin: {
                w: imaged.width,
                h: imaged.height,
            },
        }
        self.postMessage(message)
    } catch (err) {
        console.error('Worker Error:', err)
        self.postMessage({ id, status: 'error', error: String(err) })
    } finally {
    }
}
