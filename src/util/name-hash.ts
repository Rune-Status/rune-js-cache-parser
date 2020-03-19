export function hash(name: string): number {
    let hash = 0;

    for(let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return hash;
}
