import { createClient } from '@liveblocks/client'

const publicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY

export const liveblocks = publicKey ? createClient({
  publicApiKey: publicKey
}) : null