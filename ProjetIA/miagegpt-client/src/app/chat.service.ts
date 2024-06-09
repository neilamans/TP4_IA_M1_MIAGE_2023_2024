import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private apiUrl = 'http://localhost:3001';

  constructor(private http: HttpClient) { }

  sendMessage(prompt: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/chat`, { prompt });
  }

  generateImage(prompt: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/image`, { prompt });
  }
}
