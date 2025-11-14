'use client'

import { HTMLProps, memo, useEffect, useMemo } from 'react'

interface Props extends Omit<HTMLProps<HTMLImageElement>, 'src'> {
    src: Blob | string
}
export default memo(function ImageRenderer({ src, ...props }: Props) {
    const imageUrl = useMemo(() => {
        if (typeof src === 'string') {
            return src
        }
        const url = URL.createObjectURL(src)

        return url
    }, [src])

    useEffect(
        () => () => {
            URL.revokeObjectURL(imageUrl)
        },
        [imageUrl],
    )

    if (imageUrl !== '') {
        return <img src={imageUrl} alt={props.alt} {...props} />
    }
})
