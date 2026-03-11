import { Component } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'home-page',
  standalone: true,
  imports: [NgIf], 
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})

export class HomePage {}
