import { GenerateImageResponse, RequestInfo } from './types';
import { createVolcRequest } from './volcEngine';
// Use native fetch API since we're in a browser environment

export interface ImageGenerationOptions {
    prompt: string;
    width: number;
    height: number;
    scale: number;
    use_pre_llm: boolean;
    volcAccessKeyId: string;
    volcSecretAccessKey: string;
}

export async function generateImage(options: ImageGenerationOptions): Promise<GenerateImageResponse> {
    const requestInfo = createVolcRequest(
        options.volcAccessKeyId,
        options.volcSecretAccessKey,
        "visual.volcengineapi.com",
        "CVProcess",
        "2022-08-31",
        {
            req_key: "high_aes_general_v30l_zt2i",
            binary_data_base64: [],
            seed: -1,
            scale: options.scale,
            use_pre_llm: options.use_pre_llm,
            width: options.width,
            height: options.height,
            prompt: options.prompt,
            return_url: true
        }
    );

    try {
        const response = await fetch(requestInfo.url, {
            method: requestInfo.method,
            headers: requestInfo.headers,
            body: requestInfo.data
        });

        const data = await response.json();

        if (data.code === 10000 && 'data' in data) {
            return {
                success: true,
                image_urls: data.data.image_urls,
                request_id: data.request_id,
                message: data.message || 'Success'
            };
        } else {
            return {
                success: false,
                message: data.message || 'Failed to generate image',
                request_id: data.request_id,
                code: data.code
            };
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
} 