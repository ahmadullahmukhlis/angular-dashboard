import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';

@Component({
  selector: 'app-main-content',
  standalone: true, // <-- important
  imports: [CommonModule, RouterModule, Sidebar, Header],
  templateUrl: './main-content.html',
  styleUrls: ['./main-content.css'], // <-- fix here
})
export class MainContent {}
