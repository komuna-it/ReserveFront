import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'home-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomePage {
  images = [
    'assets/images/tlo1.jfif',
    'assets/images/tlo2.png',
    'assets/images/tlo3.jpg'
  ];

  current = signal(0);

  constructor() {
    setInterval(() => {
      this.next();
    }, 5000);
  }

  next() {
    this.current.set((this.current() + 1) % this.images.length);
  }

  prev() {
    this.current.set((this.current() - 1 + this.images.length) % this.images.length);
  }

  currentImage = computed(() => this.images[this.current()]);
}