import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
import { initSocketIO } from '@/lib/socket'

export default function SocketHandler(req: NextApiRequest, res: any) {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = initSocketIO(res.socket.server)
    res.socket.server.io = io
  }
  res.end()
}
