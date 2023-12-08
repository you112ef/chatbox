export default interface IModel {
    paint(prompt: string, num: number, callback?: (picBase64: string) => any, signal?: AbortSignal): Promise<string[]>
}

export type onResultChange = (result: string) => void
