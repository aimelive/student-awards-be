export class HttpResponse<T = any> {
  message: string;
  _count?: number;
  data?: T;

  constructor(message: string, data?: T) {
    this.message = message;
    if (data && Array.isArray(data)) {
      this._count = data.length;
    }
    this.data = data;
  }
}
