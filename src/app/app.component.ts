import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


declare const pdfjsLib: any;

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
  showModal: boolean = false;
  extractedText: string = '';
  isExtracting: boolean = false;
  copySuccess: boolean = false;

  constructor(private sanitizer: DomSanitizer) {
    // Set PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }

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
    console.log('Created object URL:', fileUrl); // Debug log
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    console.log('Sanitized URL:', this.pdfUrl); // Debug log
  }

  onIframeLoad(): void {
    console.log('Iframe loaded successfully');
  }

  onIframeError(event: any): void {
    console.error('Iframe error:', event);
    this.error = 'Failed to display PDF preview';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async extractText(): Promise<void> {
    if (!this.selectedFile) return;

    this.isExtracting = true;
    this.error = null;

    try {
      const arrayBuffer = await this.selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }

      this.extractedText = fullText;
      this.showModal = true;
    } catch (error) {
      console.error('Error extracting text:', error);
      this.error = 'Failed to extract text from PDF. The file might be corrupted or password-protected.';
    } finally {
      this.isExtracting = false;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.copySuccess = false;
  }

  async copyText(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.extractedText);
      this.copySuccess = true;
      setTimeout(() => {
        this.copySuccess = false;
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      // Fallback for older browsers
      this.fallbackCopyText();
    }
  }

  private fallbackCopyText(): void {
    const textArea = document.createElement('textarea');
    textArea.value = this.extractedText;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.copySuccess = true;
      setTimeout(() => {
        this.copySuccess = false;
      }, 2000);
    } catch (error) {
      console.error('Fallback copy failed:', error);
    }
    document.body.removeChild(textArea);
  }
}
