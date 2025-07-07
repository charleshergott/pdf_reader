import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent {

  selectedFile: File | null = null;
  pdfUrl: SafeResourceUrl | null = null;
  error: string | null = null;

  constructor(
    private sanitizer: DomSanitizer
  ) { }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.error = null;

      if (file.type === 'application/pdf') {
        this.selectedFile = file;
        this.loadPdf(file);
      } else {
        this.error = 'Please select a valid PDF file.';
        this.selectedFile = null;
        this.pdfUrl = null;
      }
    }
  }

  private loadPdf(file: File): void {
    const fileUrl = URL.createObjectURL(file);
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
