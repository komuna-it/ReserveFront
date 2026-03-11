import { Component } from '@angular/core';
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

  current = 0;

  constructor() {
    setInterval(() => this.next(), 3000);
  }

  next() {
    this.current = (this.current + 1) % this.images.length;
  }

  prev() {
    this.current = (this.current - 1 + this.images.length) % this.images.length;
  }
}