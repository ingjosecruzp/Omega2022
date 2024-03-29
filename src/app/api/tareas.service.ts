import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiBase } from './apiBase';

@Injectable({
  providedIn: 'root'
})
export class TareasService  extends apiBase {

  constructor(public http: HttpClient) {
    super();
    this.Ws = 'api/tareas';
   }

  save(item: any) {
    return this.http.post(`${this.url}/${this.Ws}`, item);
  }

  update(item: any) {
    console.log(item);
    return this.http.put(`${this.url}/${this.Ws}/${item.Id}`, item);
  }

  get(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/${this.Ws}`);
  }

  getInfinite(skip,take): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/${this.Ws}/infinite/${skip}/${take}`);
  }
  getTareasMateriasInfinite(id,skip,take): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/${this.Ws}/materiaInfinite/${id}/${skip}/${take}`);
  }

  getTareasMaterias(id): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/${this.Ws}/materia/${id}`);
  }

  delete(Id: any) {
    return this.http.delete(`${this.url}/${this.Ws}/${Id}`);
  }

  updateAcceso(Id) {
    return this.http.put(`${this.url}/${this.Ws}/updateAcceso/${Id}`,null);
  }

}
