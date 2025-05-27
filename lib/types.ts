export interface Headers {
    [key: string]: string;
}

export interface RequestInfo {
    url: string;
    method: string;
    headers: Headers;
    data: string;
}

export interface GenerateImageResponse {
    success: boolean;
    image_urls?: string[];
    request_id?: string;
    message: string;
    code?: number;
}

export interface ImageGenerationOptions {
    prompt: string;
    width?: number;
    height?: number;
    scale?: number;
    seed?: number;
    use_pre_llm?: boolean;
} 