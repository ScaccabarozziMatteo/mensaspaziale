import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit, NgZone
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Client } from 'appwrite';
import { environment } from '../environments/environment';

interface Log {
  date: Date;
  method: string;
  path: string;
  status: number;
  response: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, DatePipe],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('detailsRef') detailsRef!: ElementRef;

  detailHeight: number = 0;
  private resizeObserver!: ResizeObserver;
  logs: Log[] = [];
  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  showLogs: boolean = false;

  // Environment variables - you'll need to set these up in your environment.ts
  endpoint = environment.appwriteEndpoint;
  projectId = environment.appwriteProjectId;
  projectName = environment.appwriteProjectName;

  private client: Client;

  constructor(private zone: NgZone) {
    this.client = new Client()
      .setEndpoint(environment.appwriteEndpoint)
      .setProject(environment.appwriteProjectId);
  }

  ngAfterViewInit() {
    this.resizeObserver = new ResizeObserver(entries => {
      this.zone.run(() => {
        for (let entry of entries) {
          if (entry.target === this.detailsRef?.nativeElement) {
            this.detailHeight = entry.contentRect.height;
          }
        }
      })
    });
    this.resizeObserver.observe(this.detailsRef.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver.unobserve(this.detailsRef.nativeElement);
  }

  async sendPing() {
    if (this.status === 'loading') return;
    this.status = 'loading';

    try {
      const result = await this.client.ping();
      const log: Log = {
        date: new Date(),
        method: 'GET',
        path: '/v1/ping',
        status: 200,
        response: JSON.stringify(result),
      };
      this.logs = [log, ...this.logs];
      this.status = 'success';
    } catch (err: any) {
      const log: Log = {
        date: new Date(),
        method: 'GET',
        path: '/v1/ping',
        status: err instanceof Error ? 500 : err.code,
        response: err instanceof Error ? 'Something went wrong' : err.message,
      };
      this.logs = [log, ...this.logs];
      this.status = 'error';
    }
    this.showLogs = true;
  }
}
