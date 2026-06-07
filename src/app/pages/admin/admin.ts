import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Utils } from '../../services/utils';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-admin',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminPage {
  readonly utils = inject(Utils);
}
