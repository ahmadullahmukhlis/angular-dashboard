import { Component, inject } from '@angular/core';
import { SidebarService } from './services/sidebar.service';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [ToastModule, ConfirmDialogModule, RouterModule], // remove MainContent import!
})
export class App {
  title = ' Dashboard';

  

}
