import { Component, inject } from '@angular/core';
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [  RouterModule], // remove MainContent import!
})
export class App {
  title = ' Dashboard';

  

}
