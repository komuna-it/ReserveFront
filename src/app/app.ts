import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './layout/navbar/navbar';
import { CookieBarComponent } from './layout/cookie-bar/cookie-bar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, CookieBarComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {}
