import { PresetPracticeMapData } from '@/store/interface'

let presetPracticeSet: PresetPracticeMapData[] | undefined

export async function getPresetPracticeSets() {
    if (!presetPracticeSet) {
        await fetch('/practices/map.json')
            .then(res => res.json())
            .then(data => (presetPracticeSet = data))
            .catch(console.error)
    }

    return (presetPracticeSet || []) as PresetPracticeMapData[]
}
