import { debounce } from 'lodash'

export default class PaneSizesRecorder {
    public key: string
    private debouncedSet: (value: number[]) => void

    constructor(key: string) {
        this.key = `PaneSizesRecorder:${key}`
        this.debouncedSet = debounce((value: number[]) => {
            if (!localStorage || !localStorage.setItem) {
                return
            }
            localStorage.setItem(this.key, JSON.stringify(value))
        }, 1000)
    }

    public get(): number[] | undefined {
        if (!localStorage || !localStorage.getItem) {
            return undefined
        }
        const raw = localStorage.getItem(this.key)
        if (!raw) {
            return undefined
        }
        try {
            const value = JSON.parse(raw)
            if (!Array.isArray(value)) {
                return undefined
            }
            if (value.some((size) => typeof size !== 'number')) {
                return undefined
            }
            return value
        } catch (e) {
            return undefined
        }
    }

    public set(value: number[]): void {
        this.debouncedSet(value)
    }
}
