type Controllers = Set<ReadableStreamDefaultController>
const controllers: Controllers = new Set()

export function subscribe(controller: ReadableStreamDefaultController) {
  controllers.add(controller)
  return () => controllers.delete(controller)
}

export function publish(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  controllers.forEach((c) => {
    try {
      c.enqueue(new TextEncoder().encode(payload))
    } catch {
      controllers.delete(c)
    }
  })
}

export function jobBroadcast(data: any) {
  publish('job_update', data)
}

export function postBroadcast(data: any) {
  publish('post_update', data)
}

export function notificationBroadcast(data: any) {
  publish('notification_update', data)
}
