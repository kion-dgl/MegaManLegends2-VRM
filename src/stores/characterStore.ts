import { atom } from 'nanostores';

export interface Character {
    name: string;
    file: string;
    texture: string;
}

// Default selected character (can be null or pre-set)
export const selectedCharacter = atom<Character | null>(null);
