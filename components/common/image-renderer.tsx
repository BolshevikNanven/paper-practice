'use client'

import { HTMLProps, memo, useEffect, useState } from 'react'

interface Props extends Omit<HTMLProps<HTMLImageElement>, 'src'> {
    src: Blob | string
}
export default memo(function ImageRenderer({ src, ...props }: Props) {
    const [imageUrl, setImageUrl] = useState('')

    useEffect(() => {
        if (src instanceof Blob) {
            const url = URL.createObjectURL(src)
            setImageUrl(url)
            return () => {
                URL.revokeObjectURL(url)
            }
        }

        setImageUrl(src)
    }, [src])

    if (imageUrl !== '') {
        return <img src={imageUrl} alt={props.alt} {...props} />
    }
})
