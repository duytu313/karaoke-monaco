declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

declare module 'tw-animate-css' {
  const content: string
  export default content
}