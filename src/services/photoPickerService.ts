export interface PhotoPickerService {
  pickOne(): Promise<File | undefined>
  pickMany(limit: number): Promise<File[]>
}

export class WebPhotoPickerService implements PhotoPickerService {
  async pickOne(): Promise<File | undefined> {
    return (await this.pick(false, 1))[0]
  }

  pickMany(limit: number) {
    if (!Number.isInteger(limit) || limit < 1) return Promise.reject(new Error('Photo picker limit must be a positive integer'))
    return this.pick(true, limit)
  }

  private pick(multiple: boolean, limit: number): Promise<File[]> {
    if (typeof document === 'undefined') return Promise.reject(new Error('Photo picker is unavailable'))
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = multiple
    input.hidden = true
    document.body.append(input)

    return new Promise((resolve) => {
      let settled = false
      const finish = (files: File[]) => {
        if (settled) return
        settled = true
        input.removeEventListener('change', onChange)
        input.removeEventListener('cancel', onCancel)
        input.remove()
        resolve(files.filter((file) => file.type.startsWith('image/')).slice(0, limit))
      }
      const onChange = () => finish(Array.from(input.files ?? []))
      const onCancel = () => finish([])
      input.addEventListener('change', onChange)
      input.addEventListener('cancel', onCancel)
      input.click()
    })
  }
}
