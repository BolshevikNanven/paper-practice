declare module 'pdfjs-dist/build/pdf.min.mjs' {
    // 这一行的意思是：导出 'pdfjs-dist' 主包的所有类型
    // 这样你不仅消除了报错，还能获得完整的代码提示
    export * from 'pdfjs-dist'
}
