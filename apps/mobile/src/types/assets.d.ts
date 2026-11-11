// Metro는 이미지·글꼴 import를 에셋 번호(number)로 바꾼다. Image source와 useFonts가 이 값을 받는다.
declare module '*.png' {
  const asset: number;
  export default asset;
}
declare module '*.webp' {
  const asset: number;
  export default asset;
}
declare module '*.otf' {
  const asset: number;
  export default asset;
}
declare module '*.ttf' {
  const asset: number;
  export default asset;
}
