export const EXPRESSIONS = [
    { id: "happy", label: "활짝", text: "^ㅁ^" },
    { id: "soft", label: "방긋", text: "^_^" },
    { id: "blank", label: "멍", text: "ㅇㅅㅇ" },
    { id: "squint", label: "찡긋", text: ">_<" },
    { id: "cry", label: "울음", text: "ㅠㅠ" },
    { id: "teary", label: "훌쩍", text: ";ㅁ;" },
    { id: "kiss", label: "삐죽", text: "-3-" },
    { id: "dot", label: "정적", text: "._." },
    { id: "surprise", label: "놀람", text: "ㅇㅁㅇ" },
    { id: "kiss2", label: "쪽", text: "^3^" },
    { id: "sleep", label: "졸림", text: "-_-" },
    { id: "dizzy", label: "혼란", text: "@ㅁ@" }
];
export const DEFAULT_EXPRESSION = "happy";
export function expressionAtTime(keyframes, time) {
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);
    let current = DEFAULT_EXPRESSION;
    for (const keyframe of sorted) {
        if (keyframe.time <= time + 0.0001) current = keyframe.expressionId;
        else break;
    }
    return current;
}
function scoreMap(blendshapes) {
    return new Map(blendshapes.map((item) => [item.categoryName ?? item.displayName ?? "", item.score ?? 0]));
}
export function automaticExpression(blendshapes, fallback) {
    if (!blendshapes.length) return fallback;
    const s = scoreMap(blendshapes);
    const leftBlink = s.get("eyeBlinkLeft") ?? 0;
    const rightBlink = s.get("eyeBlinkRight") ?? 0;
    const jawOpen = s.get("jawOpen") ?? 0;
    const smile = (s.get("mouthSmileLeft") ?? 0) + (s.get("mouthSmileRight") ?? 0);
    const browDown = (s.get("browDownLeft") ?? 0) + (s.get("browDownRight") ?? 0);
    const mouthPucker = s.get("mouthPucker") ?? 0;
    if (jawOpen > 0.52) return "surprise";
    if (leftBlink > 0.58 && rightBlink > 0.58) return "sleep";
    if (smile > 0.95) return "happy";
    if (browDown > 0.95) return "squint";
    if (mouthPucker > 0.6) return "kiss";
    return fallback;
}
export function getExpression(id) {
    return EXPRESSIONS.find((item) => item.id === id) ?? EXPRESSIONS[0];
}
