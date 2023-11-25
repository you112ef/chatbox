export default interface IModel {
    paint(prompt: string, num: number, signal?: AbortSignal): Promise<string[]>
}
